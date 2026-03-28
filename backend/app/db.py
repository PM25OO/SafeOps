from __future__ import annotations

import os
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

DEFAULT_DATABASE_URL = "postgresql+psycopg://safeops:dev_password@localhost:5432/safe_ops_db"


def get_database_url() -> str:
    configured = os.getenv("DATABASE_URL", "").strip()
    return configured or DEFAULT_DATABASE_URL


def create_engine_for_url(database_url: str) -> Engine:
    return create_engine(
        database_url,
        pool_pre_ping=True,
        future=True,
    )


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    return create_engine_for_url(get_database_url())


@lru_cache(maxsize=1)
def get_session_factory() -> sessionmaker:
    return sessionmaker(
        bind=get_engine(),
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
    )


def new_session() -> Session:
    return get_session_factory()()
