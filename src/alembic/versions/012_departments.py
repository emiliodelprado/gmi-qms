"""Add departments table and departamento_id to positions

Revision ID: 012departments
Revises: 011positionsCollaborators
Create Date: 2026-03-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision      = "012departments"
down_revision = "011positionsCollaborators"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    if "departments" not in tables:
        op.create_table(
            "departments",
            sa.Column("id",          sa.Integer,      primary_key=True),
            sa.Column("nombre",      sa.String(200),  nullable=False),
            sa.Column("descripcion", sa.Text,         nullable=True),
            sa.Column("activo",      sa.Integer,      nullable=False, server_default="1"),
            sa.Column("created_at",  sa.DateTime,     nullable=True),
            sa.Column("updated_at",  sa.DateTime,     nullable=True),
        )

    if "positions" in tables:
        existing_cols = [c["name"] for c in inspector.get_columns("positions")]
        if "departamento_id" not in existing_cols:
            op.add_column(
                "positions",
                sa.Column(
                    "departamento_id",
                    sa.Integer,
                    sa.ForeignKey("departments.id"),
                    nullable=True,
                ),
            )


def downgrade() -> None:
    op.drop_column("positions", "departamento_id")
    op.drop_table("departments")
