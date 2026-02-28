from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(min_length=1)
    session_id: str = Field(default="default", min_length=1)


class ChatResponse(BaseModel):
    answer: str
