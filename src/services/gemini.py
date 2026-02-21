from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
import json
import random
import re
import time
from typing import Any

from pydantic import BaseModel
from pydantic import Field
from pydantic import ValidationError

try:
    from ..config import settings
except ImportError:  # pragma: no cover - allows top-level module imports
    from config import settings


class GeminiResponseError(RuntimeError):
    pass


class GeneratedQuestion(BaseModel):
    type: str = Field(pattern="^(mcq|open)$")
    question_text: str = Field(min_length=1)
    options: list[str] | None = None
    correct_option: str | None = None
    explanation: str = Field(min_length=1)


class GenerationEnvelope(BaseModel):
    questions: list[GeneratedQuestion]


class GradeEnvelope(BaseModel):
    score: float
    feedback: str


def _strip_markdown_fences(text: str) -> str:
    content = text.strip()
    fence_match = re.search(r"```(?:json)?\s*(.*?)```", content, re.IGNORECASE | re.DOTALL)
    if fence_match:
        return fence_match.group(1).strip()
    return content


def _safe_json_loads(raw_text: str) -> Any:
    cleaned = _strip_markdown_fences(raw_text)
    return json.loads(cleaned)


def _extract_response_text(response: Any) -> str:
    text = getattr(response, "text", None)
    if text:
        return text

    candidates = getattr(response, "candidates", None) or []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        parts = getattr(content, "parts", None) if content else None
        if not parts:
            continue
        for part in parts:
            part_text = getattr(part, "text", None)
            if part_text:
                return part_text

    raise GeminiResponseError("Gemini returned no text payload")


