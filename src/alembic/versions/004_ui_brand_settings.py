"""UI brand settings: logo and primary color per (company, brand)

Revision ID: 004uiBrandSettings
Revises: 003multitenantRoles
Create Date: 2026-03-01
"""
from alembic import op
import sqlalchemy as sa

revision      = '004uiBrandSettings'
down_revision = '003multitenantRoles'
branch_labels = None
depends_on    = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "ui_brand_settings" not in inspector.get_table_names():
        op.create_table(
            "ui_brand_settings",
            sa.Column("id",            sa.Integer,     primary_key=True),
            sa.Column("company_id",    sa.String(10),  nullable=False),
            sa.Column("brand_id",      sa.String(50),  nullable=False, server_default=""),
            sa.Column("logo_data",     sa.Text,        nullable=True),
            sa.Column("primary_color", sa.String(20),  nullable=True),
            sa.Column("updated_at",    sa.DateTime,    nullable=True),
            sa.UniqueConstraint("company_id", "brand_id", name="uq_ui_brand_settings"),
        )


def downgrade():
    op.drop_table("ui_brand_settings")
