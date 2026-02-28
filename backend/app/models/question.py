from typing import Literal

from pydantic import BaseModel, Field, conint


Language = Literal["cpp", "python"]


class GenerateQuestionRequest(BaseModel):
    language: Language
    step_number: conint(ge=1, le=3) = 1
    previous_answer_correct: bool = False


class GeneratedQuestion(BaseModel):
    prompt: str
    options: list[str] = Field(min_length=4, max_length=4)
    answer_index: conint(ge=0, le=3)
    answer_text: str
    boilerplate_code: str
    explanation: str
    points: conint(ge=1, le=100) = 10


class StoredQuestion(GeneratedQuestion):
    id: str | None = None
    user_id: str | None = None
    language: Language
    step_number: conint(ge=1, le=3)
    source_ip: str
