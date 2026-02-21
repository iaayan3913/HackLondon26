from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import event
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

try:
    from .config import settings
except ImportError:  # pragma: no cover - allows top-level module imports
    from config import settings


engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
)


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record) -> None:  # noqa: ANN001, ARG001
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    try:
        from . import models  # noqa: F401
    except ImportError:  # pragma: no cover
        import models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def ensure_test_user() -> None:
    try:
        from .models import User
    except ImportError:  # pragma: no cover
        from models import User

    with SessionLocal() as db:
        user = db.get(User, 1)
        if user is None:
            db.add(User(id=1, name="Test User"))
            db.commit()
