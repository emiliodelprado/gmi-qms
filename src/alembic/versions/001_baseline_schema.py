"""baseline schema

Revision ID: 001baseline
Revises:
Create Date: 2026-02-27
"""
from alembic import op
import sqlalchemy as sa

revision = '001baseline'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'user_access',
        sa.Column('id',         sa.Integer(),     nullable=False),
        sa.Column('email',      sa.String(200),   nullable=False),
        sa.Column('name',       sa.String(200),   nullable=True),
        sa.Column('role',       sa.String(50),    nullable=False),
        sa.Column('activo',     sa.Integer(),     nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(),    nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_user_access_email', 'user_access', ['email'], unique=True)
    op.create_index('ix_user_access_id',    'user_access', ['id'],    unique=False)


def downgrade():
    op.drop_index('ix_user_access_email', table_name='user_access')
    op.drop_index('ix_user_access_id',    table_name='user_access')
    op.drop_table('user_access')
