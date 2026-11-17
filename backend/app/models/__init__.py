"""Import model modules here so Alembic can discover their table metadata."""
from app.database.base import Base  # noqa: F401
from app.models.platform import (  # noqa: F401
    Account,
    LessonProgress,
    Opportunity,
    Participation,
    PlatformMessage,
    SavedOpportunity,
    TrainingLesson,
    TrainingModule,
    WorkSubmission,
)
