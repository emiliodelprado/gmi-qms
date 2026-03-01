"""multi-tenant user roles: user_tenants junction table

Revision ID: 003multitenantRoles
Revises: 002localauth
Create Date: 2026-02-28
"""
from alembic import op
import sqlalchemy as sa

revision      = '003multitenantRoles'
down_revision = '002localauth'
branch_labels = None
depends_on    = None


def upgrade():
    conn = op.get_bind()

    # ── 1. Create user_tenants (idempotent) ──────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS user_tenants (
            id         SERIAL      PRIMARY KEY,
            user_id    INTEGER     NOT NULL REFERENCES user_access(id) ON DELETE CASCADE,
            company_id VARCHAR(10) NOT NULL,
            brand_id   VARCHAR(50) NOT NULL,
            role       VARCHAR(50) NOT NULL,
            activo     INTEGER     DEFAULT 1,
            created_at TIMESTAMP,
            CONSTRAINT uq_user_tenant UNIQUE (user_id, company_id, brand_id)
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_ut_id      ON user_tenants (id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_ut_user_id ON user_tenants (user_id)"
    ))

    # ── 2. Migrate data only if source columns still exist ───────────────────
    has_role = conn.execute(sa.text("""
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_access' AND column_name = 'role'
    """)).fetchone()

    if has_role:
        conn.execute(sa.text("""
            INSERT INTO user_tenants
                (user_id, company_id, brand_id, role, activo, created_at)
            SELECT
                id,
                COALESCE(company_id, 'GMS'),
                COALESCE(brand_id,   'EPUNTO'),
                COALESCE(role,       'Colaborador'),
                activo,
                created_at
            FROM user_access
            ON CONFLICT ON CONSTRAINT uq_user_tenant DO NOTHING
        """))

        # ── 3. Drop migrated columns ─────────────────────────────────────────
        conn.execute(sa.text(
            "ALTER TABLE user_access DROP COLUMN IF EXISTS role"
        ))
        conn.execute(sa.text(
            "ALTER TABLE user_access DROP COLUMN IF EXISTS company_id"
        ))
        conn.execute(sa.text(
            "ALTER TABLE user_access DROP COLUMN IF EXISTS brand_id"
        ))


def downgrade():
    conn = op.get_bind()

    # Re-add columns if they don't exist
    for col, typ, default in [
        ("role",       "VARCHAR(50)", "'Colaborador'"),
        ("company_id", "VARCHAR(10)", "'GMS'"),
        ("brand_id",   "VARCHAR(50)", "'EPUNTO'"),
    ]:
        exists = conn.execute(sa.text(f"""
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'user_access' AND column_name = '{col}'
        """)).fetchone()
        if not exists:
            conn.execute(sa.text(
                f"ALTER TABLE user_access ADD COLUMN {col} VARCHAR DEFAULT {default}"
            ))

    # Restore first tenant per user
    conn.execute(sa.text("""
        UPDATE user_access ua
        SET
            role       = ut.role,
            company_id = ut.company_id,
            brand_id   = ut.brand_id
        FROM (
            SELECT DISTINCT ON (user_id) user_id, role, company_id, brand_id
            FROM user_tenants
            ORDER BY user_id, id
        ) ut
        WHERE ua.id = ut.user_id
    """))

    conn.execute(sa.text("DROP INDEX IF EXISTS ix_ut_user_id"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_ut_id"))
    conn.execute(sa.text("DROP TABLE IF EXISTS user_tenants"))
