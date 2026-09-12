"""Webhook auth tests.

This endpoint feeds attacker-influenced text into an agent prompt, so the
auth behaviour is security-relevant, not cosmetic.

The TestClient is constructed without a ``with`` block on purpose: entering
the context manager runs the app lifespan, which opens Neo4j and Redis
connections that are not available in unit tests.
"""

from __future__ import annotations

from dataclasses import dataclass

import pytest
from fastapi.testclient import TestClient

from app import main
from app.api import freshservice

SECRET = "test-webhook-secret"


@dataclass
class _StubSettings:
    """Only the field the webhook reads."""

    freshservice_webhook_secret: str


@pytest.fixture
def client():
    return TestClient(main.app)


@pytest.fixture
def with_secret(monkeypatch):
    monkeypatch.setattr(
        freshservice, "get_settings", lambda: _StubSettings(freshservice_webhook_secret=SECRET)
    )


@pytest.fixture
def without_secret(monkeypatch):
    monkeypatch.setattr(
        freshservice, "get_settings", lambda: _StubSettings(freshservice_webhook_secret="")
    )


def test_rejects_missing_signature(client, with_secret):
    r = client.post("/freshservice/webhook", json={"id": 1})
    assert r.status_code == 401


def test_rejects_wrong_signature(client, with_secret):
    r = client.post(
        "/freshservice/webhook",
        json={"id": 1},
        headers={"X-Intellicore-Signature": "wrong"},
    )
    assert r.status_code == 401


def test_accepts_valid_signature_and_queues_resolved_ticket(client, with_secret):
    r = client.post(
        "/freshservice/webhook",
        json={"id": 4471, "status": 4},  # 4 = Resolved
        headers={"X-Intellicore-Signature": SECRET},
    )
    assert r.status_code == 202
    body = r.json()
    assert body["ticket_id"] == 4471
    assert body["queued_for_curation"] is True


def test_closed_ticket_is_also_queued(client, with_secret):
    r = client.post(
        "/freshservice/webhook",
        json={"id": 4473, "status": 5},  # 5 = Closed
        headers={"X-Intellicore-Signature": SECRET},
    )
    assert r.json()["queued_for_curation"] is True


def test_open_ticket_is_accepted_but_not_queued(client, with_secret):
    r = client.post(
        "/freshservice/webhook",
        json={"id": 4472, "status": 2},  # 2 = Open
        headers={"X-Intellicore-Signature": SECRET},
    )
    assert r.status_code == 202
    assert r.json()["queued_for_curation"] is False


def test_accepts_freshservice_envelope_shape(client, with_secret):
    """FreshService wraps the payload; bare and wrapped must both work."""
    r = client.post(
        "/freshservice/webhook",
        json={"freshservice_webhook": {"id": 999, "status": 4}},
        headers={"X-Intellicore-Signature": SECRET},
    )
    assert r.status_code == 202
    assert r.json()["ticket_id"] == 999


def test_rejects_payload_without_ticket_id(client, with_secret):
    r = client.post(
        "/freshservice/webhook",
        json={"status": 4},
        headers={"X-Intellicore-Signature": SECRET},
    )
    assert r.status_code == 400


def test_fails_closed_when_secret_is_unset(client, without_secret):
    """An unset secret must never mean 'allow everyone'."""
    r = client.post(
        "/freshservice/webhook",
        json={"id": 1, "status": 4},
        headers={"X-Intellicore-Signature": "anything"},
    )
    assert r.status_code == 401
