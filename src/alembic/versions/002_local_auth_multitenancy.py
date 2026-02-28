"""local auth, multitenancy, audit_log, role_permissions

Revision ID: 002localauth
Revises: 001baseline
Create Date: 2026-02-28
"""
from alembic import op
import sqlalchemy as sa

revision      = '002localauth'
down_revision = '001baseline'
branch_labels = None
depends_on    = None


def upgrade():
    # ── 1. Extend user_access ────────────────────────────────────────────────
    op.add_column('user_access', sa.Column('company_id',    sa.String(10),  nullable=True, server_default='GMS'))
    op.add_column('user_access', sa.Column('brand_id',      sa.String(50),  nullable=True, server_default='EPUNTO'))
    op.add_column('user_access', sa.Column('password_hash', sa.String(200), nullable=True))
    op.add_column('user_access', sa.Column('last_login',    sa.DateTime(),  nullable=True))

    # ── 2. password_reset_tokens ─────────────────────────────────────────────
    op.create_table(
        'password_reset_tokens',
        sa.Column('id',         sa.Integer(),     nullable=False),
        sa.Column('user_email', sa.String(200),   nullable=False),
        sa.Column('token_hash', sa.String(64),    nullable=False),
        sa.Column('expires_at', sa.DateTime(),    nullable=False),
        sa.Column('used',       sa.Integer(),     nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(),    nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_hash'),
    )
    op.create_index('ix_prt_user_email', 'password_reset_tokens', ['user_email'], unique=False)
    op.create_index('ix_prt_id',        'password_reset_tokens', ['id'],         unique=False)

    # ── 3. audit_log ─────────────────────────────────────────────────────────
    op.create_table(
        'audit_log',
        sa.Column('id',         sa.Integer(),    nullable=False),
        sa.Column('user_email', sa.String(200),  nullable=False),
        sa.Column('action',     sa.String(30),   nullable=False),
        sa.Column('entity',     sa.String(100),  nullable=True),
        sa.Column('company_id', sa.String(10),   nullable=True),
        sa.Column('brand_id',   sa.String(50),   nullable=True),
        sa.Column('ip_address', sa.String(45),   nullable=True),
        sa.Column('timestamp',  sa.DateTime(),   nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_audit_log_id',         'audit_log', ['id'],         unique=False)
    op.create_index('ix_audit_log_user_email', 'audit_log', ['user_email'], unique=False)
    op.create_index('ix_audit_log_timestamp',  'audit_log', ['timestamp'],  unique=False)

    # ── 4. role_permissions ───────────────────────────────────────────────────
    op.create_table(
        'role_permissions',
        sa.Column('id',         sa.Integer(),  nullable=False),
        sa.Column('role',       sa.String(50), nullable=False),
        sa.Column('screen_id',  sa.String(30), nullable=False),
        sa.Column('permission', sa.String(5),  nullable=False, server_default='—'),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_rp_id',   'role_permissions', ['id'],   unique=False)
    op.create_index('ix_rp_role', 'role_permissions', ['role'], unique=False)


def downgrade():
    op.drop_index('ix_rp_role',              table_name='role_permissions')
    op.drop_index('ix_rp_id',               table_name='role_permissions')
    op.drop_table('role_permissions')

    op.drop_index('ix_audit_log_timestamp',  table_name='audit_log')
    op.drop_index('ix_audit_log_user_email', table_name='audit_log')
    op.drop_index('ix_audit_log_id',         table_name='audit_log')
    op.drop_table('audit_log')

    op.drop_index('ix_prt_id',        table_name='password_reset_tokens')
    op.drop_index('ix_prt_user_email', table_name='password_reset_tokens')
    op.drop_table('password_reset_tokens')

    op.drop_column('user_access', 'last_login')
    op.drop_column('user_access', 'password_hash')
    op.drop_column('user_access', 'brand_id')
    op.drop_column('user_access', 'company_id')
