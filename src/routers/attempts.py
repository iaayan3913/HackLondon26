from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

try:
    from ..database import get_db
    from ..dependencies import get_grading_service
    from ..models import AttemptAnswer
    from ..models import AttemptStatus
    from ..models import QuestionType
    from ..models import Quiz
    from ..models import QuizAttempt
    from ..schemas import AnswerResult
    from ..schemas import AnswerUpsert
    from ..schemas import AttemptCompleteRead
    from ..schemas import AttemptResultQuestionRead
    from ..schemas import AttemptResultRead
    from ..schemas import AttemptSessionRead
    from ..services.grading import GradingService
    from .utils import build_attempt_session
    from .utils import build_reference_text
except ImportError:  # pragma: no cover - allows top-level module imports
    from database import get_db
    from dependencies import get_grading_service
    from models import AttemptAnswer
    from models import AttemptStatus
    from models import QuestionType
    from models import Quiz
    from models import QuizAttempt
    from schemas import AnswerResult
    from schemas import AnswerUpsert
    from schemas import AttemptCompleteRead
    from schemas import AttemptResultQuestionRead
    from schemas import AttemptResultRead
    from schemas import AttemptSessionRead
    from services.grading import GradingService
    from routers.utils import build_attempt_session
    from routers.utils import build_reference_text


router = APIRouter(prefix="/api", tags=["attempts"])


def _attempt_stmt(attempt_id: int):
    return (
        select(QuizAttempt)
        .where(QuizAttempt.id == attempt_id)
        .options(
            selectinload(QuizAttempt.answers),
            selectinload(QuizAttempt.quiz).selectinload(Quiz.questions),
        )
    )


@router.get("/attempts/{attempt_id}", response_model=AttemptSessionRead)
def get_attempt_session(attempt_id: int, db: Session = Depends(get_db)) -> AttemptSessionRead:
    attempt = db.scalar(_attempt_stmt(attempt_id))
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")
    return build_attempt_session(attempt)


@router.put("/attempts/{attempt_id}/answers/{question_id}", response_model=AnswerResult)
def upsert_answer(
    attempt_id: int,
    question_id: int,
    payload: AnswerUpsert,
    db: Session = Depends(get_db),
    grading_service: GradingService = Depends(get_grading_service),
) -> AnswerResult:
    attempt = db.scalar(_attempt_stmt(attempt_id))
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")

    if attempt.status == AttemptStatus.completed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attempt is already completed")

    question = next((item for item in attempt.quiz.questions if item.id == question_id), None)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found for this attempt")

    explanation = ""
    if isinstance(question.explanation_json, dict):
        explanation = str(question.explanation_json.get("text", ""))

    score, feedback, graded_by = grading_service.grade_answer(
        question_type=question.type,
        question_text=question.question_text,
        user_answer=payload.user_answer,
        correct_option=question.correct_option,
        explanation=explanation,
        reference_text=build_reference_text(attempt.quiz),
    )

    answer = db.scalar(
        select(AttemptAnswer).where(
            AttemptAnswer.attempt_id == attempt_id,
            AttemptAnswer.question_id == question_id,
        )
    )

    if answer is None:
        answer = AttemptAnswer(
            attempt_id=attempt_id,
            question_id=question_id,
        )
        db.add(answer)

    answer.user_answer = payload.user_answer
    answer.score = float(min(1.0, max(0.0, score)))
    answer.ai_feedback = feedback
    answer.updated_at = datetime.utcnow()

    db.commit()

    return AnswerResult(score=answer.score, ai_feedback=feedback, graded_by=graded_by)


@router.post("/attempts/{attempt_id}/complete", response_model=AttemptCompleteRead)
def complete_attempt(attempt_id: int, db: Session = Depends(get_db)) -> AttemptCompleteRead:
    attempt = db.scalar(_attempt_stmt(attempt_id))
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")

    question_count = len(attempt.quiz.questions)
    total_score = sum(answer.score for answer in attempt.answers)

    if attempt.status != AttemptStatus.completed:
        attempt.status = AttemptStatus.completed
        attempt.completed_at = datetime.utcnow()
        attempt.total_score = float(total_score)
        db.commit()

    percentage = round((attempt.total_score / question_count) * 100, 2) if question_count > 0 else 0.0
    completed_at = attempt.completed_at or datetime.utcnow()
    return AttemptCompleteRead(total_score=attempt.total_score, percentage=percentage, completed_at=completed_at)


@router.get("/attempts/{attempt_id}/results", response_model=AttemptResultRead)
def get_attempt_results(attempt_id: int, db: Session = Depends(get_db)) -> AttemptResultRead:
    attempt = db.scalar(_attempt_stmt(attempt_id))
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")

    answer_map = {answer.question_id: answer for answer in attempt.answers}
    questions = sorted(attempt.quiz.questions, key=lambda item: item.id)

    results: list[AttemptResultQuestionRead] = []
    for question in questions:
        answer = answer_map.get(question.id)
        explanation = question.explanation_json if isinstance(question.explanation_json, dict) else None
        score = answer.score if answer else 0.0
        is_correct: bool | None
        if question.type == QuestionType.mcq:
            is_correct = score >= 1.0
        else:
            is_correct = None

        results.append(
            AttemptResultQuestionRead(
                question_id=question.id,
                type=question.type.value,
                question_text=question.question_text,
                options=question.options_json if question.options_json else None,
                correct_option=question.correct_option,
                explanation=explanation,
                user_answer=answer.user_answer if answer else "",
                score=score,
                ai_feedback=answer.ai_feedback if answer else None,
                is_correct=is_correct,
            )
        )

    question_count = len(questions)
    percentage = round((attempt.total_score / question_count) * 100, 2) if question_count > 0 else 0.0

    return AttemptResultRead(
        attempt_id=attempt.id,
        quiz_id=attempt.quiz_id,
        status=attempt.status.value,
        total_score=attempt.total_score,
        percentage=percentage,
        completed_at=attempt.completed_at,
        questions=results,
    )
