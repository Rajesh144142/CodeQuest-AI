from datetime import datetime, timedelta, timezone
import base64
import hashlib
import hmac
import secrets

from jose import JWTError, jwt

from app.core.config import get_settings
from app.models.auth import AuthenticatedUser, TokenResponse
from app.services.supabase_client import get_supabase_client


class AuthError(Exception):
    pass


class AuthService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = get_supabase_client()
        self.user_table = self.settings.supabase_user_table

    def register(self, email: str, password: str) -> TokenResponse:
        normalized_email = email.strip().lower()
        existing = self._get_user_by_email(normalized_email)
        if existing:
            raise AuthError("User already exists.")

        password_hash = self._hash_password(password)
        payload = {"email": normalized_email, "password_hash": password_hash}
        response = self.client.table(self.user_table).insert(payload).execute()
        if not response.data:
            raise AuthError("Failed to create user.")

        user_row = response.data[0]
        user = AuthenticatedUser(id=user_row["id"], email=user_row["email"])
        token = self._create_access_token(user)
        return TokenResponse(access_token=token, user=user)

    def login(self, email: str, password: str) -> TokenResponse:
        normalized_email = email.strip().lower()
        user_row = self._get_user_by_email(normalized_email)
        if not user_row:
            raise AuthError("Invalid email or password.")

        if not self._verify_password(password, user_row["password_hash"]):
            raise AuthError("Invalid email or password.")

        user = AuthenticatedUser(id=user_row["id"], email=user_row["email"])
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
            if not user_id or not email:
                raise AuthError("Invalid token payload.")
            return AuthenticatedUser(id=user_id, email=email)
        except JWTError as exc:
            raise AuthError("Invalid or expired token.") from exc

    def _create_access_token(self, user: AuthenticatedUser) -> str:
        expires_delta = timedelta(minutes=self.settings.auth_access_token_exp_minutes)
        expire_at = datetime.now(timezone.utc) + expires_delta
        payload = {"sub": user.id, "email": user.email, "exp": expire_at}
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
