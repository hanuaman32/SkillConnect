from datetime import date, timedelta

from app.dependencies.database import get_db
from app.models.platform import Opportunity
from app.core.config import settings


def create_account(client, email: str, role: str = "student") -> tuple[dict, str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "name": "Taylor Reed",
            "email": email,
            "password": "thoughtful-password",
            "role": role,
        },
    )
    assert response.status_code == 201
    result = response.json()
    return result["account"], result["access_token"]


def create_opportunity(client, token: str, kind: str = "event", deadline: date | None = None) -> dict:
    response = client.post(
        "/api/v1/opportunities",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "type": kind,
            "title": f"Test {kind.title()}",
            "company": "SkillConnect",
            "category": "Technology",
            "description": "A complete workflow test opportunity.",
            "deadline": (deadline or date.today() + timedelta(days=10)).isoformat(),
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_event_approval_and_soft_delete_preserve_participants(client):
    _organizer, organizer_token = create_account(client, "organizer@example.com", "organizer")
    _student, student_token = create_account(client, "student@example.com")
    event = create_opportunity(client, organizer_token)
    student_headers = {"Authorization": f"Bearer {student_token}"}
    organizer_headers = {"Authorization": f"Bearer {organizer_token}"}

    registration = client.post(
        f"/api/v1/opportunities/{event['id']}/actions",
        headers=student_headers,
        json={"kind": "registration"},
    )
    assert registration.status_code == 201
    assert registration.json()["status"] == "pending"
    participants = client.get("/api/v1/participations", headers=organizer_headers)
    assert participants.json()[0]["account_name"] == "Taylor Reed"
    assert participants.json()[0]["opportunity_title"] == event["title"]

    reviewed = client.patch(
        f"/api/v1/participations/{registration.json()['id']}",
        headers=organizer_headers,
        json={"status": "approved"},
    )
    assert reviewed.status_code == 200
    assert reviewed.json()["status"] == "approved"

    deleted = client.delete(
        f"/api/v1/opportunities/{event['id']}",
        headers=organizer_headers,
    )
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/opportunities/{event['id']}").status_code == 404
    activity = client.get("/api/v1/me/activity", headers=student_headers)
    assert activity.status_code == 200
    assert activity.json()[0]["opportunity_id"] == event["id"]


def test_expired_opportunities_are_closed_and_actions_are_rejected(client):
    _organizer, organizer_token = create_account(client, "organizer@example.com", "organizer")
    _student, student_token = create_account(client, "student@example.com")
    student_headers = {"Authorization": f"Bearer {student_token}"}
    event = create_opportunity(client, organizer_token, deadline=date.today() + timedelta(days=1))
    db_generator = client.app.dependency_overrides[get_db]()
    db_session = next(db_generator)
    try:
        listing = db_session.get(Opportunity, event["id"])
        listing.deadline = date.today() - timedelta(days=1)
        db_session.commit()
    finally:
        db_generator.close()

    listing = client.get(f"/api/v1/opportunities/{event['id']}")
    assert listing.status_code == 200
    assert listing.json()["status"] == "closed"
    registration = client.post(
        f"/api/v1/opportunities/{event['id']}/actions",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"kind": "registration"},
    )
    assert registration.status_code == 404
    submission = client.post(
        "/api/v1/submissions",
        headers=student_headers,
        json={
            "opportunity_id": event["id"],
            "link": "https://example.com/late-project",
            "description": "A late project submission should be refused.",
        },
    )
    assert submission.status_code == 404


def test_training_curriculum_and_lesson_progress_are_persistent(client):
    _trainer, trainer_token = create_account(client, "trainer@example.com", "trainer")
    _student, student_token = create_account(client, "learner@example.com")
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}
    training = create_opportunity(client, trainer_token, kind="training")
    curriculum = client.put(
        f"/api/v1/opportunities/{training['id']}/curriculum",
        headers=trainer_headers,
        json={
            "modules": [
                {
                    "title": "Foundations",
                    "lessons": [
                        {"title": "Research basics", "content": "Learn user interviews."},
                        {"title": "Prototype", "content": "Build an interactive prototype."},
                    ],
                }
            ]
        },
    )
    assert curriculum.status_code == 200
    lessons = curriculum.json()[0]["lessons"]
    assert [item["title"] for item in client.get(
        f"/api/v1/opportunities/{training['id']}/curriculum"
    ).json()[0]["lessons"]] == ["Research basics", "Prototype"]

    not_enrolled = client.post(
        f"/api/v1/training/lessons/{lessons[0]['id']}/complete",
        headers=student_headers,
    )
    assert not_enrolled.status_code == 403
    enrollment = client.post(
        f"/api/v1/opportunities/{training['id']}/actions",
        headers=student_headers,
        json={"kind": "enrollment"},
    )
    assert enrollment.status_code == 201
    first = client.post(
        f"/api/v1/training/lessons/{lessons[0]['id']}/complete",
        headers=student_headers,
    )
    assert first.status_code == 200
    repeated = client.post(
        f"/api/v1/training/lessons/{lessons[0]['id']}/complete",
        headers=student_headers,
    )
    assert repeated.json()["id"] == first.json()["id"]
    activity = client.get("/api/v1/me/activity", headers=student_headers).json()[0]
    assert activity["progress"] == 50
    assert client.get("/api/v1/me/lesson-progress", headers=student_headers).json()[0]["lesson_id"] == lessons[0]["id"]


