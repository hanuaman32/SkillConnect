from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# The engine connects lazily, so the app can boot (and /health can respond)
# even when PostgreSQL is down. pool_pre_ping drops dead pooled connections.
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, echo=False)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
