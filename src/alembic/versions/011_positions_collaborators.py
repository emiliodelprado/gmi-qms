"""Add positions and collaborators tables

Revision ID: 011positionsCollaborators
Revises: 010qualityPolicy
Create Date: 2026-03-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision      = "011positionsCollaborators"
down_revision = "010qualityPolicy"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    if "positions" not in tables:
        op.create_table(
            "positions",
            sa.Column("id",          sa.Integer,      primary_key=True),
            sa.Column("nombre",      sa.String(200),  nullable=False),
            sa.Column("descripcion", sa.Text,         nullable=True),
            sa.Column("requisitos",  sa.Text,         nullable=True),
            sa.Column("activo",      sa.Integer,      nullable=False, server_default="1"),
            sa.Column("created_at",  sa.DateTime,     nullable=True),
            sa.Column("updated_at",  sa.DateTime,     nullable=True),
        )

    if "collaborators" not in tables:
        op.create_table(
            "collaborators",
            sa.Column("id",                 sa.Integer,      primary_key=True),
            sa.Column("nombre",             sa.String(200),  nullable=False),
            sa.Column("apellidos",          sa.String(200),  nullable=False),
            sa.Column("identificador_hrms", sa.String(100),  nullable=True),
            sa.Column("enlace_hrms",        sa.String(500),  nullable=True),
            sa.Column("puesto_id",          sa.Integer,      sa.ForeignKey("positions.id"), nullable=False),
            sa.Column("supervisor_id",      sa.Integer,      sa.ForeignKey("collaborators.id"), nullable=True),
            sa.Column("user_id",            sa.Integer,      sa.ForeignKey("user_access.id"), nullable=True),
            sa.Column("activo",             sa.Integer,      nullable=False, server_default="1"),
            sa.Column("created_at",         sa.DateTime,     nullable=True),
            sa.Column("updated_at",         sa.DateTime,     nullable=True),
        )

    if "collaborator_entities" not in tables:
        op.create_table(
            "collaborator_entities",
            sa.Column("id",              sa.Integer, primary_key=True),
            sa.Column("collaborator_id", sa.Integer, sa.ForeignKey("collaborators.id", ondelete="CASCADE"), nullable=False),
            sa.Column("entity_id",       sa.Integer, sa.ForeignKey("corporate_entities.id", ondelete="CASCADE"), nullable=False),
            sa.UniqueConstraint("collaborator_id", "entity_id", name="uq_collab_entity"),
        )


def downgrade() -> None:
    op.drop_table("collaborator_entities")
    op.drop_table("collaborators")
    op.drop_table("positions")
