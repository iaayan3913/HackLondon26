from __future__ import annotations

from typing import Any

try:
    from ..models import AttemptAnswer
    from ..models import Quiz
    from ..models import QuizAttempt
    from ..models import Question
    from ..schemas import AttemptAnswerRead
    from ..schemas import AttemptSessionRead
    from ..schemas import AttemptSummaryRead
    from ..schemas import QuestionRead
    from ..schemas import QuizRead
except ImportError:  # pragma: no cover - allows top-level module imports
    from models import AttemptAnswer
    from models import Quiz
    from models import QuizAttempt
    from models import Question
    from schemas import AttemptAnswerRead
    from schemas import AttemptSessionRead
    from schemas import AttemptSummaryRead
    from schemas import QuestionRead
    from schemas import QuizRead


def question_to_schema(question: Question) -> QuestionRead:
    options = question.options_json if question.options_json else None
    explanation = question.explanation_json if question.explanation_json else None
    return QuestionRead(
        id=question.id,
        quiz_id=question.quiz_id,
        type=question.type.value,
        question_text=question.question_text,
        options=options,
        correct_option=question.correct_option,
        explanation=explanation,
    )


def _compute_percentage(total_score: float, question_count: int) -> float:
    if question_count <= 0:
        return 0.0
    return round((total_score / question_count) * 100, 2)


def quiz_to_schema(quiz: Quiz) -> QuizRead:
    question_count = len(quiz.questions)
    attempt_count = len(quiz.attempts)
    completed_attempts = [attempt for attempt in quiz.attempts if attempt.status.value == "completed"]
    best_score = None
    if completed_attempts and question_count > 0:
        best_score = max(_compute_percentage(attempt.total_score, question_count) for attempt in completed_attempts)

    return QuizRead(
        id=quiz.id,
        user_id=quiz.user_id,
        title=quiz.title,
        subject=quiz.subject,
        description=quiz.description,
        created_at=quiz.created_at,
        updated_at=quiz.updated_at,
        question_count=question_count,
        attempt_count=attempt_count,
        best_score=best_score,
    )


def attempt_to_summary(attempt: QuizAttempt, question_count: int) -> AttemptSummaryRead:
    return AttemptSummaryRead(
        id=attempt.id,
        quiz_id=attempt.quiz_id,
        status=attempt.status.value,
        started_at=attempt.started_at,
        completed_at=attempt.completed_at,
        total_score=attempt.total_score,
        percentage=_compute_percentage(attempt.total_score, question_count),
    )


def build_attempt_session(attempt: QuizAttempt) -> AttemptSessionRead:
    quiz_questions: list[Question] = sorted(attempt.quiz.questions, key=lambda item: item.id)
    answer_map: dict[int, AttemptAnswer] = {answer.question_id: answer for answer in attempt.answers}

    current_question_index = 0
    for idx, question in enumerate(quiz_questions):
        answer = answer_map.get(question.id)
        if not answer or not answer.user_answer.strip():
            current_question_index = idx
            break
    else:
        current_question_index = max(len(quiz_questions) - 1, 0)

    answers = [
        AttemptAnswerRead(
            question_id=answer.question_id,
            user_answer=answer.user_answer,
            score=answer.score,
            ai_feedback=answer.ai_feedback,
            updated_at=answer.updated_at,
        )
        for answer in sorted(attempt.answers, key=lambda item: item.question_id)
    ]

    question_count = len(quiz_questions)
    return AttemptSessionRead(
        id=attempt.id,
        quiz_id=attempt.quiz_id,
        status=attempt.status.value,
        started_at=attempt.started_at,
        completed_at=attempt.completed_at,
        total_score=attempt.total_score,
        percentage=_compute_percentage(attempt.total_score, question_count),
        current_question_index=current_question_index,
        questions=[question_to_schema(question) for question in quiz_questions],
        answers=answers,
    )


def build_reference_text(quiz: Quiz) -> str:
    chunks: list[str] = []
    if quiz.title:
        chunks.append(f"Quiz title: {quiz.title}")
    if quiz.subject:
        chunks.append(f"Subject: {quiz.subject}")
    if quiz.description:
        chunks.append(f"Description: {quiz.description}")

    for question in quiz.questions:
        chunks.append(f"Q: {question.question_text}")
        explanation = (question.explanation_json or {}).get("text") if isinstance(question.explanation_json, dict) else None
        if explanation:
            chunks.append(f"Reference explanation: {explanation}")

    text = "\n".join(chunks)
    return text[:100_000]


def update_question_from_payload(question: Question, payload: dict[str, Any]) -> None:
    if "type" in payload and payload["type"] is not None:
        question.type = payload["type"]

    if "question_text" in payload and payload["question_text"] is not None:
        question.question_text = payload["question_text"]

    if "options" in payload:
        question.options_json = payload["options"]

    if "correct_option" in payload:
        question.correct_option = payload["correct_option"]

    if "explanation" in payload:
        question.explanation_json = payload["explanation"]
