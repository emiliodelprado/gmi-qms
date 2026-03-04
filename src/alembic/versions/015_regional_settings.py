"""Add regional_settings table with timezone.

Revision ID: 015regionalSettings
Revises: 014departmentNivel
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision = "015regionalSettings"
down_revision = "014departmentNivel"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)

    if "regional_settings" not in inspector.get_table_names():
        op.create_table(
            "regional_settings",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("timezone", sa.String(100), nullable=False, server_default="Europe/Madrid"),
            sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
        )
        # Seed default row
        conn.execute(
            sa.text("INSERT INTO regional_settings (id, timezone) VALUES (1, 'Europe/Madrid')")
        )


def downgrade() -> None:
    op.drop_table("regional_settings")
