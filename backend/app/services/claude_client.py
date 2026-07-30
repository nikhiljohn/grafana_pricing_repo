"""Anthropic Claude client — used by Memory Chat and pattern narration."""

import logging

from anthropic import AsyncAnthropic

from app.config import get_settings

logger = logging.getLogger(__name__)

_client: AsyncAnthropic | None = None


def get_claude() -> AsyncAnthropic:
    global _client
    if _client is None:
        settings = get_settings()
        if not settings.anthropic_api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not set. Memory Chat requires it."
            )
        _client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


async def ask_claude(
    *,
    system: str,
    user: str,
    max_tokens: int = 1024,
) -> str:
    """One-shot Claude call. Returns the assistant text response."""
    settings = get_settings()
    client = get_claude()
    response = await client.messages.create(
        model=settings.claude_model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    parts = [block.text for block in response.content if hasattr(block, "text")]
    return "\n".join(parts)
