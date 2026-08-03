"""Cloud event adapter contract.

Every adapter pulls events from a cloud provider (or file, or webhook) and
yields them in the normalized Intellicore Memory schema.
"""

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator


class CloudAdapter(ABC):
    """Base class for cloud event adapters."""

    name: str

    @abstractmethod
    async def fetch_events(self, tenant_id: str) -> AsyncIterator[dict]:
        """Yield normalized event dicts.

        Each dict must include: source, event_type, category, severity,
        timestamp, title, summary. Optional: resource_id, resource_type,
        raw_payload_ref, amount_inr (for cost events).
        """
        ...
