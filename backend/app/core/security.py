import base64
import hashlib
import hmac
import json
import secrets
import time

from app.core.config import settings


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
    return f"{base64.urlsafe_b64encode(salt).decode()}:{base64.urlsafe_b64encode(digest).decode()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_text, digest_text = stored.split(":", maxsplit=1)
        salt = base64.urlsafe_b64decode(salt_text)
        expected = base64.urlsafe_b64decode(digest_text)
    except (ValueError, TypeError):
        return False
    actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
    return hmac.compare_digest(actual, expected)


def create_access_token(account_id: int, role: str) -> str:
    payload = json.dumps(
        {"sub": account_id, "role": role, "exp": int(time.time()) + settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60},
        separators=(",", ":"),
    ).encode()
    encoded = base64.urlsafe_b64encode(payload).rstrip(b"=")
    signature = hmac.new(settings.SECRET_KEY.encode(), encoded, hashlib.sha256).digest()
    return f"{encoded.decode()}.{base64.urlsafe_b64encode(signature).rstrip(b'=').decode()}"


def read_access_token(token: str) -> dict[str, int | str]:
    try:
        encoded, signature = token.split(".", maxsplit=1)
        expected = hmac.new(settings.SECRET_KEY.encode(), encoded.encode(), hashlib.sha256).digest()
        provided = base64.urlsafe_b64decode(signature + "=" * (-len(signature) % 4))
        if not hmac.compare_digest(expected, provided):
            raise ValueError("Invalid token signature")
        payload = base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4))
        claims = json.loads(payload)
        if not isinstance(claims, dict) or int(claims["exp"]) <= int(time.time()):
            raise ValueError("Expired token")
        if not isinstance(claims.get("sub"), int) or not isinstance(claims.get("role"), str):
            raise ValueError("Invalid token claims")
        return claims
    except (ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
        raise ValueError("Invalid or expired access token") from error
