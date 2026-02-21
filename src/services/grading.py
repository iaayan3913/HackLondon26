from __future__ import annotations

from dataclasses import dataclass

try:
    from ..models import QuestionType
    from .gemini import GeminiService
except ImportError:  # pragma: no cover - allows top-level module imports
    from models import QuestionType
    from services.gemini import GeminiService


@dataclass
class GradingService:
    gemini_service: GeminiService

    def grade_answer(
        self,
        *,
        question_type: QuestionType,
        question_text: str,
        user_answer: str,
        correct_option: str | None,
        explanation: str,
        reference_text: str,
    ) -> tuple[float, str, str]:
        answer = (user_answer or "").strip()

        if question_type == QuestionType.mcq:
            expected = (correct_option or "").strip().upper()
            submitted = answer.upper()
            score = 1.0 if expected and submitted == expected else 0.0
            if score == 1.0:
                feedback = explanation or "Correct."
            else:
                feedback = (
                    f"Incorrect. Correct option: {expected}. {explanation}".strip()
                    if expected
                    else (explanation or "Incorrect answer.")
                )
            return score, feedback, "rule"

        score, feedback, graded_by = self.gemini_service.grade_open_answer(
            reference_text=reference_text,
            question_text=question_text,
            user_answer=answer,
        )
        return score, feedback, graded_by
