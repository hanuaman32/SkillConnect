"""Verify the real PostgreSQL connection configured in backend/.env.

Usage (from backend/):  python scripts/check_db.py
Exit code 0 = connected, 1 = failed.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.database.session import engine


def main() -> int:
    safe_url = make_url(settings.DATABASE_URL).render_as_string(hide_password=True)
    print(f"Connecting to: {safe_url}")
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            version = conn.execute(text("SELECT version()")).scalar_one()
            db_name = conn.execute(text("SELECT current_database()")).scalar_one()
    except SQLAlchemyError as exc:
        print("FAILED: could not connect to the database.")
        print(f"Reason: {exc.__class__.__name__}: {str(exc.orig) if getattr(exc, 'orig', None) else exc}")
        print("Check: is PostgreSQL running? Do DATABASE_URL credentials/port/db name match?")
        return 1
    print(f"CONNECTED to database '{db_name}'")
    print(version)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
