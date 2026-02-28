from fastapi import APIRouter, HTTPException, status

from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_memory import ChatMemoryService

router = APIRouter(prefix="/api/v1", tags=["chat"])

chat_service = ChatMemoryService()


@router.get("/")
def base() -> dict:
    return {"msg": "Memory AI running"}


@router.post("/chat", response_model=ChatResponse)
def chat_ai(payload: ChatRequest) -> ChatResponse:
    try:
        answer = chat_service.ask(payload.question, payload.session_id)
        return ChatResponse(answer=answer)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat failed: {exc}",
        ) from exc
