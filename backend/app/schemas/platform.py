from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, field_validator


Role = Literal["student", "trainer", "organizer"]
OpportunityType = Literal["event", "training", "job"]


class SignUpRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Role = "student"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    created_at: datetime


class MemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    account: AccountOut


class OpportunityCreate(BaseModel):
    type: OpportunityType
    title: str = Field(min_length=3, max_length=180)
    company: str = Field(min_length=2, max_length=160)
    category: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=10, max_length=10_000)
    eligibility: str = Field(default="", max_length=5_000)
    location: str = Field(default="Online", max_length=160)
    mode: str = Field(default="Online", max_length=30)
    start_date: date | None = None
    deadline: date | None = None
    duration: str | None = Field(default=None, max_length=80)
    trainer: str | None = Field(default=None, max_length=120)
    salary: str | None = Field(default=None, max_length=100)
    image_url: str | None = Field(default=None, max_length=500)
    skills: list[str] = Field(default_factory=list, max_length=30)

    @field_validator("skills")
    @classmethod
    def validate_skills(cls, skills: list[str]) -> list[str]:
        if any(len(skill) > 60 for skill in skills):
            raise ValueError("Skill names must be 60 characters or fewer")
        return skills


class OpportunityUpdate(BaseModel):
    type: OpportunityType | None = None
    title: str | None = Field(default=None, min_length=3, max_length=180)
    company: str | None = Field(default=None, min_length=2, max_length=160)
    category: str | None = Field(default=None, min_length=2, max_length=80)
    description: str | None = Field(default=None, min_length=10, max_length=10_000)
    eligibility: str | None = Field(default=None, max_length=5_000)
    location: str | None = Field(default=None, max_length=160)
    mode: str | None = Field(default=None, max_length=30)
    start_date: date | None = None
    deadline: date | None = None
    duration: str | None = Field(default=None, max_length=80)
    trainer: str | None = Field(default=None, max_length=120)
    salary: str | None = Field(default=None, max_length=100)
    image_url: str | None = Field(default=None, max_length=500)
    skills: list[str] | None = Field(default=None, max_length=30)
    status: Literal["open", "closed", "draft"] | None = None


class OpportunityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    type: str
    title: str
    company: str
    category: str
    description: str
    eligibility: str
    location: str
    mode: str
    start_date: date | None
    deadline: date | None
    duration: str | None
    trainer: str | None
    salary: str | None
    image_url: str | None
    skills: list[str]
    status: str
    created_at: datetime
    updated_at: datetime


class ActionCreate(BaseModel):
    kind: Literal["registration", "enrollment", "application"]


class ParticipationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    opportunity_id: int
    kind: str
    status: str
    progress: int
    created_at: datetime


class ParticipationReview(BaseModel):
    status: Literal["pending", "approved", "rejected", "confirmed"]


class TrainingProgressUpdate(BaseModel):
    progress: int = Field(ge=0, le=100)


class ParticipationAdminOut(ParticipationOut):
    account_id: int
    account_name: str | None = None
    account_email: EmailStr | None = None
    opportunity_title: str | None = None
    opportunity_type: str | None = None


class AccountRoleUpdate(BaseModel):
    role: Literal["student", "trainer", "organizer", "admin"]


class MessageCreate(BaseModel):
    recipient_id: int
    body: str = Field(min_length=1, max_length=5_000)

    @field_validator("body")
    @classmethod
    def message_must_contain_text(cls, body: str) -> str:
        body = body.strip()
        if not body:
            raise ValueError("A message cannot be blank")
        return body


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    recipient_id: int
    body: str
    sent_at: datetime
    read_at: datetime | None


class SubmissionCreate(BaseModel):
    opportunity_id: int
    link: HttpUrl | None = None
    attachment: str | None = Field(default=None, max_length=255)
    description: str = Field(min_length=10, max_length=10_000)


class SubmissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    account_id: int
    opportunity_id: int
    link: str | None
    attachment: str | None
    description: str
    status: str
    feedback: str | None
    created_at: datetime
    updated_at: datetime


class SubmissionReview(BaseModel):
    status: Literal["approved", "rejected", "reviewed"]
    feedback: str = Field(min_length=1, max_length=5_000)


class TrainingLessonCreate(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    content: str = Field(default="", max_length=10_000)


class TrainingModuleCreate(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    lessons: list[TrainingLessonCreate] = Field(min_length=1, max_length=100)


class CurriculumUpdate(BaseModel):
    modules: list[TrainingModuleCreate] = Field(min_length=1, max_length=50)


class TrainingLessonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    position: int


class TrainingModuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    position: int
    lessons: list[TrainingLessonOut]


class LessonProgressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lesson_id: int
    opportunity_id: int
    completed_at: datetime


class ActivityDashboardItem(BaseModel):
    id: int
    opportunity_id: int
    opportunity_title: str
    opportunity_type: str
    deadline: date | None
    kind: str
    status: str
    progress: int
    created_at: datetime


class SubmissionDashboardItem(SubmissionOut):
    opportunity_title: str
    deadline: date | None


class UpcomingDeadline(BaseModel):
    opportunity_id: int
    opportunity_title: str
    kind: str
    deadline: date


class UserDashboardOut(BaseModel):
    activity: list[ActivityDashboardItem]
    submissions: list[SubmissionDashboardItem]
    lesson_progress: list[LessonProgressOut]
    upcoming_deadlines: list[UpcomingDeadline]


class DashboardOut(BaseModel):
    users: int
    events: int
    training: int
    jobs: int
    registrations: int
    enrollments: int
    applications: int
    pending_submissions: int
    total_submissions: int = 0
    pending_participations: int = 0
    approved_applications: int = 0
    rejected_applications: int = 0
    open_opportunities: int = 0
    closing_soon: int = 0
    closed_opportunities: int = 0
