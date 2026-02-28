from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="CodeQuest Backend", alias="APP_NAME")
    app_env: str = Field(default="dev", alias="APP_ENV")
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    app_cors_origins: str = Field(default="http://localhost:5173", alias="APP_CORS_ORIGINS")

    supabase_url: str = Field(default="", alias="SUPABASE_URL")
    supabase_service_role_key: str = Field(default="", alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_question_table: str = Field(default="generated_questions", alias="SUPABASE_QUESTION_TABLE")
    supabase_user_table: str = Field(default="app_users", alias="SUPABASE_USER_TABLE")
    supabase_rate_limit_table: str = Field(default="api_daily_usage", alias="SUPABASE_RATE_LIMIT_TABLE")

    openrouter_api_key: str = Field(default="", alias="OPENROUTER_API_KEY")
    openrouter_model: str = Field(default="openai/gpt-4o-mini", alias="OPENROUTER_MODEL")
    openrouter_chat_model: str = Field(
        default="arcee-ai/trinity-large-preview:free",
        alias="OPENROUTER_CHAT_MODEL",
    )
    openrouter_referer: str = Field(default="http://localhost:5173", alias="OPENROUTER_REFERER")

    auth_jwt_secret: str = Field(default="change-me", alias="AUTH_JWT_SECRET")
    auth_jwt_algorithm: str = Field(default="HS256", alias="AUTH_JWT_ALGORITHM")
    auth_access_token_exp_minutes: int = Field(default=1440, alias="AUTH_ACCESS_TOKEN_EXP_MINUTES")

    rate_limit_daily_max: int = Field(default=10, alias="RATE_LIMIT_DAILY_MAX")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.app_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
