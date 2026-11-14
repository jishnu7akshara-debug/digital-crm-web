"""Regression test for E712: SQLAlchemy boolean comparisons.

Proves that Model.is_deleted.is_(False) correctly generates SQL boolean filters
and accurately separates active vs soft-deleted records.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.crm import Client


def test_sqlalchemy_boolean_comparison_sql():
    """Verify SQL statement compilation for boolean comparison."""
    stmt_correct = select(Client).where(Client.is_deleted.is_(False))
    compiled = str(stmt_correct.compile(compile_kwargs={"literal_binds": True}))
    assert "is_deleted = false" in compiled.lower() or "is_deleted is false" in compiled.lower()

    stmt_true = select(Client).where(Client.is_deleted.is_(True))
    compiled_true = str(stmt_true.compile(compile_kwargs={"literal_binds": True}))
    c_lower = compiled_true.lower()
    assert "is_deleted = true" in c_lower or "is_deleted is true" in c_lower


def test_soft_delete_filter_behavior():
    """Verify that is_(False) query filters soft-deleted objects in an active session."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from app.db.base import Base

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine, tables=[Client.__table__])
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    db: Session = session_factory()

    try:
        active = Client(
            id="c-active",
            organization_id="org-1",
            name="Active Client",
            code="ACT-01",
            is_deleted=False,
        )
        deleted = Client(
            id="c-deleted",
            organization_id="org-1",
            name="Deleted Client",
            code="DEL-01",
            is_deleted=True,
        )
        db.add_all([active, deleted])
        db.commit()

        active_clients = db.query(Client).filter(Client.is_deleted.is_(False)).all()
        assert len(active_clients) == 1
        assert active_clients[0].id == "c-active"
        assert active_clients[0].is_deleted is False
    finally:
        db.close()
