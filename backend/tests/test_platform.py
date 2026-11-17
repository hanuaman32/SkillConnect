from datetime import date, timedelta


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
    body = response.json()
    return body["account"], body["access_token"]


def test_signup_login_and_duplicate_account(client):
    account, _token = create_account(client, "taylor@example.com")
    assert account["role"] == "student"
    assert client.post(
        "/api/v1/auth/signup",
        json={
            "name": "Taylor Reed",
            "email": "taylor@example.com",
            "password": "thoughtful-password",
        },
    ).status_code == 409
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "taylor@example.com", "password": "thoughtful-password"},
    )
    assert response.status_code == 200
    assert response.json()["access_token"]
    assert client.post(
        "/api/v1/auth/login",
        json={"email": "taylor@example.com", "password": "not-the-password"},
    ).status_code == 401


def test_organizer_crud_and_student_registration(client):
    _organizer, organizer_token = create_account(client, "organizer@example.com", "organizer")
    _student, student_token = create_account(client, "student@example.com")
    listing = client.post(
        "/api/v1/opportunities",
        headers={"Authorization": f"Bearer {organizer_token}"},
        json={
            "type": "event",
            "title": "Design Futures Challenge",
            "company": "SkillConnect",
            "category": "Design",
            "description": "A collaborative challenge for thoughtful designers.",
            "deadline": (date.today() + timedelta(days=14)).isoformat(),
        },
    )
    assert listing.status_code == 201
    opportunity_id = listing.json()["id"]
    assert client.get("/api/v1/opportunities?type=event").json()[0]["title"] == "Design Futures Challenge"

    action_url = f"/api/v1/opportunities/{opportunity_id}/actions"
    headers = {"Authorization": f"Bearer {student_token}"}
    action = client.post(action_url, headers=headers, json={"kind": "registration"})
    assert action.status_code == 201
    assert action.json()["status"] == "pending"
    assert client.post(action_url, headers=headers, json={"kind": "registration"}).status_code == 409
    assert client.get("/api/v1/me/activity", headers=headers).json()[0]["kind"] == "registration"

    updated = client.patch(
        f"/api/v1/opportunities/{opportunity_id}",
        headers={"Authorization": f"Bearer {organizer_token}"},
        json={"status": "closed"},
    )
    assert updated.status_code == 200
    assert client.delete(
        f"/api/v1/opportunities/{opportunity_id}",
        headers={"Authorization": f"Bearer {organizer_token}"},
    ).status_code == 204


def test_listing_creation_requires_organizer_role(client):
    _account, token = create_account(client, "student@example.com")
    response = client.post(
        "/api/v1/opportunities",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "type": "job",
            "title": "Junior Designer",
            "company": "Canopy",
            "category": "Design",
            "description": "A thoughtful entry-level product design role.",
        },
    )
    assert response.status_code == 403
    assert client.post(
        "/api/v1/opportunities",
        json={
            "type": "job",
            "title": "Junior Designer",
            "company": "Canopy",
            "category": "Design",
            "description": "A thoughtful entry-level product design role.",
        },
    ).status_code == 401


def test_training_progress_submissions_reviews_and_messaging(client):
    organizer, organizer_token = create_account(client, "trainer@example.com", "trainer")
    student, student_token = create_account(client, "learner@example.com")
    organizer_headers = {"Authorization": f"Bearer {organizer_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}
    listing = client.post(
        "/api/v1/opportunities",
        headers=organizer_headers,
        json={
            "type": "training",
            "title": "Product Design Foundations",
            "company": "SkillConnect Academy",
            "category": "Design",
            "description": "A guided program to practice useful design skills.",
            "deadline": (date.today() + timedelta(days=14)).isoformat(),
        },
    )
    assert listing.status_code == 201
    opportunity_id = listing.json()["id"]
    enrollment = client.post(
        f"/api/v1/opportunities/{opportunity_id}/actions",
        headers=student_headers,
        json={"kind": "enrollment"},
    ).json()
    progress = client.patch(
        f"/api/v1/me/activity/{enrollment['id']}/progress",
        headers=student_headers,
        json={"progress": 34},
    )
    assert progress.status_code == 409
    assert "completed lessons" in progress.json()["detail"]
    assert client.get("/api/v1/me/activity", headers=student_headers).json()[0]["progress"] == 0

    submitted = client.post(
        "/api/v1/submissions",
        headers=student_headers,
        json={
            "opportunity_id": opportunity_id,
            "link": "https://example.com/project",
            "description": "A short reflection on the prototype and the design decisions.",
        },
    )
    assert submitted.status_code == 201
    reviewed = client.patch(
        f"/api/v1/submissions/{submitted.json()['id']}",
        headers=organizer_headers,
        json={"status": "approved", "feedback": "Thoughtful work. Nice iteration."},
    )
    assert reviewed.status_code == 200
    assert reviewed.json()["status"] == "approved"
    assert client.post(
        "/api/v1/submissions",
        headers=student_headers,
        json={
            "opportunity_id": opportunity_id,
            "link": "https://example.com/updated",
            "description": "A changed submission after the review.",
        },
    ).status_code == 409

    sent = client.post(
        "/api/v1/messages",
        headers=student_headers,
        json={"recipient_id": organizer["id"], "body": "Could you share feedback on this course?"},
    )
    assert sent.status_code == 201
    history = client.get(
        f"/api/v1/messages?with_user={student['id']}",
        headers=organizer_headers,
    )
    assert history.status_code == 200
    assert history.json()[0]["body"] == "Could you share feedback on this course?"
    assert history.json()[0]["read_at"] is not None
    sender_history = client.get(
        f"/api/v1/messages?with_user={organizer['id']}",
        headers=student_headers,
    )
    assert sender_history.status_code == 200
    assert sender_history.json()[0]["body"] == "Could you share feedback on this course?"
    assert client.get("/api/v1/messages").status_code == 401


def test_admin_endpoints_enforce_roles(client):
    _organizer, organizer_token = create_account(client, "organizer@example.com", "organizer")
    _student, student_token = create_account(client, "student@example.com")
    organizer_headers = {"Authorization": f"Bearer {organizer_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}
    assert client.get("/api/v1/admin/dashboard", headers=organizer_headers).status_code == 403
    assert client.get("/api/v1/admin/users", headers=organizer_headers).status_code == 403
    assert client.get("/api/v1/participations", headers=student_headers).status_code == 403
    assert client.post(
        "/api/v1/auth/signup",
        json={
            "name": "Self-made Admin",
            "email": "not-admin@example.com",
            "password": "thoughtful-password",
            "role": "admin",
        },
    ).status_code == 422
