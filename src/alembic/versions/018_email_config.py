"""Create email_config and email_templates tables.

Revision ID: 018emailConfig
Revises: 017solicitudes
"""
from alembic import op

revision = "018emailConfig"
down_revision = "017solicitudes"


def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS email_config (
            id              INTEGER PRIMARY KEY,
            provider        VARCHAR(20) NOT NULL DEFAULT 'mailjet',
            api_key         VARCHAR(500),
            api_secret      VARCHAR(500),
            sender_name     VARCHAR(200),
            sender_email    VARCHAR(200),
            reply_to        VARCHAR(200),
            signature_html  TEXT,
            updated_at      TIMESTAMP DEFAULT NOW()
        );
        INSERT INTO email_config (id, provider)
        SELECT 1, 'mailjet'
        WHERE NOT EXISTS (SELECT 1 FROM email_config WHERE id = 1);

        CREATE TABLE IF NOT EXISTS email_templates (
            id          SERIAL PRIMARY KEY,
            name        VARCHAR(200) NOT NULL,
            subject     VARCHAR(500) NOT NULL,
            body_html   TEXT,
            activo      INTEGER NOT NULL DEFAULT 1,
            created_at  TIMESTAMP DEFAULT NOW(),
            updated_at  TIMESTAMP DEFAULT NOW()
        );
    """)


def downgrade():
    op.execute("DROP TABLE IF EXISTS email_templates;")
    op.execute("DROP TABLE IF EXISTS email_config;")
