from datetime import datetime, timezone

from app.core.config import get_settings
from app.services.supabase_client import get_supabase_client


class RateLimitError(Exception):
    pass


class DailyRateLimitService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = get_supabase_client()
        self.table = self.settings.supabase_rate_limit_table
        self.daily_max = self.settings.rate_limit_daily_max

    def check_and_increment(self, user_id: str, source_ip: str, endpoint: str) -> dict:
        usage_date = datetime.now(timezone.utc).date().isoformat()
        response = (
            self.client.table(self.table)
            .select("*")
            .eq("user_id", user_id)
            .eq("source_ip", source_ip)
            .eq("endpoint", endpoint)
            .eq("usage_date", usage_date)
            .limit(1)
            .execute()
        )
        row = response.data[0] if response.data else None

        if row is None:
            insert_payload = {
                "user_id": user_id,
                "source_ip": source_ip,
                "endpoint": endpoint,
                "usage_date": usage_date,
                "hit_count": 1,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            self.client.table(self.table).insert(insert_payload).execute()
            return {"allowed": True, "remaining": self.daily_max - 1}

        current_hits = int(row["hit_count"])
        if current_hits >= self.daily_max:
            raise RateLimitError(f"Daily limit reached. Max {self.daily_max} hits per day.")

        updated_hits = current_hits + 1
        self.client.table(self.table).update(
            {"hit_count": updated_hits, "updated_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", row["id"]).execute()
        return {"allowed": True, "remaining": self.daily_max - updated_hits}
