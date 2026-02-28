from datetime import datetime, timezone

from app.core.config import get_settings
from app.models.admin import AdminActivity, AdminStatsResponse, AdminUser
from app.services.supabase_client import get_supabase_client


class AdminService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = get_supabase_client()
        self.user_table = self.settings.supabase_user_table
        self.question_table = self.settings.supabase_question_table
        self.auth_events_table = "auth_events"

    def get_stats(self) -> AdminStatsResponse:
        users_resp = self.client.table(self.user_table).select("role", count="exact").execute()
        users = users_resp.data or []
        total_users = users_resp.count or len(users)
        total_staff = sum(1 for row in users if row.get("role") == "staff")
        total_super_admin = sum(1 for row in users if row.get("role") == "super_admin")
        total_learners = sum(1 for row in users if row.get("role") == "learner")

        question_resp = self.client.table(self.question_table).select("id", count="exact").execute()
        total_questions_generated = question_resp.count or 0

        today = datetime.now(timezone.utc).date().isoformat()
        login_resp = (
            self.client.table(self.auth_events_table)
            .select("id", count="exact")
            .eq("event_type", "login")
            .gte("occurred_at", f"{today}T00:00:00+00:00")
            .execute()
        )
        logins_today = login_resp.count or 0

        return AdminStatsResponse(
            total_users=total_users,
            total_staff=total_staff,
            total_super_admin=total_super_admin,
            total_learners=total_learners,
            total_questions_generated=total_questions_generated,
            logins_today=logins_today,
        )

    def list_users(self) -> list[AdminUser]:
        response = (
            self.client.table(self.user_table)
            .select("id,email,role,login_count,last_login_at,created_at")
            .order("created_at", desc=True)
            .execute()
        )
        question_response = self.client.table(self.question_table).select("user_id").execute()
        count_by_user: dict[str, int] = {}
        for row in (question_response.data or []):
            user_id = row.get("user_id")
            if user_id:
                count_by_user[user_id] = count_by_user.get(user_id, 0) + 1

        users: list[AdminUser] = []
        for row in (response.data or []):
            row["generated_question_count"] = count_by_user.get(row["id"], 0)
            users.append(AdminUser(**row))
        return users

    def update_user_role(self, user_id: str, role: str) -> dict:
        response = self.client.table(self.user_table).update({"role": role}).eq("id", user_id).execute()
        if not response.data:
            raise RuntimeError("User not found.")
        return response.data[0]

    def recent_activity(self, limit: int = 50) -> list[AdminActivity]:
        response = (
            self.client.table(self.auth_events_table)
            .select("user_id,event_type,occurred_at")
            .order("occurred_at", desc=True)
            .limit(limit)
            .execute()
        )
        user_ids = list({row.get("user_id") for row in (response.data or []) if row.get("user_id")})
        email_by_id: dict[str, str] = {}
        if user_ids:
            user_response = self.client.table(self.user_table).select("id,email").in_("id", user_ids).execute()
            for user in (user_response.data or []):
                if user.get("id") and user.get("email"):
                    email_by_id[user["id"]] = user["email"]

        activities: list[AdminActivity] = []
        for row in (response.data or []):
            user_id = row.get("user_id")
            email = email_by_id.get(user_id) if user_id else None
            activities.append(
                AdminActivity(
                    user_id=user_id,
                    email=email,
                    event_type=row.get("event_type", "login"),
                    occurred_at=row.get("occurred_at"),
                )
            )
        return activities
