from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.dependencies.auth import get_current_account, require_roles
from app.dependencies.database import get_db
from app.models.platform import (
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
from app.schemas.platform import (
    ActivityDashboardItem,
    AccountOut,
    AccountRoleUpdate,
    ActionCreate,
    CurriculumUpdate,
    DashboardOut,
    LoginRequest,
    LessonProgressOut,
    MemberOut,
    MessageCreate,
    MessageOut,
    OpportunityCreate,
    OpportunityOut,
    OpportunityUpdate,
    ParticipationOut,
    ParticipationAdminOut,
    ParticipationReview,
    SignUpRequest,
    SubmissionCreate,
    SubmissionDashboardItem,
    SubmissionOut,
    SubmissionReview,
    TokenResponse,
    TrainingLessonOut,
    TrainingModuleOut,
    TrainingProgressUpdate,
    UpcomingDeadline,
    UserDashboardOut,
)
from app.services.deadline_service import close_expired_opportunities

router = APIRouter()


@router.post("/auth/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignUpRequest, db: Session = Depends(get_db)) -> TokenResponse:
    email = payload.email.lower()
    if db.scalar(select(Account.id).where(Account.email == email)) is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    account = Account(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return TokenResponse(access_token=create_access_token(account.id, account.role), account=account)


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    account = db.scalar(select(Account).where(Account.email == payload.email.lower()))
    if account is None or not verify_password(payload.password, account.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    return TokenResponse(access_token=create_access_token(account.id, account.role), account=account)


@router.get("/auth/me", response_model=AccountOut)
def current_profile(account: Account = Depends(get_current_account)) -> Account:
    return account


@router.get("/opportunities/mine", response_model=list[OpportunityOut])
def my_opportunities(
    db: Session = Depends(get_db),
    account: Account = Depends(require_roles("admin", "organizer", "trainer")),
) -> list[Opportunity]:
    statement = select(Opportunity).where(Opportunity.status != "deleted")
    if account.role != "admin":
        statement = statement.where(Opportunity.owner_id == account.id)
    return list(db.scalars(statement.order_by(Opportunity.created_at.desc())))


@router.get("/opportunities", response_model=list[OpportunityOut])
def list_opportunities(
    type: str | None = None,
    category: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
) -> list[Opportunity]:
    close_expired_opportunities(db)
    statement = select(Opportunity).where(Opportunity.status.not_in(("draft", "deleted")))
    if type in {"event", "training", "job"}:
        statement = statement.where(Opportunity.type == type)
    if category:
        statement = statement.where(Opportunity.category.ilike(f"%{category.strip()}%"))
    if search:
        term = f"%{search.strip()}%"
        statement = statement.where(
            or_(Opportunity.title.ilike(term), Opportunity.company.ilike(term), Opportunity.description.ilike(term))
        )
    items = list(db.scalars(statement.order_by(Opportunity.created_at.desc())))
    for item in items:
        if item.deadline is not None and item.deadline < date.today() and item.status == "open":
            item.status = "closed"
    if any(item.status == "closed" for item in items):
        db.commit()
    return items


@router.get("/opportunities/{opportunity_id}", response_model=OpportunityOut)
def get_opportunity(opportunity_id: int, db: Session = Depends(get_db)) -> Opportunity:
    close_expired_opportunities(db)
    item = db.get(Opportunity, opportunity_id)
    if item is None or item.status in {"draft", "deleted"}:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return item


@router.post("/opportunities", response_model=OpportunityOut, status_code=status.HTTP_201_CREATED)
def create_opportunity(
    payload: OpportunityCreate,
    db: Session = Depends(get_db),
    account: Account = Depends(require_roles("admin", "organizer", "trainer")),
) -> Opportunity:
    if payload.deadline is not None and payload.deadline < date.today():
        raise HTTPException(status_code=422, detail="The deadline must be today or later")
    values = payload.model_dump()
    if values["type"] == "training" and account.role not in {"admin", "trainer", "organizer"}:
        raise HTTPException(status_code=403, detail="Only trainers and organizers can create training")
    item = Opportunity(owner_id=account.id, **values)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/opportunities/{opportunity_id}", response_model=OpportunityOut)
def update_opportunity(
    opportunity_id: int,
    payload: OpportunityUpdate,
    db: Session = Depends(get_db),
    account: Account = Depends(require_roles("admin", "organizer", "trainer")),
) -> Opportunity:
    item = db.get(Opportunity, opportunity_id)
    if item is None or item.status == "deleted":
        raise HTTPException(status_code=404, detail="Opportunity not found")
    if item.owner_id != account.id and account.role != "admin":
        raise HTTPException(status_code=403, detail="You can only edit your own listings")
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("deadline") is not None and changes["deadline"] < date.today():
        raise HTTPException(status_code=422, detail="The deadline must be today or later")
    for key, value in changes.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/opportunities/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db),
    account: Account = Depends(require_roles("admin", "organizer", "trainer")),
) -> None:
    item = db.get(Opportunity, opportunity_id)
    if item is None or item.status == "deleted":
        raise HTTPException(status_code=404, detail="Opportunity not found")
    if item.owner_id != account.id and account.role != "admin":
        raise HTTPException(status_code=403, detail="You can only delete your own listings")
    item.status = "deleted"
    db.commit()


@router.get("/opportunities/{opportunity_id}/curriculum", response_model=list[TrainingModuleOut])
def get_curriculum(opportunity_id: int, db: Session = Depends(get_db)) -> list[TrainingModule]:
    item = db.get(Opportunity, opportunity_id)
    if item is None or item.type != "training" or item.status in {"draft", "deleted"}:
        raise HTTPException(status_code=404, detail="Training program not found")
    return list(
        db.scalars(
            select(TrainingModule)
            .where(TrainingModule.opportunity_id == opportunity_id)
            .order_by(TrainingModule.position)
        )
    )


@router.put("/opportunities/{opportunity_id}/curriculum", response_model=list[TrainingModuleOut])
def replace_curriculum(
    opportunity_id: int,
    payload: CurriculumUpdate,
    db: Session = Depends(get_db),
    account: Account = Depends(require_roles("admin", "organizer", "trainer")),
) -> list[TrainingModule]:
    item = db.get(Opportunity, opportunity_id)
    if item is None or item.type != "training" or item.status == "deleted":
        raise HTTPException(status_code=404, detail="Training program not found")
    if item.owner_id != account.id and account.role != "admin":
        raise HTTPException(status_code=403, detail="You can only manage your own training programs")
    modules = list(
        db.scalars(select(TrainingModule).where(TrainingModule.opportunity_id == opportunity_id))
    )
    for module in modules:
        db.delete(module)
    db.flush()
    created = []
    for module_position, module_data in enumerate(payload.modules):
        module = TrainingModule(
            opportunity_id=opportunity_id,
            title=module_data.title.strip(),
            position=module_position,
            lessons=[
                TrainingLesson(
                    title=lesson.title.strip(),
                    content=lesson.content.strip(),
                    position=lesson_position,
                )
                for lesson_position, lesson in enumerate(module_data.lessons)
            ],
        )
        db.add(module)
        created.append(module)
    db.commit()
    for module in created:
        db.refresh(module)
    return created


@router.post(
    "/opportunities/{opportunity_id}/actions",
    response_model=ParticipationOut,
    status_code=status.HTTP_201_CREATED,
)
def register_or_apply(
    opportunity_id: int,
    payload: ActionCreate,
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
) -> Participation:
    close_expired_opportunities(db)
    item = db.get(Opportunity, opportunity_id)
    if item is None or item.status != "open":
        raise HTTPException(status_code=404, detail="This opportunity is not open")
    expected_kind = {"event": "registration", "training": "enrollment", "job": "application"}[item.type]
    if payload.kind != expected_kind:
        raise HTTPException(status_code=422, detail=f"Use {expected_kind} for this opportunity")
    if item.deadline is not None and item.deadline < date.today():
        item.status = "closed"
        db.commit()
        raise HTTPException(status_code=409, detail="The deadline has passed")
    existing = db.scalar(
        select(Participation).where(
            Participation.account_id == account.id,
            Participation.opportunity_id == item.id,
            Participation.kind == payload.kind,
        )
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="You already have an active record for this opportunity")
    record = Participation(
        account_id=account.id,
        opportunity_id=item.id,
        kind=payload.kind,
        status="pending" if payload.kind in {"registration", "application"} else "enrolled",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/me/dashboard", response_model=UserDashboardOut)
def user_dashboard(
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
) -> UserDashboardOut:
    close_expired_opportunities(db)
    activity_rows = db.execute(
        select(Participation, Opportunity)
        .join(Opportunity, Opportunity.id == Participation.opportunity_id)
        .where(Participation.account_id == account.id)
        .order_by(Participation.created_at.desc())
    ).all()
    activity = [
        ActivityDashboardItem(
            id=record.id,
            opportunity_id=opportunity.id,
            opportunity_title=opportunity.title,
            opportunity_type=opportunity.type,
            deadline=opportunity.deadline,
            kind=record.kind,
            status=record.status,
            progress=record.progress,
            created_at=record.created_at,
        )
        for record, opportunity in activity_rows
    ]
    upcoming_by_id: dict[int, UpcomingDeadline] = {}
    for record, opportunity in activity_rows:
        if (
            opportunity.status == "open"
            and opportunity.deadline is not None
            and opportunity.deadline >= date.today()
        ):
            upcoming_by_id[opportunity.id] = UpcomingDeadline(
                opportunity_id=opportunity.id,
                opportunity_title=opportunity.title,
                kind=record.kind,
                deadline=opportunity.deadline,
            )

    submission_rows = db.execute(
        select(WorkSubmission, Opportunity)
        .join(Opportunity, Opportunity.id == WorkSubmission.opportunity_id)
        .where(WorkSubmission.account_id == account.id)
        .order_by(WorkSubmission.updated_at.desc())
    ).all()
    submissions = [
        {
            "id": submission.id,
            "account_id": submission.account_id,
            "opportunity_id": opportunity.id,
            "opportunity_title": opportunity.title,
            "deadline": opportunity.deadline,
            "link": submission.link,
            "attachment": submission.attachment,
            "description": submission.description,
            "status": submission.status,
            "feedback": submission.feedback,
            "created_at": submission.created_at,
            "updated_at": submission.updated_at,
        }
        for submission, opportunity in submission_rows
    ]
    progress_rows = db.execute(
        select(LessonProgress, TrainingLesson, TrainingModule)
        .join(TrainingLesson, TrainingLesson.id == LessonProgress.lesson_id)
        .join(TrainingModule, TrainingModule.id == TrainingLesson.module_id)
        .where(LessonProgress.account_id == account.id)
    ).all()
    lesson_progress = [
        {
            "id": progress.id,
            "lesson_id": lesson.id,
            "opportunity_id": module.opportunity_id,
            "completed_at": progress.completed_at,
        }
        for progress, lesson, module in progress_rows
    ]
    return UserDashboardOut(
        activity=activity,
        submissions=submissions,
        lesson_progress=lesson_progress,
        upcoming_deadlines=sorted(
            upcoming_by_id.values(),
            key=lambda deadline: (deadline.deadline, deadline.opportunity_title),
        )[:10],
    )


@router.get("/me/saved", response_model=list[OpportunityOut])
def list_saved_opportunities(
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
) -> list[Opportunity]:
    return list(
        db.scalars(
            select(Opportunity)
            .join(SavedOpportunity, SavedOpportunity.opportunity_id == Opportunity.id)
            .where(
                SavedOpportunity.account_id == account.id,
                Opportunity.status != "deleted",
            )
            .order_by(SavedOpportunity.created_at.desc())
        )
    )


@router.put("/me/saved/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def save_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
) -> None:
    item = db.get(Opportunity, opportunity_id)
    if item is None or item.status in {"draft", "deleted"}:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    saved = db.scalar(
        select(SavedOpportunity.id).where(
            SavedOpportunity.account_id == account.id,
            SavedOpportunity.opportunity_id == opportunity_id,
        )
    )
    if saved is None:
        db.add(SavedOpportunity(account_id=account.id, opportunity_id=opportunity_id))
        db.commit()


@router.delete("/me/saved/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
) -> None:
    saved = db.scalar(
        select(SavedOpportunity).where(
            SavedOpportunity.account_id == account.id,
            SavedOpportunity.opportunity_id == opportunity_id,
        )
    )
    if saved is not None:
        db.delete(saved)
        db.commit()


@router.get("/me/activity", response_model=list[ParticipationOut])
def my_activity(
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
) -> list[Participation]:
    return list(
        db.scalars(
            select(Participation)
            .where(Participation.account_id == account.id)
            .order_by(Participation.created_at.desc())
        )
    )


@router.patch(
    "/me/activity/{participation_id}/progress",
    response_model=ParticipationOut,
    status_code=status.HTTP_409_CONFLICT,
)
def update_training_progress(
    participation_id: int,
    payload: TrainingProgressUpdate,
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
) -> Participation:
    record = db.get(Participation, participation_id)
    if record is None or record.account_id != account.id or record.kind != "enrollment":
        raise HTTPException(status_code=404, detail="Training enrollment not found")
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Training progress is calculated from completed lessons",
    )


@router.get("/me/lesson-progress", response_model=list[LessonProgressOut])
def my_lesson_progress(
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
) -> list[dict]:
    rows = db.execute(
        select(LessonProgress, TrainingLesson, TrainingModule)
        .join(TrainingLesson, TrainingLesson.id == LessonProgress.lesson_id)
        .join(TrainingModule, TrainingModule.id == TrainingLesson.module_id)
        .where(LessonProgress.account_id == account.id)
    ).all()
    return [
        {
            "id": progress.id,
            "lesson_id": lesson.id,
            "opportunity_id": module.opportunity_id,
            "completed_at": progress.completed_at,
        }
        for progress, lesson, module in rows
    ]


@router.post("/training/lessons/{lesson_id}/complete", response_model=LessonProgressOut)
def complete_training_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
) -> dict:
    lesson = db.get(TrainingLesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Training lesson not found")
    module = db.get(TrainingModule, lesson.module_id)
    enrollment = db.scalar(
        select(Participation).where(
            Participation.account_id == account.id,
            Participation.opportunity_id == module.opportunity_id,
            Participation.kind == "enrollment",
        )
    )
    if enrollment is None or enrollment.status == "rejected":
        raise HTTPException(status_code=403, detail="Enroll in this training program to track lessons")
    progress = db.scalar(
        select(LessonProgress).where(
            LessonProgress.account_id == account.id,
            LessonProgress.lesson_id == lesson.id,
        )
    )
    if progress is None:
        progress = LessonProgress(account_id=account.id, lesson_id=lesson.id)
        db.add(progress)
        db.flush()
    total_lessons = db.scalar(
        select(func.count())
        .select_from(TrainingLesson)
        .join(TrainingModule, TrainingModule.id == TrainingLesson.module_id)
        .where(TrainingModule.opportunity_id == module.opportunity_id)
    ) or 0
    completed_lessons = db.scalar(
        select(func.count())
        .select_from(LessonProgress)
        .join(TrainingLesson, TrainingLesson.id == LessonProgress.lesson_id)
        .join(TrainingModule, TrainingModule.id == TrainingLesson.module_id)
        .where(
            LessonProgress.account_id == account.id,
            TrainingModule.opportunity_id == module.opportunity_id,
        )
    ) or 0
    enrollment.progress = round(completed_lessons * 100 / total_lessons) if total_lessons else 0
    enrollment.status = "completed" if enrollment.progress == 100 else "enrolled"
    db.commit()
    db.refresh(progress)
    return {
        "id": progress.id,
        "lesson_id": lesson.id,
        "opportunity_id": module.opportunity_id,
        "completed_at": progress.completed_at,
    }


@router.get("/participations", response_model=list[ParticipationAdminOut])
def list_participations(
    db: Session = Depends(get_db),
    account: Account = Depends(require_roles("admin", "organizer", "trainer")),
) -> list[dict]:
    statement = select(Participation).join(Opportunity, Opportunity.id == Participation.opportunity_id)
    if account.role != "admin":
        statement = statement.where(Opportunity.owner_id == account.id)
    rows = db.execute(
        statement.join(Account, Account.id == Participation.account_id)
        .add_columns(Account.name, Account.email, Opportunity.title, Opportunity.type)
        .order_by(Participation.created_at.desc())
    ).all()
    return [
        {
            "id": record.id,
            "opportunity_id": record.opportunity_id,
            "kind": record.kind,
            "status": record.status,
            "progress": record.progress,
            "created_at": record.created_at,
            "account_id": record.account_id,
            "account_name": name,
            "account_email": email,
            "opportunity_title": title,
            "opportunity_type": opportunity_type,
        }
        for record, name, email, title, opportunity_type in rows
    ]


@router.patch("/participations/{participation_id}", response_model=ParticipationAdminOut)
def review_participation(
    participation_id: int,
    payload: ParticipationReview,
    db: Session = Depends(get_db),
    account: Account = Depends(require_roles("admin", "organizer", "trainer")),
) -> ParticipationAdminOut:
    record = db.get(Participation, participation_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Registration or application not found")
    opportunity = db.get(Opportunity, record.opportunity_id)
    if account.role != "admin" and (opportunity is None or opportunity.owner_id != account.id):
        raise HTTPException(status_code=403, detail="You can only manage activity on your own listings")
    record.status = payload.status
    db.commit()
    db.refresh(record)
    participant = db.get(Account, record.account_id)
    return ParticipationAdminOut(
        id=record.id,
        opportunity_id=record.opportunity_id,
        kind=record.kind,
        status=record.status,
        progress=record.progress,
        created_at=record.created_at,
        account_id=record.account_id,
        account_name=participant.name if participant else None,
        account_email=participant.email if participant else None,
        opportunity_title=opportunity.title if opportunity else None,
        opportunity_type=opportunity.type if opportunity else None,
    )


@router.post("/submissions", response_model=SubmissionOut, status_code=status.HTTP_201_CREATED)
def submit_work(
    payload: SubmissionCreate,
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
) -> WorkSubmission:
    close_expired_opportunities(db)
    item = db.get(Opportunity, payload.opportunity_id)
    if item is None or item.type == "job" or item.status != "open":
        raise HTTPException(status_code=404, detail="Event or training opportunity not found")
    if item.deadline is not None and item.deadline < date.today():
        raise HTTPException(status_code=409, detail="The submission deadline has passed")
    if payload.attachment:
        attachment_path = settings.upload_path / Path(payload.attachment).name
        if (
            Path(payload.attachment).name != payload.attachment
            or not payload.attachment.startswith(f"{account.id}-")
            or not attachment_path.is_file()
        ):
            raise HTTPException(status_code=422, detail="The attachment is invalid or does not belong to this account")
    existing = db.scalar(
        select(WorkSubmission).where(
            WorkSubmission.account_id == account.id,
            WorkSubmission.opportunity_id == item.id,
        )
    )
    if existing is not None:
        if existing.status != "submitted":
            raise HTTPException(status_code=409, detail="This submission has already been reviewed")
        existing.link = str(payload.link) if payload.link else None
        if payload.attachment is not None:
            existing.attachment = payload.attachment
        existing.description = payload.description
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return existing
    submission = WorkSubmission(
        account_id=account.id,
        opportunity_id=item.id,
        link=str(payload.link) if payload.link else None,
        attachment=payload.attachment,
        description=payload.description,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/submissions/mine", response_model=list[SubmissionOut])
def my_submissions(
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
) -> list[WorkSubmission]:
    return list(
        db.scalars(
            select(WorkSubmission)
            .where(WorkSubmission.account_id == account.id)
            .order_by(WorkSubmission.updated_at.desc())
        )
    )


@router.get("/submissions", response_model=list[SubmissionOut])
def review_queue(
    db: Session = Depends(get_db),
    account: Account = Depends(require_roles("admin", "organizer", "trainer")),
) -> list[WorkSubmission]:
    statement = select(WorkSubmission).order_by(WorkSubmission.created_at.asc())
    if account.role != "admin":
        statement = statement.join(Opportunity, Opportunity.id == WorkSubmission.opportunity_id).where(
            Opportunity.owner_id == account.id
        )
    return list(db.scalars(statement))


@router.patch("/submissions/{submission_id}", response_model=SubmissionOut)
def review_submission(
    submission_id: int,
    payload: SubmissionReview,
    db: Session = Depends(get_db),
    account: Account = Depends(require_roles("admin", "organizer", "trainer")),
) -> WorkSubmission:
    submission = db.get(WorkSubmission, submission_id)
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    opportunity = db.get(Opportunity, submission.opportunity_id)
    if account.role != "admin" and (opportunity is None or opportunity.owner_id != account.id):
        raise HTTPException(status_code=403, detail="You can only review submissions for your own listings")
    submission.status = payload.status
    submission.feedback = payload.feedback
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/members", response_model=list[MemberOut])
def list_members(
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
) -> list[Account]:
    return list(
        db.scalars(
            select(Account)
            .where(Account.id != account.id)
            .order_by(Account.name.asc())
        )
    )


@router.post("/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
) -> PlatformMessage:
    if payload.recipient_id == account.id:
        raise HTTPException(status_code=422, detail="Choose another member to message")
    if db.get(Account, payload.recipient_id) is None:
        raise HTTPException(status_code=404, detail="Recipient not found")
    message = PlatformMessage(sender_id=account.id, recipient_id=payload.recipient_id, body=payload.body.strip())
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("/messages", response_model=list[MessageOut])
def list_messages(
    with_user: int | None = None,
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
) -> list[PlatformMessage]:
    statement = select(PlatformMessage).where(
        or_(PlatformMessage.sender_id == account.id, PlatformMessage.recipient_id == account.id)
    )
    if with_user is not None:
        statement = statement.where(
            or_(
                (PlatformMessage.sender_id == account.id) & (PlatformMessage.recipient_id == with_user),
                (PlatformMessage.sender_id == with_user) & (PlatformMessage.recipient_id == account.id),
            )
        )
    messages = list(db.scalars(statement.order_by(PlatformMessage.sent_at.asc())))
    now = datetime.now(timezone.utc)
    for message in messages:
        if message.recipient_id == account.id and message.read_at is None:
            message.read_at = now
    if messages:
        db.commit()
    return messages


@router.post("/uploads")
async def upload_file(
    file: UploadFile = File(...),
    account: Account = Depends(get_current_account),
) -> dict[str, str]:
    allowed_extensions = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip", ".png", ".jpg", ".jpeg"}
    extension = Path(file.filename or "").suffix.lower()
    if extension not in allowed_extensions:
        raise HTTPException(status_code=415, detail="Unsupported file type")
    content = await file.read(settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024 + 1)
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds the upload size limit")
    stored_name = f"{account.id}-{uuid4().hex}{extension}"
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    target = settings.upload_path / stored_name
    target.write_bytes(content)
    return {"filename": file.filename or stored_name, "stored_name": stored_name}


@router.get("/uploads/{stored_name}")
def download_submission_file(
    stored_name: str,
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
) -> FileResponse:
    if Path(stored_name).name != stored_name:
        raise HTTPException(status_code=404, detail="File not found")
    submission = db.scalar(select(WorkSubmission).where(WorkSubmission.attachment == stored_name))
    if submission is None:
        raise HTTPException(status_code=404, detail="File not found")
    opportunity = db.get(Opportunity, submission.opportunity_id)
    if account.id != submission.account_id and account.role != "admin" and (
        opportunity is None or opportunity.owner_id != account.id
    ):
        raise HTTPException(status_code=403, detail="You do not have permission to access this file")
    target = settings.upload_path / stored_name
    if not target.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(target, filename=target.name, media_type="application/octet-stream")


@router.get("/admin/dashboard", response_model=DashboardOut)
def admin_dashboard(
    db: Session = Depends(get_db),
    _account: Account = Depends(require_roles("admin")),
) -> DashboardOut:
    close_expired_opportunities(db)
    visible_opportunities = Opportunity.status.not_in(("deleted", "draft"))
    return DashboardOut(
        users=int(db.scalar(select(func.count()).select_from(Account)) or 0),
        events=int(db.scalar(select(func.count()).select_from(Opportunity).where(Opportunity.type == "event", visible_opportunities)) or 0),
        training=int(db.scalar(select(func.count()).select_from(Opportunity).where(Opportunity.type == "training", visible_opportunities)) or 0),
        jobs=int(db.scalar(select(func.count()).select_from(Opportunity).where(Opportunity.type == "job", visible_opportunities)) or 0),
        registrations=int(db.scalar(select(func.count()).select_from(Participation).where(Participation.kind == "registration")) or 0),
        enrollments=int(db.scalar(select(func.count()).select_from(Participation).where(Participation.kind == "enrollment")) or 0),
        applications=int(db.scalar(select(func.count()).select_from(Participation).where(Participation.kind == "application")) or 0),
        pending_submissions=int(db.scalar(select(func.count()).select_from(WorkSubmission).where(WorkSubmission.status == "submitted")) or 0),
        total_submissions=int(db.scalar(select(func.count()).select_from(WorkSubmission)) or 0),
        pending_participations=int(db.scalar(select(func.count()).select_from(Participation).where(Participation.status == "pending")) or 0),
        approved_applications=int(db.scalar(select(func.count()).select_from(Participation).where(Participation.kind == "application", Participation.status == "approved")) or 0),
        rejected_applications=int(db.scalar(select(func.count()).select_from(Participation).where(Participation.kind == "application", Participation.status == "rejected")) or 0),
        open_opportunities=int(db.scalar(select(func.count()).select_from(Opportunity).where(Opportunity.status == "open")) or 0),
        closing_soon=int(
            db.scalar(
                select(func.count()).select_from(Opportunity).where(
                    Opportunity.status == "open",
                    Opportunity.deadline >= date.today(),
                    Opportunity.deadline <= date.today() + timedelta(days=3),
                )
            ) or 0
        ),
        closed_opportunities=int(db.scalar(select(func.count()).select_from(Opportunity).where(Opportunity.status == "closed")) or 0),
    )


@router.get("/admin/users", response_model=list[AccountOut])
def list_accounts(
    db: Session = Depends(get_db),
    _account: Account = Depends(require_roles("admin")),
) -> list[Account]:
    return list(db.scalars(select(Account).order_by(Account.created_at.desc())))


@router.patch("/admin/users/{account_id}/role", response_model=AccountOut)
def change_account_role(
    account_id: int,
    payload: AccountRoleUpdate,
    db: Session = Depends(get_db),
    _account: Account = Depends(require_roles("admin")),
) -> Account:
    account = db.get(Account, account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    account.role = payload.role
    db.commit()
    db.refresh(account)
    return account
