"""Transaction context manager for atomic database operations."""

from collections.abc import Generator
from contextlib import contextmanager

from sqlalchemy.orm import Session


@contextmanager
def transactional(db: Session) -> Generator[Session, None, None]:
    """Wraps a block in an atomic database transaction.

    Commits on successful completion, rolls back on exception.
    Ensures that business changes and their audit log records commit together atomically.
    """
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
