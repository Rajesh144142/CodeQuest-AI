from typing import Literal

from pydantic import BaseModel, Field

from app.models.auth import UserRole


class UpdateRoleRequest(BaseModel):
    role: UserRole


class AdminStatsResponse(BaseModel):
    total_users: int
    total_staff: int
    total_super_admin: int
    total_learners: int
    total_questions_generated: int
    logins_today: int


class AdminUser(BaseModel):
    id: str
    email: str
    role: UserRole
    login_count: int = 0
    generated_question_count: int = 0
    last_login_at: str | None = None
    created_at: str | None = None


class AdminActivity(BaseModel):
    user_id: str | None = None
    email: str | None = None
    event_type: Literal["login", "register"] | str
    occurred_at: str
