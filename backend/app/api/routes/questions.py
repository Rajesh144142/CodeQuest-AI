from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_request_ip
from app.models.question import GenerateQuestionRequest
from app.services.question_generator import QuestionGeneratorService
from app.services.question_repository import QuestionRepository

router = APIRouter(prefix="/api/v1/questions", tags=["questions"])


@router.post("/generate")
def generate_question(
    payload: GenerateQuestionRequest,
    source_ip: str = Depends(get_request_ip),
) -> dict:
    try:
        generated = QuestionGeneratorService().generate_question(
            language=payload.language,
            step_number=payload.step_number,
            previous_answer_correct=payload.previous_answer_correct,
        )
        # Supabase insert is intentionally disabled for now.
        return {"question": generated.model_dump(), "stored": None, "source_ip": source_ip}
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
