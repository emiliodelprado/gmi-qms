"""Add nivel column (0-4) to departments table

Revision ID: 014departmentNivel
Revises: 013manyToMany
Create Date: 2026-03-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision      = "014departmentNivel"
down_revision = "013manyToMany"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    conn      = op.get_bind()
    inspector = Inspector.from_engine(conn)

    if "departments" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("departments")]
        if "nivel" not in cols:
            op.add_column(
                "departments",
                sa.Column("nivel", sa.Integer, nullable=False, server_default="0"),
            )


def downgrade() -> None:
    op.drop_column("departments", "nivel")
