"""Add default_company_id and default_brand_id to user_access

Revision ID: 008userDefaultTenant
Revises: 007legalFields
Create Date: 2026-03-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision      = "008userDefaultTenant"
down_revision = "007legalFields"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    cols = {c["name"] for c in inspector.get_columns("user_access")}

    if "default_company_id" not in cols:
        op.add_column(
            "user_access",
            sa.Column("default_company_id", sa.String(10), nullable=True),
        )
    if "default_brand_id" not in cols:
        op.add_column(
            "user_access",
            sa.Column("default_brand_id", sa.String(50), nullable=True),
        )


def downgrade() -> None:
    op.drop_column("user_access", "default_brand_id")
    op.drop_column("user_access", "default_company_id")
