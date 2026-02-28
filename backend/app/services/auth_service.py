from datetime import datetime, timedelta, timezone
import base64
import hashlib
import hmac
import secrets

from jose import JWTError, jwt

from app.core.config import get_settings
from app.models.auth import AuthenticatedUser, TokenResponse, UserRole
from app.services.supabase_client import get_supabase_client


class AuthError(Exception):
    pass


class AuthService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = get_supabase_client()
        self.user_table = self.settings.supabase_user_table
        self.events_table = "auth_events"

    def register(self, email: str, password: str) -> TokenResponse:
        normalized_email = email.strip().lower()
        existing = self._get_user_by_email(normalized_email)
        if existing:
            raise AuthError("User already exists.")

        password_hash = self._hash_password(password)
        role = self._resolve_role_for_email(normalized_email)
        payload = {"email": normalized_email, "password_hash": password_hash, "role": role}
        response = self.client.table(self.user_table).insert(payload).execute()
        if not response.data:
            raise AuthError("Failed to create user.")

        user_row = response.data[0]
        user = AuthenticatedUser(id=user_row["id"], email=user_row["email"], role=user_row.get("role", "learner"))
        self._record_login(user.id, "register")
        token = self._create_access_token(user)
        return TokenResponse(access_token=token, user=user)

    def ensure_super_admin(self) -> None:
        email = self.settings.auth_super_admin_email.strip().lower()
        password = self.settings.auth_super_admin_password
        if not email or not password:
            return

        existing = self._get_user_by_email(email)
        if existing:
            if existing.get("role") != "super_admin":
                self.client.table(self.user_table).update({"role": "super_admin"}).eq("id", existing["id"]).execute()
            return

        password_hash = self._hash_password(password)
        payload = {"email": email, "password_hash": password_hash, "role": "super_admin"}
        self.client.table(self.user_table).insert(payload).execute()

    def login(self, email: str, password: str) -> TokenResponse:
        normalized_email = email.strip().lower()
        user_row = self._get_user_by_email(normalized_email)
        if not user_row:
            raise AuthError("Invalid email or password.")

        if not self._verify_password(password, user_row["password_hash"]):
            raise AuthError("Invalid email or password.")

        user = AuthenticatedUser(id=user_row["id"], email=user_row["email"], role=user_row.get("role", "learner"))
        self._record_login(user.id, "login")
        token = self._create_access_token(user)
        return TokenResponse(access_token=token, user=user)

    def get_user_from_token(self, token: str) -> AuthenticatedUser:
        try:
            payload = jwt.decode(
                token,
                self.settings.auth_jwt_secret,
                algorithms=[self.settings.auth_jwt_algorithm],
            )
            user_id = payload.get("sub")
            email = payload.get("email")
            role = payload.get("role")
            if not user_id or not email or role not in {"super_admin", "staff", "learner"}:
                raise AuthError("Invalid token payload.")
            return AuthenticatedUser(id=user_id, email=email, role=role)
        except JWTError as exc:
            raise AuthError("Invalid or expired token.") from exc

    def _create_access_token(self, user: AuthenticatedUser) -> str:
        expires_delta = timedelta(minutes=self.settings.auth_access_token_exp_minutes)
        expire_at = datetime.now(timezone.utc) + expires_delta
        payload = {"sub": user.id, "email": user.email, "role": user.role, "exp": expire_at}
        return jwt.encode(
            payload,
            self.settings.auth_jwt_secret,
            algorithm=self.settings.auth_jwt_algorithm,
        )

    def _get_user_by_email(self, email: str) -> dict | None:
        response = self.client.table(self.user_table).select("*").eq("email", email).limit(1).execute()
        if not response.data:
            return None
        return response.data[0]

    def _resolve_role_for_email(self, email: str) -> UserRole:
        super_admin_email = self.settings.auth_super_admin_email.strip().lower()
        if super_admin_email and email == super_admin_email:
            return "super_admin"
        return "learner"

    def _record_login(self, user_id: str, event_type: str) -> None:
        now_iso = datetime.now(timezone.utc).isoformat()
        self.client.table(self.events_table).insert(
            {"user_id": user_id, "event_type": event_type, "occurred_at": now_iso}
        ).execute()

        user_row = self.client.table(self.user_table).select("login_count").eq("id", user_id).limit(1).execute()
        login_count = 0
        if user_row.data:
            login_count = int(user_row.data[0].get("login_count") or 0)

        self.client.table(self.user_table).update(
            {"last_login_at": now_iso, "login_count": login_count + 1}
        ).eq("id", user_id).execute()

    @staticmethod
    def _hash_password(password: str) -> str:
        # Format: pbkdf2_sha256$iterations$salt$hash
        iterations = 390000
        salt = secrets.token_bytes(16)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
        salt_b64 = base64.urlsafe_b64encode(salt).decode("utf-8")
        digest_b64 = base64.urlsafe_b64encode(digest).decode("utf-8")
        return f"pbkdf2_sha256${iterations}${salt_b64}${digest_b64}"

    @staticmethod
    def _verify_password(password: str, encoded_hash: str) -> bool:
        try:
            algorithm, iterations_raw, salt_b64, digest_b64 = encoded_hash.split("$", 3)
            if algorithm != "pbkdf2_sha256":
                return False
            iterations = int(iterations_raw)
            salt = base64.urlsafe_b64decode(salt_b64.encode("utf-8"))
            expected_digest = base64.urlsafe_b64decode(digest_b64.encode("utf-8"))
            actual_digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
            return hmac.compare_digest(actual_digest, expected_digest)
        except Exception:
            return False
