import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Alembic Config object
config = context.config

# Set up loggers
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import our models so autogenerate can detect schema changes
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from database import Base
import models  # noqa: F401 – registers all models on Base.metadata

target_metadata = Base.metadata

# Build DATABASE_URL from environment variables (same logic as database.py)
def get_url():
    user     = os.environ["DB_USER"]
    password = os.environ["DB_PASSWORD"]
    dbname   = os.environ["DB_NAME"]
    host     = os.environ.get("DB_HOST", "34.14.73.41")
    return f"postgresql+psycopg2://{user}:{password}@{host}/{dbname}"


def run_migrations_offline() -> None:
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    cfg = config.get_section(config.config_ini_section, {})
    cfg["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(cfg, prefix="sqlalchemy.", poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
