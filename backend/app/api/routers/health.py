from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.dependencies.database import get_db
from app.schemas.health import DatabaseHealthResponse, HealthResponse
from app.services.health_service import check_database

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=HealthResponse, summary="API liveness check")
def health() -> HealthResponse:
    """Does not touch the database: reports only that the API process is up."""
    return HealthResponse(
        status="ok",
        service=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
    )


@router.get("/db", response_model=DatabaseHealthResponse, summary="Database connectivity check")
def health_db(db: Session = Depends(get_db)) -> DatabaseHealthResponse:
    result = check_database(db)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        )
    return DatabaseHealthResponse(**result)
