"""AWS adapter — pulls CloudTrail, Cost Anomaly Detector, Security Hub.

STAGING SCAFFOLD. In production this subscribes to an EventBridge bus that
the customer's org routes CloudTrail events to.
"""

from collections.abc import AsyncIterator

from app.adapters.base import CloudAdapter


class AWSAdapter(CloudAdapter):
    name = "aws"

    def __init__(self, region: str, access_key_id: str, secret_access_key: str) -> None:
        self.region = region
        self.access_key_id = access_key_id
        self.secret_access_key = secret_access_key

    async def fetch_events(self, tenant_id: str) -> AsyncIterator[dict]:
        # TODO: implement EventBridge → normalized events
        return
        yield {}
