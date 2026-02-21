from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field
from pydantic import model_validator


class QuestionTypeEnum(str, Enum):
    mcq = "mcq"
    open = "open"


class AttemptStatusEnum(str, Enum):
    in_progress = "in_progress"
    completed = "completed"


class OptionItem(BaseModel):
    key: str = Field(min_length=1, max_length=16)
    text: str = Field(min_length=1)


class QuizCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    subject: str = Field(default="General", min_length=1, max_length=120)
    description: str | None = None


class QuizUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    subject: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None


class QuizRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    subject: str
    description: str | None
    created_at: datetime
    updated_at: datetime
    question_count: int = 0
    attempt_count: int = 0
    best_score: float | None = None


class QuizDetailRead(QuizRead):
    pass


class PaginatedQuizzes(BaseModel):
    items: list[QuizRead]
    page: int
    page_size: int
    total: int
    total_pages: int


class QuestionCreate(BaseModel):
    type: QuestionTypeEnum
    question_text: str = Field(min_length=1)
    options: list[OptionItem] | None = None
    correct_option: str | None = None
    explanation: dict[str, Any] | None = None

    @model_validator(mode="after")
    def validate_shape(self) -> "QuestionCreate":
        if self.type == QuestionTypeEnum.mcq:
            if not self.options or len(self.options) < 2:
                raise ValueError("MCQ questions require at least 2 options")
            option_keys = {option.key for option in self.options}
            if not self.correct_option or self.correct_option not in option_keys:
                raise ValueError("MCQ questions require correct_option to match one option key")
        else:
            self.options = None
            self.correct_option = None
        return self


class QuestionUpdate(BaseModel):
    type: QuestionTypeEnum | None = None
    question_text: str | None = Field(default=None, min_length=1)
    options: list[OptionItem] | None = None
    correct_option: str | None = None
    explanation: dict[str, Any] | None = None


class QuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quiz_id: int
    type: QuestionTypeEnum
    question_text: str
    options: list[OptionItem] | None = None
    correct_option: str | None = None
    explanation: dict[str, Any] | None = None


class QuestionListRead(BaseModel):
    items: list[QuestionRead]


class GenerateResponse(BaseModel):
    created_count: int
    questions: list[QuestionRead]
    llm_latency_ms: int


class AttemptCreate(BaseModel):
    resume_if_exists: bool = True


class AttemptSummaryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quiz_id: int
    status: AttemptStatusEnum
    started_at: datetime
    completed_at: datetime | None
    total_score: float
    percentage: float


class AttemptListRead(BaseModel):
    items: list[AttemptSummaryRead]
    page: int
    page_size: int
    total: int


class AttemptAnswerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    question_id: int
    user_answer: str
    score: float
    ai_feedback: str | None
    updated_at: datetime


class AttemptSessionRead(BaseModel):
    id: int
    quiz_id: int
    status: AttemptStatusEnum
    started_at: datetime
    completed_at: datetime | None
    total_score: float
    percentage: float
    current_question_index: int
    questions: list[QuestionRead]
    answers: list[AttemptAnswerRead]


class AnswerUpsert(BaseModel):
    user_answer: str


class AnswerResult(BaseModel):
    score: float
    ai_feedback: str
    graded_by: str


class AttemptCompleteRead(BaseModel):
    total_score: float
    percentage: float
    completed_at: datetime


class AttemptResultQuestionRead(BaseModel):
    question_id: int
    type: QuestionTypeEnum
    question_text: str
    options: list[OptionItem] | None
    correct_option: str | None
    explanation: dict[str, Any] | None
    user_answer: str
    score: float
    ai_feedback: str | None
    is_correct: bool | None


class AttemptResultRead(BaseModel):
    attempt_id: int
    quiz_id: int
    status: AttemptStatusEnum
    total_score: float
    percentage: float
    completed_at: datetime | None
    questions: list[AttemptResultQuestionRead]
