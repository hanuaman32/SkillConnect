from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import read_access_token
from app.dependencies.database import get_db
from app.models.platform import Account

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_account(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Account:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to continue",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        claims = read_access_token(credentials.credentials)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error
    account = db.get(Account, claims["sub"])
    if account is None or account.role != claims["role"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is no longer available",
        )
    return account


def require_roles(*roles: str) -> Callable[..., Account]:
    def role_dependency(account: Account = Depends(get_current_account)) -> Account:
        if account.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return account

    return role_dependency
