"""Postgres async engine + session factory."""

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings

_engine = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


async def init_postgres() -> None:
    global _engine, _sessionmaker
    settings = get_settings()
    _engine = create_async_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )
    _sessionmaker = async_sessionmaker(_engine, expire_on_commit=False)


async def close_postgres() -> None:
    global _engine
    if _engine is not None:
        await _engine.dispose()
        _engine = None


async def get_session() -> AsyncIterator[AsyncSession]:
    if _sessionmaker is None:
        raise RuntimeError("Postgres not initialized. Call init_postgres() first.")
    async with _sessionmaker() as session:
        yield session