def test_applications_dashboard_and_real_admin_statistics(client):
    _organizer, organizer_token = create_account(client, "organizer@example.com", "organizer")
    _student, student_token = create_account(client, "student@example.com")
    admin_account, _student_token = create_account(client, "real-admin@example.com")

    # Admin provisioning is intentionally not exposed through public signup;
    # the fixture inserts the verified account through the test database.
    from app.models.platform import Account
    from app.core.security import create_access_token

    db_generator = client.app.dependency_overrides[get_db]()
    db_session = next(db_generator)
    try:
        admin_record = db_session.get(Account, admin_account["id"])
        admin_record.role = "admin"
        db_session.commit()
        admin_token = create_access_token(admin_account["id"], "admin")
    finally:
        db_generator.close()
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    organizer_headers = {"Authorization": f"Bearer {organizer_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}
    job = create_opportunity(client, organizer_token, kind="job", deadline=date.today() + timedelta(days=2))
    application = client.post(
        f"/api/v1/opportunities/{job['id']}/actions",
        headers=student_headers,
        json={"kind": "application"},
    )
    assert application.status_code == 201
    assert application.json()["status"] == "pending"
    dashboard = client.get("/api/v1/me/dashboard", headers=student_headers)
    assert dashboard.status_code == 200
    assert dashboard.json()["activity"][0]["opportunity_title"] == job["title"]
    assert dashboard.json()["activity"][0]["status"] == "pending"
    assert dashboard.json()["upcoming_deadlines"][0]["opportunity_id"] == job["id"]
    reviewed = client.patch(
        f"/api/v1/participations/{application.json()['id']}",
        headers=organizer_headers,
        json={"status": "approved"},
    )
    assert reviewed.status_code == 200
    assert reviewed.json()["account_name"] == "Taylor Reed"
    assert reviewed.json()["account_email"] == "student@example.com"
    assert reviewed.json()["opportunity_title"] == job["title"]
    assert reviewed.json()["opportunity_type"] == "job"
    refreshed_dashboard = client.get("/api/v1/me/dashboard", headers=student_headers)
    assert refreshed_dashboard.json()["activity"][0]["status"] == "approved"

    stats = client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert stats.status_code == 200
    assert stats.json()["users"] == 3
    assert stats.json()["jobs"] == 1
    assert stats.json()["applications"] == 1
    assert stats.json()["pending_participations"] == 0
    assert stats.json()["approved_applications"] == 1
    assert stats.json()["closing_soon"] == 1


def test_submission_dashboard_persists_file_and_organizer_feedback(client, tmp_path, monkeypatch):
    _organizer, organizer_token = create_account(client, "organizer@example.com", "organizer")
    _student, student_token = create_account(client, "student@example.com")
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))
    organizer_headers = {"Authorization": f"Bearer {organizer_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}
    training = create_opportunity(client, organizer_token, kind="training")
    upload = client.post(
        "/api/v1/uploads",
        headers=student_headers,
        files={"file": ("project.pdf", b"test content", "application/pdf")},
    )
    assert upload.status_code == 200
    submitted = client.post(
        "/api/v1/submissions",
        headers=student_headers,
        json={
            "opportunity_id": training["id"],
            "link": "https://example.com/project",
            "attachment": upload.json()["stored_name"],
            "description": "A completed project and what I learned while building it.",
        },
    )
    assert submitted.status_code == 201
    review = client.patch(
        f"/api/v1/submissions/{submitted.json()['id']}",
        headers=organizer_headers,
        json={"status": "approved", "feedback": "Clear and thoughtful work."},
    )
    assert review.status_code == 200
    dashboard = client.get("/api/v1/me/dashboard", headers=student_headers)
    assert dashboard.status_code == 200
    assert dashboard.json()["submissions"][0]["status"] == "approved"
    assert dashboard.json()["submissions"][0]["feedback"] == "Clear and thoughtful work."
    assert dashboard.json()["submissions"][0]["attachment"] == upload.json()["stored_name"]
    file_response = client.get(
        f"/api/v1/uploads/{upload.json()['stored_name']}",
        headers=student_headers,
    )
    assert file_response.status_code == 200
    assert file_response.content == b"test content"