@dataclass
class GeminiService:
    api_key: str = settings.gemini_api_key
    model_name: str = settings.gemini_model

    def generate_questions(
        self,
        *,
        source_text: str,
        title: str,
        mcq_count: int,
        open_count: int,
        difficulty: str,
    ) -> tuple[list[GeneratedQuestion], int]:
        start = time.perf_counter()

        if not self.api_key:
            questions = self._fallback_generate(source_text, mcq_count, open_count)
            latency = int((time.perf_counter() - start) * 1000)
            return questions, latency

        schema = GenerationEnvelope

        prompt = (
            "You are generating quiz questions for students. "
            "Return JSON only. No markdown. "
            f"Create {mcq_count} MCQ questions and {open_count} open-ended questions. "
            f"Difficulty: {difficulty}. Quiz title: {title}.\n"
            "For MCQ: include options as an array of 4 strings and correct_option as A, B, C, or D. "
            "For open questions: options and correct_option must be null.\n"
            "Use this bounded source text only:\n"
            "<SOURCE>\n"
            f"{source_text}\n"
            "</SOURCE>"
        )

        raw_text = self._call_gemini(prompt=prompt, schema=schema)
        try:
            envelope = GenerationEnvelope.model_validate(_safe_json_loads(raw_text))
            questions = self._post_process_generated_questions(envelope.questions)
        except (ValidationError, json.JSONDecodeError) as first_error:
            repair_prompt = (
                "Your previous output was invalid JSON for the required schema. "
                "Return corrected JSON only for the same schema.\n"
                f"Invalid output:\n{raw_text}"
            )
            retry_raw = self._call_gemini(prompt=repair_prompt, schema=schema)
            try:
                envelope = GenerationEnvelope.model_validate(_safe_json_loads(retry_raw))
                questions = self._post_process_generated_questions(envelope.questions)
            except (ValidationError, json.JSONDecodeError) as second_error:
                raise GeminiResponseError("Failed to parse Gemini generation response") from second_error
            raise_from = first_error
            if raise_from:
                pass

        latency = int((time.perf_counter() - start) * 1000)
        return questions, latency

    def grade_open_answer(
        self,
        *,
        reference_text: str,
        question_text: str,
        user_answer: str,
    ) -> tuple[float, str, str]:
        if not self.api_key:
            score, feedback = self._fallback_grade(reference_text, question_text, user_answer)
            return score, feedback, "fallback"

        schema = GradeEnvelope

        prompt = (
            "Grade the user's open-ended answer with strict JSON output. "
            "Score must be between 0 and 1. Feedback must be concise and constructive.\n"
            f"Question:\n{question_text}\n\n"
            f"User answer:\n{user_answer}\n\n"
            "Reference material:\n"
            "<REFERENCE>\n"
            f"{reference_text}\n"
            "</REFERENCE>"
        )

        raw_text = self._call_gemini(prompt=prompt, schema=schema)
        try:
            grade = GradeEnvelope.model_validate(_safe_json_loads(raw_text))
        except (ValidationError, json.JSONDecodeError) as error:
            raise GeminiResponseError("Failed to parse Gemini grading response") from error

        score = min(1.0, max(0.0, float(grade.score)))
        return score, grade.feedback.strip(), "gemini"

    def _call_gemini(self, *, prompt: str, schema: Any) -> str:
        try:
            from google import genai
        except Exception as error:  # pragma: no cover - import-specific path
            raise GeminiResponseError("google-genai package is unavailable") from error

        client = genai.Client(api_key=self.api_key)
        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": schema,
                    "temperature": 0.2,
                },
            )
        except Exception as error:  # pragma: no cover - network/model errors
            raise GeminiResponseError("Gemini request failed") from error

        return _extract_response_text(response)

    def _post_process_generated_questions(self, questions: list[GeneratedQuestion]) -> list[GeneratedQuestion]:
        processed: list[GeneratedQuestion] = []
        for question in questions:
            if question.type == "mcq":
                options = question.options or []
                if len(options) < 2:
                    continue
                options = options[:4]
                correct = (question.correct_option or "A").upper().strip()
                if correct not in {"A", "B", "C", "D"}:
                    correct = "A"
                processed.append(
                    GeneratedQuestion(
                        type="mcq",
                        question_text=question.question_text.strip(),
                        options=options,
                        correct_option=correct,
                        explanation=question.explanation.strip(),
                    )
                )
            else:
                processed.append(
                    GeneratedQuestion(
                        type="open",
                        question_text=question.question_text.strip(),
                        options=None,
                        correct_option=None,
                        explanation=question.explanation.strip(),
                    )
                )
        return processed

    def _fallback_generate(self, source_text: str, mcq_count: int, open_count: int) -> list[GeneratedQuestion]:
        keywords = self._extract_keywords(source_text)
        if not keywords:
            keywords = ["core concept", "definition", "application", "summary"]

        random.seed(42)
        questions: list[GeneratedQuestion] = []

        for index in range(mcq_count):
            keyword = keywords[index % len(keywords)]
            distractors = [kw for kw in keywords if kw != keyword]
            while len(distractors) < 3:
                distractors.append(f"related idea {len(distractors) + 1}")
            options = [keyword] + distractors[:3]
            random.shuffle(options)
            correct_key = "ABCD"[options.index(keyword)]
            questions.append(
                GeneratedQuestion(
                    type="mcq",
                    question_text=f"Which option is most closely associated with '{keyword}'?",
                    options=options,
                    correct_option=correct_key,
                    explanation=f"The reference text emphasizes '{keyword}' directly.",
                )
            )

        for index in range(open_count):
            keyword = keywords[index % len(keywords)]
            questions.append(
                GeneratedQuestion(
                    type="open",
                    question_text=f"Explain '{keyword}' in your own words and why it matters in the source material.",
                    options=None,
                    correct_option=None,
                    explanation=f"Strong answers should define '{keyword}' and connect it to the broader topic.",
                )
            )

        return questions

    def _fallback_grade(self, reference_text: str, question_text: str, user_answer: str) -> tuple[float, str]:
        answer_words = {word.lower() for word in re.findall(r"[a-zA-Z]{4,}", user_answer)}
        reference_words = set(self._extract_keywords(reference_text + " " + question_text, top_n=12))

        if not answer_words:
            return 0.0, "No answer detected. Provide a concise explanation using key concepts."

        overlap = len(answer_words & reference_words)
        target = max(1, min(len(reference_words), 6))
        length_bonus = min(len(answer_words) / 40, 0.2)
        score = min(1.0, max(0.0, (overlap / target) + length_bonus))

        if overlap == 0:
            feedback = "Your answer is readable but misses the core concepts from the reference material."
        else:
            feedback = (
                f"You covered {overlap} important concept(s). Improve by explicitly referencing more source terminology."
            )

        return score, feedback

    def _extract_keywords(self, text: str, top_n: int = 16) -> list[str]:
        stopwords = {
            "about",
            "after",
            "again",
            "also",
            "because",
            "being",
            "between",
            "could",
            "first",
            "from",
            "into",
            "other",
            "should",
            "their",
            "there",
            "these",
            "those",
            "through",
            "under",
            "which",
            "while",
            "with",
            "that",
            "this",
            "where",
            "when",
            "what",
            "have",
            "were",
            "they",
            "your",
            "them",
            "than",
            "then",
            "such",
            "more",
        }
        words = [word.lower() for word in re.findall(r"[a-zA-Z]{4,}", text)]
        filtered = [word for word in words if word not in stopwords]
        counts = Counter(filtered)
        return [word for word, _ in counts.most_common(top_n)]
