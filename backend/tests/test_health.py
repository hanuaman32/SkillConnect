from sqlalchemy.exc import OperationalError

from app.dependencies.database import get_db
from app.main import app


def test_health_ok(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["service"]
    assert "timestamp" in body


def test_health_db_connected(client):
    # Logic test against in-memory SQLite. This does NOT prove PostgreSQL works;
    # use `python scripts/check_db.py` for that.
    r = client.get("/api/v1/health/db")
    assert r.status_code == 200
    assert r.json()["status"] == "connected"
    assert r.json()["dialect"] == "sqlite"


def test_health_db_unavailable_returns_503(client):
    class BrokenSession:
        def execute(self, *a, **k):
            raise OperationalError("SELECT 1", {}, Exception("connection refused"))

        def close(self):
            pass

    def broken_db():
        yield BrokenSession()

    app.dependency_overrides[get_db] = broken_db
    r = client.get("/api/v1/health/db")
    assert r.status_code == 503
    assert r.json()["detail"] == "Database unavailable"
    assert "refused" not in r.text  # internal error details must not leak


def test_cors_allows_frontend_origin(client):
    r = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert r.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_rejects_unknown_origin(client):
    r = client.get("/api/v1/health", headers={"Origin": "http://evil.example"})
    assert "access-control-allow-origin" not in r.headers
