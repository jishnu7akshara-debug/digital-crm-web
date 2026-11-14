"""add_document_sequences_table

Revision ID: 35f9fb7af7b2
Revises: ae55bf25660c
Create Date: 2026-11-14 17:51:47.068568

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '35f9fb7af7b2'
down_revision: str | Sequence[str] | None = 'ae55bf25660c'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "document_sequences",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("organization_id", sa.String(length=50), server_default="default", nullable=False),
        sa.Column("document_type", sa.String(length=50), nullable=False),
        sa.Column("financial_year", sa.String(length=20), nullable=False),
        sa.Column("last_value", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "document_type", "financial_year", name="uq_document_sequences_org_type_fy"),
    )
    op.create_index(
        op.f("ix_document_sequences_organization_id"),
        "document_sequences",
        ["organization_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_document_sequences_organization_id"), table_name="document_sequences")
    op.drop_table("document_sequences")
