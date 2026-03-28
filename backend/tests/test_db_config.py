from app.db import DEFAULT_DATABASE_URL, create_engine_for_url, get_database_url


def test_get_database_url_uses_env_value(monkeypatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://u:p@localhost:5432/custom_db")

    assert get_database_url() == "postgresql+psycopg://u:p@localhost:5432/custom_db"


def test_get_database_url_falls_back_to_default(monkeypatch) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)

    assert get_database_url() == DEFAULT_DATABASE_URL


def test_create_engine_for_url_supports_sqlalchemy_url() -> None:
    engine = create_engine_for_url("sqlite+pysqlite:///:memory:")

    assert str(engine.url).startswith("sqlite+pysqlite:///:memory:")
    engine.dispose()
