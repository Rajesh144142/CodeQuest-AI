from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_request_ip
from app.models.auth import AuthenticatedUser
from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_memory import ChatMemoryService
from app.services.rate_limit_service import DailyRateLimitService, RateLimitError

router = APIRouter(prefix="/api/v1", tags=["chat"])

chat_service = ChatMemoryService()


@router.get("/")
def base() -> dict:
    return {"msg": "Memory AI running"}


@router.post("/chat", response_model=ChatResponse)
def chat_ai(
    payload: ChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    source_ip: str = Depends(get_request_ip),
) -> ChatResponse:
    try:
        DailyRateLimitService().check_and_increment(
            user_id=current_user.id,
            source_ip=source_ip,
            endpoint="chat",
        )
        answer = chat_service.ask(payload.question, payload.session_id)
        return ChatResponse(answer=answer)
    except RateLimitError as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat failed: {exc}",
        ) from exc
