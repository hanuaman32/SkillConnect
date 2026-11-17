import asyncio
import logging
from datetime import date

from sqlalchemy import update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.models.platform import Opportunity

logger = logging.getLogger(__name__)


def close_expired_opportunities(db: Session) -> int:
    result = db.execute(
        update(Opportunity)
        .where(
            Opportunity.status == "open",
            Opportunity.deadline.is_not(None),
            Opportunity.deadline < date.today(),
        )
        .values(status="closed")
    )
    closed_count = result.rowcount or 0
    if closed_count:
        db.commit()
    return closed_count


def _close_expired_with_session() -> None:
    with SessionLocal() as db:
        close_expired_opportunities(db)


async def close_expired_opportunities_periodically() -> None:
    while True:
        try:
            await asyncio.to_thread(_close_expired_with_session)
        except SQLAlchemyError:
            logger.exception("Scheduled opportunity deadline closure failed")
        await asyncio.sleep(60)
