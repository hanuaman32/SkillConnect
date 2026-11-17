from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.database.base import Base


class Account(Base):
    __tablename__ = "platform_accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(30), default="student", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class Opportunity(Base):
    __tablename__ = "opportunities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("platform_accounts.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    company: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    eligibility: Mapped[str] = mapped_column(Text, default="", nullable=False)
    location: Mapped[str] = mapped_column(String(160), default="Online", nullable=False)
    mode: Mapped[str] = mapped_column(String(30), default="Online", nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date)
    deadline: Mapped[date | None] = mapped_column(Date)
    duration: Mapped[str | None] = mapped_column(String(80))
    trainer: Mapped[str | None] = mapped_column(String(120))
    salary: Mapped[str | None] = mapped_column(String(100))
    image_url: Mapped[str | None] = mapped_column(String(500))
    skills: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="open", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class Participation(Base):
    __tablename__ = "participation_records"
    __table_args__ = (UniqueConstraint("account_id", "opportunity_id", "kind"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("platform_accounts.id"), nullable=False)
    opportunity_id: Mapped[int] = mapped_column(ForeignKey("opportunities.id"), nullable=False)
    kind: Mapped[str] = mapped_column(String(24), nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="pending", nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class PlatformMessage(Base):
    __tablename__ = "platform_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("platform_accounts.id"), nullable=False)
    recipient_id: Mapped[int] = mapped_column(ForeignKey("platform_accounts.id"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class WorkSubmission(Base):
    __tablename__ = "work_submissions"
    __table_args__ = (UniqueConstraint("account_id", "opportunity_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("platform_accounts.id"), nullable=False)
    opportunity_id: Mapped[int] = mapped_column(ForeignKey("opportunities.id"), nullable=False)
    link: Mapped[str | None] = mapped_column(String(1000))
    attachment: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="submitted", nullable=False)
    feedback: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class SavedOpportunity(Base):
    __tablename__ = "saved_opportunities"
    __table_args__ = (UniqueConstraint("account_id", "opportunity_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    account_id: Mapped[int] = mapped_column(
        ForeignKey("platform_accounts.id", ondelete="CASCADE"), nullable=False
    )
    opportunity_id: Mapped[int] = mapped_column(
        ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class TrainingModule(Base):
    __tablename__ = "opportunity_training_modules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(
        ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    lessons: Mapped[list["TrainingLesson"]] = relationship(
        back_populates="module",
        cascade="all, delete-orphan",
        order_by="TrainingLesson.position",
        passive_deletes=True,
    )


class TrainingLesson(Base):
    __tablename__ = "opportunity_training_lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    module_id: Mapped[int] = mapped_column(
        ForeignKey("opportunity_training_modules.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    content: Mapped[str] = mapped_column(Text, default="", nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    module: Mapped[TrainingModule] = relationship(back_populates="lessons")


class LessonProgress(Base):
    __tablename__ = "lesson_progress_records"
    __table_args__ = (UniqueConstraint("account_id", "lesson_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    account_id: Mapped[int] = mapped_column(
        ForeignKey("platform_accounts.id", ondelete="CASCADE"), nullable=False
    )
    lesson_id: Mapped[int] = mapped_column(
        ForeignKey("opportunity_training_lessons.id", ondelete="CASCADE"), nullable=False
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
