"""Redis async client — cache, queue, rate limits."""

import logging

import redis.asyncio as redis

from app.config import get_settings

logger = logging.getLogger(__name__)

_client: redis.Redis | None = None


async def init_redis() -> None:
    global _client
    settings = get_settings()
    _client = redis.from_url(settings.redis_url, decode_responses=True)
    await _client.ping()
    logger.info("Connected to Redis at %s", settings.redis_url)


async def close_redis() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def get_client() -> redis.Redis:
    if _client is None:
        raise RuntimeError("Redis not initialized. Call init_redis() first.")
    return _client
