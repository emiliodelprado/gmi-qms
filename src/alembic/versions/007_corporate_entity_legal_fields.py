"""Add denominacion_social, domicilio_social, nif to corporate_entities

Revision ID: 007legalFields
Revises: 006userTenantScope
Create Date: 2026-03-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision      = "007legalFields"
down_revision = "006userTenantScope"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    cols = {c["name"] for c in inspector.get_columns("corporate_entities")}

    if "denominacion_social" not in cols:
        op.add_column(
            "corporate_entities",
            sa.Column("denominacion_social", sa.String(300), nullable=True),
        )
    if "domicilio_social" not in cols:
        op.add_column(
            "corporate_entities",
            sa.Column("domicilio_social", sa.String(500), nullable=True),
        )
    if "nif" not in cols:
        op.add_column(
            "corporate_entities",
            sa.Column("nif", sa.String(20), nullable=True),
        )


def downgrade() -> None:
    op.drop_column("corporate_entities", "nif")
    op.drop_column("corporate_entities", "domicilio_social")
    op.drop_column("corporate_entities", "denominacion_social")
