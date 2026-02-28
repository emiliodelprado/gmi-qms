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
    # ── 1. Create user_tenants ───────────────────────────────────────────────
    op.create_table(
        'user_tenants',
        sa.Column('id',         sa.Integer(),    nullable=False),
        sa.Column('user_id',    sa.Integer(),    nullable=False),
        sa.Column('company_id', sa.String(10),   nullable=False),
        sa.Column('brand_id',   sa.String(50),   nullable=False),
        sa.Column('role',       sa.String(50),   nullable=False),
        sa.Column('activo',     sa.Integer(),    nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(),   nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user_access.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', 'company_id', 'brand_id', name='uq_user_tenant'),
    )
    op.create_index('ix_ut_id',      'user_tenants', ['id'],      unique=False)
    op.create_index('ix_ut_user_id', 'user_tenants', ['user_id'], unique=False)

    # ── 2. Migrate existing data ─────────────────────────────────────────────
    # Each user_access row had exactly one (company_id, brand_id, role) → move it to user_tenants
    op.execute("""
        INSERT INTO user_tenants (user_id, company_id, brand_id, role, activo, created_at)
        SELECT
            id,
            COALESCE(company_id, 'GMS'),
            COALESCE(brand_id,   'EPUNTO'),
            COALESCE(role,       'Colaborador'),
            activo,
            created_at
        FROM user_access
    """)

    # ── 3. Drop migrated columns from user_access ────────────────────────────
    op.drop_column('user_access', 'role')
    op.drop_column('user_access', 'company_id')
    op.drop_column('user_access', 'brand_id')


def downgrade():
    # Re-add columns
    op.add_column('user_access', sa.Column('role',       sa.String(50),  nullable=True))
    op.add_column('user_access', sa.Column('company_id', sa.String(10),  nullable=True, server_default='GMS'))
    op.add_column('user_access', sa.Column('brand_id',   sa.String(50),  nullable=True, server_default='EPUNTO'))

    # Restore first tenant for each user
    op.execute("""
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
    """)

    op.drop_index('ix_ut_user_id', table_name='user_tenants')
    op.drop_index('ix_ut_id',      table_name='user_tenants')
    op.drop_table('user_tenants')
