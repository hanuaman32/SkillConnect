import logging

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def check_database(db: Session) -> dict | None:
    """Run a real round-trip query. Returns details on success, None on failure."""
    try:
        db.execute(text("SELECT 1"))
        dialect = db.get_bind().dialect.name
        server_version = None
        if dialect == "postgresql":
            server_version = db.execute(text("SHOW server_version")).scalar_one()
        return {"status": "connected", "dialect": dialect, "server_version": server_version}
    except SQLAlchemyError:
        # Log details server-side only; never leak connection info to clients.
        logger.exception("Database health check failed")
        return None
