"""Add scope to user_tenants for hierarchical role assignment

Revision ID: 006userTenantScope
Revises: 005corpStructure
Create Date: 2026-03-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision      = "006userTenantScope"
down_revision = "005corpStructure"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    cols = {c["name"] for c in inspector.get_columns("user_tenants")}

    # 1. Añadir columna scope (idempotente)
    if "scope" not in cols:
        conn.execute(sa.text(
            "ALTER TABLE user_tenants "
            "ADD COLUMN scope VARCHAR(15) NOT NULL DEFAULT 'marca'"
        ))

    # 2. brand_id pasa a nullable
    conn.execute(sa.text(
        "ALTER TABLE user_tenants ALTER COLUMN brand_id DROP NOT NULL"
    ))

    # 3. Eliminar unique constraint antiguo
    conn.execute(sa.text(
        "ALTER TABLE user_tenants DROP CONSTRAINT IF EXISTS uq_user_tenant"
    ))

    # 4. Partial unique indexes por scope
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_ut_marca "
        "ON user_tenants (user_id, company_id, brand_id) "
        "WHERE scope = 'marca'"
    ))
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_ut_entidad "
        "ON user_tenants (user_id, company_id) "
        "WHERE scope = 'entidad'"
    ))
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_ut_grupo "
        "ON user_tenants (user_id, company_id) "
        "WHERE scope = 'grupo'"
    ))


def downgrade() -> None:
    conn = op.get_bind()

    # Eliminar partial indexes
    conn.execute(sa.text("DROP INDEX IF EXISTS uq_ut_grupo"))
    conn.execute(sa.text("DROP INDEX IF EXISTS uq_ut_entidad"))
    conn.execute(sa.text("DROP INDEX IF EXISTS uq_ut_marca"))

    # Eliminar registros con scope != 'marca' (no compatibles con el constraint antiguo)
    conn.execute(sa.text("DELETE FROM user_tenants WHERE scope != 'marca'"))

    # Restaurar brand_id NOT NULL
    conn.execute(sa.text(
        "UPDATE user_tenants SET brand_id = '' WHERE brand_id IS NULL"
    ))
    conn.execute(sa.text(
        "ALTER TABLE user_tenants ALTER COLUMN brand_id SET NOT NULL"
    ))

    # Restaurar unique constraint original
    conn.execute(sa.text(
        "ALTER TABLE user_tenants "
        "ADD CONSTRAINT uq_user_tenant UNIQUE (user_id, company_id, brand_id)"
    ))

    # Eliminar columna scope
    conn.execute(sa.text(
        "ALTER TABLE user_tenants DROP COLUMN IF EXISTS scope"
    ))
