"""Smoke tests — process is up, routes are wired."""

from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint() -> None:
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_openapi_lists_memory_routes() -> None:
    client = TestClient(app)
    response = client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json().get("paths", {})
    # Memory API surface must exist
    for expected in ("/memory/timeline", "/memory/patterns", "/memory/chat"):
        assert expected in paths, f"Missing route: {expected}"
