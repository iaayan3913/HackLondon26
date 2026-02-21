from __future__ import annotations

from datetime import datetime
import logging

from fastapi import APIRouter
from fastapi import Depends
from fastapi import File
from fastapi import Form
from fastapi import HTTPException
from fastapi import Query
from fastapi import UploadFile
from fastapi import status
from sqlalchemy import delete
from sqlalchemy import func
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

try:
    from ..database import get_db
    from ..dependencies import get_gemini_service
    from ..models import Question
    from ..models import QuestionType
    from ..models import Quiz
    from ..models import QuizAttempt
    from ..models import AttemptStatus
    from ..schemas import AttemptCreate
    from ..schemas import AttemptListRead
    from ..schemas import AttemptSessionRead
    from ..schemas import GenerateResponse
    from ..schemas import PaginatedQuizzes
    from ..schemas import QuestionCreate
    from ..schemas import QuestionListRead
    from ..schemas import QuestionRead
    from ..schemas import QuestionUpdate
    from ..schemas import QuizCreate
    from ..schemas import QuizDetailRead
    from ..schemas import QuizRead
    from ..schemas import QuizUpdate
    from ..services.extract import UnsupportedFileTypeError
    from ..services.extract import ephemeral_upload
    from ..services.extract import extract_text
    from ..services.extract import validate_upload_file
    from ..services.gemini import GeminiResponseError
    from ..services.gemini import GeminiService
    from .utils import attempt_to_summary
    from .utils import build_attempt_session
    from .utils import question_to_schema
    from .utils import quiz_to_schema
    from .utils import update_question_from_payload
except ImportError:  # pragma: no cover - allows top-level module imports
    from database import get_db
    from dependencies import get_gemini_service
    from models import Question
    from models import QuestionType
    from models import Quiz
    from models import QuizAttempt
    from models import AttemptStatus
    from schemas import AttemptCreate
    from schemas import AttemptListRead
    from schemas import AttemptSessionRead
    from schemas import GenerateResponse
    from schemas import PaginatedQuizzes
    from schemas import QuestionCreate
    from schemas import QuestionListRead
    from schemas import QuestionRead
    from schemas import QuestionUpdate
    from schemas import QuizCreate
    from schemas import QuizDetailRead
    from schemas import QuizRead
    from schemas import QuizUpdate
    from services.extract import UnsupportedFileTypeError
    from services.extract import ephemeral_upload
    from services.extract import extract_text
    from services.extract import validate_upload_file
    from services.gemini import GeminiResponseError
    from services.gemini import GeminiService
    from routers.utils import attempt_to_summary
    from routers.utils import build_attempt_session
    from routers.utils import question_to_schema
    from routers.utils import quiz_to_schema
    from routers.utils import update_question_from_payload


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["quizzes"])


TEST_USER_ID = 1


def _get_quiz_or_404(db: Session, quiz_id: int, *, include_children: bool = False) -> Quiz:
    stmt = select(Quiz).where(Quiz.id == quiz_id, Quiz.user_id == TEST_USER_ID)
    if include_children:
        stmt = stmt.options(selectinload(Quiz.questions), selectinload(Quiz.attempts), selectinload(Quiz.attempts).selectinload(QuizAttempt.answers))

    quiz = db.scalar(stmt)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return quiz


def _build_options(options: list[str]) -> list[dict[str, str]]:
    keys = ["A", "B", "C", "D"]
    payload: list[dict[str, str]] = []
    for idx, option in enumerate(options[:4]):
        payload.append({"key": keys[idx], "text": option})
    return payload


