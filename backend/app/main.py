"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    agents,
    auth,
    memory,
    cost,
    events,
    freshservice,
    health,
    security_module,
    settings as settings_api,
)
from app.config import get_settings
from app.core.logging import configure_logging
from app.db.neo4j import close_neo4j, init_neo4j
from app.db.postgres import close_postgres, init_postgres
from app.db.redis import close_redis, init_redis

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    configure_logging(settings.log_level)
    logger.info("Starting Intellicore CMP backend — env=%s", settings.app_env)

    await init_postgres()
    await init_neo4j()
    await init_redis()

    logger.info("All datastores connected. Ready to serve.")
    yield

    logger.info("Shutting down Intellicore CMP backend")
    await close_postgres()
    await close_neo4j()
    await close_redis()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Intellicore Cloud Management Platform",
        description=(
            "AI-native multi-cloud management with a per-customer knowledge graph. "
            "Hero API: /memory — the Intellicore Memory."
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, tags=["health"])
    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(memory.router, prefix="/memory", tags=["memory"])
    app.include_router(events.router, prefix="/events", tags=["events"])
    app.include_router(cost.router, prefix="/cost", tags=["cost"])
    app.include_router(security_module.router, prefix="/security", tags=["security"])
    app.include_router(settings_api.router, prefix="/settings", tags=["settings"])
    # FreshService webhook carries its own prefix.
    app.include_router(agents.router, prefix="/agents", tags=["agents"])
    app.include_router(freshservice.router)

    return app


app = create_app()
