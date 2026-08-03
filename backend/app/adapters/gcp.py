"""GCP adapter — pulls Cloud Audit Logs, Cost Anomalies, and SCC findings.

STAGING SCAFFOLD. In production this subscribes to a Pub/Sub topic that the
customer's org routes audit logs to (see infra/terraform/customer-onboarding).
"""

from collections.abc import AsyncIterator

from app.adapters.base import CloudAdapter


class GCPAdapter(CloudAdapter):
    name = "gcp"

    def __init__(self, project_id: str, credentials_path: str | None = None) -> None:
        self.project_id = project_id
        self.credentials_path = credentials_path

    async def fetch_events(self, tenant_id: str) -> AsyncIterator[dict]:
        # TODO: implement Pub/Sub pull + Cost API + SCC finding stream
        # See docs/adapters/gcp.md for the onboarding sink configuration.
        return
        yield {}
