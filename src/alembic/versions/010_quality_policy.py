"""Add quality_policies table

Revision ID: 010qualityPolicy
Revises: 009companyNullable
Create Date: 2026-03-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision      = "010qualityPolicy"
down_revision = "009companyNullable"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)

    if "quality_policies" not in inspector.get_table_names():
        op.create_table(
            "quality_policies",
            sa.Column("id",          sa.Integer,      primary_key=True),
            sa.Column("company_id",  sa.String(10),   nullable=False),
            sa.Column("brand_id",    sa.String(50),   nullable=False, server_default=""),
            sa.Column("version",     sa.String(20),   nullable=True),
            sa.Column("fecha",       sa.String(10),   nullable=True),
            sa.Column("proxima",     sa.String(10),   nullable=True),
            sa.Column("responsable", sa.String(200),  nullable=True),
            sa.Column("cargo",       sa.String(200),  nullable=True),
            sa.Column("contenido",   sa.Text,         nullable=True),
            sa.Column("updated_at",  sa.DateTime,     nullable=True),
            sa.Column("updated_by",  sa.String(200),  nullable=True),
            sa.UniqueConstraint("company_id", "brand_id", name="uq_quality_policy"),
        )


def downgrade() -> None:
    op.drop_table("quality_policies")
