"""Make user_tenants.company_id nullable and fix grupo unique index

scope='grupo' means the assignment covers the whole group and has no
specific company_id, so the column must allow NULL.
Also recreate uq_ut_grupo to enforce only one grupo assignment per user
(using (user_id) instead of (user_id, company_id) to avoid NULL semantics).

Revision ID: 009companyNullable
Revises: 008userDefaultTenant
Create Date: 2026-03-01
"""
from alembic import op
import sqlalchemy as sa

revision      = "009companyNullable"
down_revision = "008userDefaultTenant"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Make company_id nullable (scope='grupo' has no company_id)
    conn.execute(sa.text(
        "ALTER TABLE user_tenants ALTER COLUMN company_id DROP NOT NULL"
    ))

    # 2. Recreate uq_ut_grupo: (user_id) only — company_id is NULL for all grupo rows,
    #    so the old (user_id, company_id) index would allow duplicates due to NULL semantics.
    conn.execute(sa.text("DROP INDEX IF EXISTS uq_ut_grupo"))
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_ut_grupo "
        "ON user_tenants (user_id) WHERE scope = 'grupo'"
    ))


def downgrade() -> None:
    conn = op.get_bind()

    # Remove rows with NULL company_id (incompatible with NOT NULL)
    conn.execute(sa.text("DELETE FROM user_tenants WHERE company_id IS NULL"))

    # Restore NOT NULL
    conn.execute(sa.text(
        "ALTER TABLE user_tenants ALTER COLUMN company_id SET NOT NULL"
    ))

    # Restore old grupo index
    conn.execute(sa.text("DROP INDEX IF EXISTS uq_ut_grupo"))
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_ut_grupo "
        "ON user_tenants (user_id, company_id) WHERE scope = 'grupo'"
    ))
