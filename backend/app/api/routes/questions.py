from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_request_ip
from app.models.auth import AuthenticatedUser
from app.models.question import GenerateQuestionRequest, StoredQuestion
from app.services.question_generator import QuestionGeneratorService
from app.services.question_repository import QuestionRepository
from app.services.rate_limit_service import DailyRateLimitService, RateLimitError

router = APIRouter(prefix="/api/v1/questions", tags=["questions"])


@router.post("/generate")
def generate_question(
    payload: GenerateQuestionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    source_ip: str = Depends(get_request_ip),
) -> dict:
    try:
        DailyRateLimitService().check_and_increment(
            user_id=current_user.id,
            source_ip=source_ip,
            endpoint="questions_generate",
        )
        generated = QuestionGeneratorService().generate_question(
            language=payload.language,
            step_number=payload.step_number,
            previous_answer_correct=payload.previous_answer_correct,
        )
        stored_payload = StoredQuestion(
            **generated.model_dump(),
            language=payload.language,
            step_number=payload.step_number,
            source_ip=source_ip,
        )
        stored_record = QuestionRepository().save_question(stored_payload)
        return {"question": generated.model_dump(), "stored": stored_record, "source_ip": source_ip}
    except RateLimitError as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Question generation failed: {exc}",
        ) from exc


@router.get("/debug/supabase")
def debug_supabase_connection() -> dict:
    try:
        data = QuestionRepository().ping()
        return {"ok": True, **data}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Supabase connection failed: {exc}",
        ) from exc