@router.get("/quizzes", response_model=PaginatedQuizzes)
def list_quizzes(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> PaginatedQuizzes:
    total = db.scalar(select(func.count()).select_from(Quiz).where(Quiz.user_id == TEST_USER_ID)) or 0
    total_pages = max(1, (total + page_size - 1) // page_size)
    offset = (page - 1) * page_size

    quizzes = db.scalars(
        select(Quiz)
        .where(Quiz.user_id == TEST_USER_ID)
        .options(selectinload(Quiz.questions), selectinload(Quiz.attempts))
        .order_by(Quiz.created_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()

    return PaginatedQuizzes(
        items=[quiz_to_schema(quiz) for quiz in quizzes],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )


@router.post("/quizzes", response_model=QuizRead, status_code=status.HTTP_201_CREATED)
def create_quiz(payload: QuizCreate, db: Session = Depends(get_db)) -> QuizRead:
    quiz = Quiz(
        user_id=TEST_USER_ID,
        title=payload.title,
        subject=payload.subject,
        description=payload.description,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    db.refresh(quiz, attribute_names=["questions", "attempts"])
    return quiz_to_schema(quiz)


@router.get("/quizzes/{quiz_id}", response_model=QuizDetailRead)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)) -> QuizDetailRead:
    quiz = _get_quiz_or_404(db, quiz_id, include_children=True)
    return QuizDetailRead(**quiz_to_schema(quiz).model_dump())


@router.patch("/quizzes/{quiz_id}", response_model=QuizRead)
def update_quiz(quiz_id: int, payload: QuizUpdate, db: Session = Depends(get_db)) -> QuizRead:
    quiz = _get_quiz_or_404(db, quiz_id, include_children=True)
    updates = payload.model_dump(exclude_unset=True)

    if "title" in updates:
        quiz.title = updates["title"]
    if "subject" in updates:
        quiz.subject = updates["subject"]
    if "description" in updates:
        quiz.description = updates["description"]

    quiz.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(quiz)
    db.refresh(quiz, attribute_names=["questions", "attempts"])
    return quiz_to_schema(quiz)


@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(quiz_id: int, db: Session = Depends(get_db)) -> None:
    quiz = _get_quiz_or_404(db, quiz_id)
    db.delete(quiz)
    db.commit()


@router.get("/quizzes/{quiz_id}/questions", response_model=QuestionListRead)
def list_questions(quiz_id: int, db: Session = Depends(get_db)) -> QuestionListRead:
    _get_quiz_or_404(db, quiz_id)
    questions = db.scalars(select(Question).where(Question.quiz_id == quiz_id).order_by(Question.id.asc())).all()
    return QuestionListRead(items=[question_to_schema(question) for question in questions])


@router.post("/quizzes/{quiz_id}/questions", response_model=QuestionRead, status_code=status.HTTP_201_CREATED)
def create_question(quiz_id: int, payload: QuestionCreate, db: Session = Depends(get_db)) -> QuestionRead:
    _get_quiz_or_404(db, quiz_id)

    question = Question(
        quiz_id=quiz_id,
        type=QuestionType(payload.type.value),
        question_text=payload.question_text,
        options_json=[option.model_dump() for option in payload.options] if payload.options else None,
        correct_option=payload.correct_option,
        explanation_json=payload.explanation or {},
    )

    db.add(question)
    db.commit()
    db.refresh(question)
    return question_to_schema(question)


@router.patch("/questions/{question_id}", response_model=QuestionRead)
def update_question(question_id: int, payload: QuestionUpdate, db: Session = Depends(get_db)) -> QuestionRead:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    quiz = _get_quiz_or_404(db, question.quiz_id)
    if quiz.user_id != TEST_USER_ID:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    updates = payload.model_dump(exclude_unset=True)
    normalized_updates: dict[str, object] = {}

    if "type" in updates and updates["type"] is not None:
        normalized_updates["type"] = QuestionType(updates["type"].value)

    if "question_text" in updates:
        normalized_updates["question_text"] = updates["question_text"]

    if "options" in updates:
        normalized_updates["options"] = [item.model_dump() for item in (updates["options"] or [])] or None

    if "correct_option" in updates:
        normalized_updates["correct_option"] = updates["correct_option"]

    if "explanation" in updates:
        normalized_updates["explanation"] = updates["explanation"] or {}

    update_question_from_payload(question, normalized_updates)

    db.commit()
    db.refresh(question)
    return question_to_schema(question)


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(question_id: int, db: Session = Depends(get_db)) -> None:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    _get_quiz_or_404(db, question.quiz_id)
    db.delete(question)
    db.commit()


@router.post("/quizzes/{quiz_id}/generate", response_model=GenerateResponse)
async def generate_questions_for_quiz(
    quiz_id: int,
    file: UploadFile = File(...),
    mcq_count: int = Form(default=5, ge=0, le=50),
    open_count: int = Form(default=2, ge=0, le=50),
    difficulty: str = Form(default="intermediate"),
    db: Session = Depends(get_db),
    gemini_service: GeminiService = Depends(get_gemini_service),
) -> GenerateResponse:
    if mcq_count + open_count <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one question must be requested")

    quiz = _get_quiz_or_404(db, quiz_id)

    try:
        suffix = validate_upload_file(file)
    except UnsupportedFileTypeError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error

    logger.info(
        "event=generation_request_start quiz_id=%s filename=%s mcq_count=%s open_count=%s",
        quiz_id,
        file.filename,
        mcq_count,
        open_count,
    )

    try:
        async with ephemeral_upload(file, suffix) as temp_path:
            extracted_text, was_truncated = extract_text(temp_path, suffix)
    except Exception as error:
        logger.exception("event=file_extraction_failed quiz_id=%s filename=%s", quiz_id, file.filename)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to parse uploaded file") from error

    if not extracted_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file produced no extractable text")

    try:
        generated_questions, llm_latency_ms = gemini_service.generate_questions(
            source_text=extracted_text,
            title=quiz.title,
            mcq_count=mcq_count,
            open_count=open_count,
            difficulty=difficulty,
        )
    except GeminiResponseError as error:
        logger.exception("event=generation_failed quiz_id=%s", quiz_id)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to generate quiz questions") from error

    logger.info(
        "event=generation_request_complete quiz_id=%s question_count=%s llm_latency_ms=%s truncated=%s",
        quiz_id,
        len(generated_questions),
        llm_latency_ms,
        was_truncated,
    )

    db.execute(delete(Question).where(Question.quiz_id == quiz_id))

    persisted: list[Question] = []
    for generated in generated_questions:
        is_mcq = generated.type == "mcq"
        question = Question(
            quiz_id=quiz_id,
            type=QuestionType.mcq if is_mcq else QuestionType.open,
            question_text=generated.question_text,
            options_json=_build_options(generated.options or []) if is_mcq else None,
            correct_option=generated.correct_option if is_mcq else None,
            explanation_json={"text": generated.explanation},
        )
        db.add(question)
        persisted.append(question)

    db.commit()

    # Verify questions are queryable before returning — prevents race
    # conditions where the response arrives at the client before the DB
    # write is fully visible (e.g. WAL-mode SQLite readers).
    verified = db.scalars(
        select(Question).where(Question.quiz_id == quiz_id).order_by(Question.id.asc())
    ).all()

    if len(verified) != len(persisted):
        logger.warning(
            "event=generation_verification_mismatch quiz_id=%s expected=%s actual=%s",
            quiz_id,
            len(persisted),
            len(verified),
        )

    return GenerateResponse(
        created_count=len(verified),
        questions=[question_to_schema(q) for q in verified],
        llm_latency_ms=llm_latency_ms,
    )


@router.get("/quizzes/{quiz_id}/attempts", response_model=AttemptListRead)
def list_attempts(
    quiz_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> AttemptListRead:
    quiz = _get_quiz_or_404(db, quiz_id, include_children=True)

    total = db.scalar(select(func.count()).select_from(QuizAttempt).where(QuizAttempt.quiz_id == quiz_id)) or 0
    offset = (page - 1) * page_size

    attempts = db.scalars(
        select(QuizAttempt)
        .where(QuizAttempt.quiz_id == quiz_id)
        .order_by(QuizAttempt.started_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()

    question_count = len(quiz.questions)
    return AttemptListRead(
        items=[attempt_to_summary(attempt, question_count) for attempt in attempts],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("/quizzes/{quiz_id}/attempts", response_model=AttemptSessionRead, status_code=status.HTTP_201_CREATED)
def create_or_resume_attempt(
    quiz_id: int,
    payload: AttemptCreate,
    db: Session = Depends(get_db),
) -> AttemptSessionRead:
    quiz = _get_quiz_or_404(db, quiz_id, include_children=True)

    if not quiz.questions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz has no questions")

    if payload.resume_if_exists:
        existing = db.scalar(
            select(QuizAttempt)
            .where(QuizAttempt.quiz_id == quiz_id, QuizAttempt.status == AttemptStatus.in_progress)
            .order_by(QuizAttempt.started_at.desc())
            .options(selectinload(QuizAttempt.quiz).selectinload(Quiz.questions), selectinload(QuizAttempt.answers))
        )
        if existing:
            return build_attempt_session(existing)

    attempt = QuizAttempt(quiz_id=quiz_id, status=AttemptStatus.in_progress)
    db.add(attempt)
    db.commit()

    attempt = db.scalar(
        select(QuizAttempt)
        .where(QuizAttempt.id == attempt.id)
        .options(selectinload(QuizAttempt.quiz).selectinload(Quiz.questions), selectinload(QuizAttempt.answers))
    )
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to initialize attempt")

    return build_attempt_session(attempt)
