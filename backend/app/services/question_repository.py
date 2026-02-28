from app.core.config import get_settings
from app.models.question import StoredQuestion
from app.services.supabase_client import get_supabase_client


class QuestionRepository:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = get_supabase_client()
        self.table = self.settings.supabase_question_table

    def save_question(self, question: StoredQuestion) -> dict:
        payload = {
            "user_id": question.user_id,
            "language": question.language,
            "step_number": question.step_number,
            "prompt": question.prompt,
            "options": question.options,
            "answer_index": question.answer_index,
            "answer_text": question.answer_text,
            "boilerplate_code": question.boilerplate_code,
            "explanation": question.explanation,
            "points": question.points,
            "source_ip": question.source_ip,
        }
        response = self.client.table(self.table).insert(payload).execute()
        if not response.data:
            raise RuntimeError("Question insert failed.")
        return response.data[0]

    def ping(self) -> dict:
        response = self.client.table(self.table).select("id", count="exact").limit(1).execute()
        return {"table": self.table, "count": response.count if response.count is not None else 0}
