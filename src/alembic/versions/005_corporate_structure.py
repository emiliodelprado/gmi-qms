"""Corporate structure: hierarchical Grupo / Entidad Legal / Marca

Revision ID: 005corpStructure
Revises: 004uiBrandSettings
Create Date: 2026-03-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision      = '005corpStructure'
down_revision = '004uiBrandSettings'
branch_labels = None
depends_on    = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "corporate_entities" not in inspector.get_table_names():
        op.create_table(
            "corporate_entities",
            sa.Column("id",         sa.Integer(),     primary_key=True, autoincrement=True),
            sa.Column("tipo",       sa.String(20),    nullable=False),
            sa.Column("label",      sa.String(200),   nullable=False),
            sa.Column("code",       sa.String(20),    nullable=False),
            sa.Column("parent_id",  sa.Integer(),     sa.ForeignKey("corporate_entities.id", ondelete="SET NULL"), nullable=True),
            sa.Column("activo",     sa.Integer(),     nullable=False, server_default="1"),
            sa.Column("sort_order", sa.Integer(),     nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(),    nullable=True),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "corporate_entities" in inspector.get_table_names():
        op.drop_table("corporate_entities")
