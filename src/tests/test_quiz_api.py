from __future__ import annotations

import io

from fastapi.testclient import TestClient
import pytest
from starlette.datastructures import UploadFile

from src.database import Base
from src.database import engine
from src.database import ensure_test_user
from src.dependencies import get_gemini_service
from src.dependencies import get_grading_service
from src.main import app
from src.services.extract import ephemeral_upload
from src.services.extract import validate_upload_file


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    ensure_test_user()
    yield


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


class _FakeGemini:
    def generate_questions(self, *, source_text, title, mcq_count, open_count, difficulty):
        questions = []
        for _ in range(mcq_count):
            questions.append(
                type(
                    'GeneratedQuestion',
                    (),
                    {
                        'type': 'mcq',
                        'question_text': 'What is the key concept?',
                        'options': ['One', 'Two', 'Three', 'Four'],
                        'correct_option': 'A',
                        'explanation': 'Because A is the supported statement.',
                    },
                )()
            )
        for _ in range(open_count):
            questions.append(
                type(
                    'GeneratedQuestion',
                    (),
                    {
                        'type': 'open',
                        'question_text': 'Explain the concept in your own words.',
                        'options': None,
                        'correct_option': None,
                        'explanation': 'Strong answers should be concise and accurate.',
                    },
                )()
            )
        return questions, 123


class _FakeGrader:
    def grade_answer(self, **kwargs):
        return 2.5, 'High confidence answer.', 'fake'


def create_quiz(client: TestClient) -> int:
    response = client.post(
        '/api/quizzes',
        json={
            'title': 'Test Quiz',
            'subject': 'Biology',
            'description': 'Demo quiz',
        },
    )
    assert response.status_code == 201
    return response.json()['id']


def test_quiz_crud_and_pagination(client: TestClient):
    for index in range(3):
        response = client.post(
            '/api/quizzes',
            json={
                'title': f'Quiz {index}',
                'subject': 'General',
                'description': '',
            },
        )
        assert response.status_code == 201

    listed = client.get('/api/quizzes?page=1&page_size=10')
    assert listed.status_code == 200
    payload = listed.json()
    assert payload['total'] == 3
    assert len(payload['items']) == 3


def test_generation_rejects_unsupported_file(client: TestClient):
    quiz_id = create_quiz(client)

    response = client.post(
        f'/api/quizzes/{quiz_id}/generate',
        files={'file': ('photo.jpg', b'not supported', 'image/jpeg')},
        data={'mcq_count': '2', 'open_count': '1', 'difficulty': 'intermediate'},
    )

    assert response.status_code == 400
    assert 'supported' in response.json()['detail'].lower()


def test_generation_and_attempt_flow(client: TestClient):
    app.dependency_overrides[get_gemini_service] = lambda: _FakeGemini()

    quiz_id = create_quiz(client)

    generated = client.post(
        f'/api/quizzes/{quiz_id}/generate',
        files={'file': ('notes.txt', b'Cells are the basic unit of life.', 'text/plain')},
        data={'mcq_count': '1', 'open_count': '1', 'difficulty': 'intermediate'},
    )

    assert generated.status_code == 200
    generated_payload = generated.json()
    assert generated_payload['created_count'] == 2

    attempt = client.post(f'/api/quizzes/{quiz_id}/attempts', json={'resume_if_exists': True})
    assert attempt.status_code == 201
    attempt_payload = attempt.json()
    attempt_id = attempt_payload['id']
    assert len(attempt_payload['questions']) == 2

    mcq_question = next(question for question in attempt_payload['questions'] if question['type'] == 'mcq')

    answer = client.put(
        f'/api/attempts/{attempt_id}/answers/{mcq_question["id"]}',
        json={'user_answer': 'A'},
    )
    assert answer.status_code == 200
    assert answer.json()['score'] == 1.0

    resumed = client.post(f'/api/quizzes/{quiz_id}/attempts', json={'resume_if_exists': True})
    assert resumed.status_code == 201
    assert resumed.json()['id'] == attempt_id

    completed = client.post(f'/api/attempts/{attempt_id}/complete')
    assert completed.status_code == 200
    assert completed.json()['percentage'] >= 50

    results = client.get(f'/api/attempts/{attempt_id}/results')
    assert results.status_code == 200
    assert len(results.json()['questions']) == 2

    app.dependency_overrides.clear()


def test_open_answer_score_is_clamped(client: TestClient):
    app.dependency_overrides[get_grading_service] = lambda: _FakeGrader()

    quiz_id = create_quiz(client)
    question_response = client.post(
        f'/api/quizzes/{quiz_id}/questions',
        json={
            'type': 'open',
            'question_text': 'Describe osmosis',
            'explanation': {'text': 'Mention diffusion through a semipermeable membrane.'},
        },
    )
    assert question_response.status_code == 201
    question_id = question_response.json()['id']

    attempt = client.post(f'/api/quizzes/{quiz_id}/attempts', json={'resume_if_exists': False})
    attempt_id = attempt.json()['id']

    answered = client.put(
        f'/api/attempts/{attempt_id}/answers/{question_id}',
        json={'user_answer': 'Water moves across a membrane.'},
    )
    assert answered.status_code == 200
    assert answered.json()['score'] == 1.0

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ephemeral_upload_cleanup():
    upload = UploadFile(filename='notes.txt', file=io.BytesIO(b'hello world'))
    suffix = validate_upload_file(upload)

    temp_path = None
    async with ephemeral_upload(upload, suffix) as path:
        temp_path = path
        assert temp_path.exists()

    assert temp_path is not None
    assert not temp_path.exists()
