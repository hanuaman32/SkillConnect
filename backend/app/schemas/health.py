from datetime import datetime

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    timestamp: datetime


class DatabaseHealthResponse(BaseModel):
    status: str
    dialect: str
    server_version: str | None = None
