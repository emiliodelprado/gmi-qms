"""Create solicitudes table.

Revision ID: 017solicitudes
Revises: 016entityPosSupervisor
"""
from alembic import op

revision = "017solicitudes"
down_revision = "016entityPosSupervisor"


def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS solicitudes (
            id               SERIAL PRIMARY KEY,
            user_id          INTEGER NOT NULL REFERENCES user_access(id),
            user_email       VARCHAR(255) NOT NULL,
            user_name        VARCHAR(255) NOT NULL,
            pantalla         VARCHAR(200) NOT NULL,
            detalle          TEXT NOT NULL,
            estado           VARCHAR(20) NOT NULL DEFAULT 'enviada',
            comentario_admin TEXT,
            company_id       VARCHAR(10),
            brand_id         VARCHAR(50),
            activo           INTEGER NOT NULL DEFAULT 1,
            created_at       TIMESTAMP DEFAULT NOW(),
            updated_at       TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS ix_solicitudes_user_id ON solicitudes(user_id);
        CREATE INDEX IF NOT EXISTS ix_solicitudes_estado  ON solicitudes(estado);
    """)


def downgrade():
    op.execute("DROP TABLE IF EXISTS solicitudes;")
