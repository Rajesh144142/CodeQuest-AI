import json
import re

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import ValidationError

from app.core.config import get_settings
from app.models.question import GeneratedQuestion, Language


class QuestionGeneratorService:
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.openrouter_api_key:
            raise RuntimeError("OpenRouter is not configured. Set OPENROUTER_API_KEY.")

        self.llm = ChatOpenAI(
            openai_api_key=settings.openrouter_api_key,
            openai_api_base="https://openrouter.ai/api/v1",
            model=settings.openrouter_model,
            default_headers={
                "HTTP-Referer": settings.openrouter_referer,
                "X-Title": settings.app_name,
            },
            temperature=0.4,
        )

        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    (
                        "You generate coding practice content. "
                        "Return only valid JSON with keys: prompt, options, answer_index, "
                        "answer_text, boilerplate_code, explanation, points. "
                        "options must contain exactly 4 choices. "
                        "answer_index must be 0-3."
                    ),
                ),
                (
                    "human",
                    (
                        "Generate a {language} coding question for step {step_number}.\n"
                        "Previous step correct: {previous_answer_correct}.\n"
                        "Use this strict 3-step progression:\n"
                        "1) Basic syntax and understanding.\n"
                        "2) Reading and modifying boilerplate code.\n"
                        "3) Slightly applied problem-solving.\n\n"
                        "If previous_answer_correct is true, make this question one notch harder "
                        "than normal for the same step while still beginner-friendly.\n"
                        "If previous_answer_correct is false, keep normal baseline difficulty for this step.\n"
                        "Keep the question concise and practical.\n"
                        "Include one boilerplate code snippet in `boilerplate_code`.\n"
                        "Set points from 10 to 25 based on difficulty.\n"
                    ),
                ),
            ]
        )

    def generate_question(
        self,
        language: Language,
        step_number: int,
        previous_answer_correct: bool = False,
    ) -> GeneratedQuestion:
        message = self.prompt.format_messages(
            language=language,
            step_number=step_number,
            previous_answer_correct=previous_answer_correct,
        )
        response = self.llm.invoke(message)
        raw = self._normalize_content(response.content)
        json_text = self._extract_json(raw)

        try:
            parsed = json.loads(json_text)
            return GeneratedQuestion.model_validate(parsed)
        except (json.JSONDecodeError, ValidationError) as exc:
            raise RuntimeError(f"Failed to parse generated question response: {exc}") from exc

    @staticmethod
    def _normalize_content(content: object) -> str:
        if isinstance(content, str):
            return content.strip()

        if isinstance(content, list):
            chunks: list[str] = []
            for item in content:
                if isinstance(item, str):
                    chunks.append(item)
                elif isinstance(item, dict):
                    text = item.get("text")
                    if isinstance(text, str):
                        chunks.append(text)
            return "\n".join(chunks).strip()

        return str(content).strip()

    @staticmethod
    def _extract_json(text: str) -> str:
        if not text:
            raise RuntimeError("Model returned empty content.")

        fenced = re.search(r"```(?:json)?\s*(\{[\s\S]*\})\s*```", text, flags=re.IGNORECASE)
        if fenced:
            return fenced.group(1).strip()

        direct_object = re.search(r"\{[\s\S]*\}", text)
        if direct_object:
            return direct_object.group(0).strip()

        return text
