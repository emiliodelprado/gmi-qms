"""Convert dept FK on positions and puesto FK on collaborators to many-to-many join tables

Revision ID: 013manyToMany
Revises: 012departments
Create Date: 2026-03-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision      = "013manyToMany"
down_revision = "012departments"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    conn      = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables    = inspector.get_table_names()

    # ── 1. position_departments ──────────────────────────────────────────────────
    if "position_departments" not in tables:
        op.create_table(
            "position_departments",
            sa.Column("id",            sa.Integer, primary_key=True),
            sa.Column("position_id",   sa.Integer,
                      sa.ForeignKey("positions.id",   ondelete="CASCADE"), nullable=False),
            sa.Column("department_id", sa.Integer,
                      sa.ForeignKey("departments.id", ondelete="CASCADE"), nullable=False),
            sa.UniqueConstraint("position_id", "department_id", name="uq_pos_dept"),
        )
        # Migrate existing 1-to-many data
        conn.execute(sa.text("""
            INSERT INTO position_departments (position_id, department_id)
            SELECT id, departamento_id
            FROM   positions
            WHERE  departamento_id IS NOT NULL
        """))

    # Drop the old FK column from positions
    if "positions" in tables:
        cols = [c["name"] for c in inspector.get_columns("positions")]
        if "departamento_id" in cols:
            op.drop_column("positions", "departamento_id")

    # ── 2. collaborator_positions ────────────────────────────────────────────────
    if "collaborator_positions" not in tables:
        op.create_table(
            "collaborator_positions",
            sa.Column("id",              sa.Integer, primary_key=True),
            sa.Column("collaborator_id", sa.Integer,
                      sa.ForeignKey("collaborators.id", ondelete="CASCADE"), nullable=False),
            sa.Column("position_id",     sa.Integer,
                      sa.ForeignKey("positions.id",     ondelete="CASCADE"), nullable=False),
            sa.UniqueConstraint("collaborator_id", "position_id", name="uq_collab_pos"),
        )
        # Migrate existing 1-to-many data
        conn.execute(sa.text("""
            INSERT INTO collaborator_positions (collaborator_id, position_id)
            SELECT id, puesto_id
            FROM   collaborators
            WHERE  puesto_id IS NOT NULL
        """))

    # Drop the old FK column from collaborators
    if "collaborators" in tables:
        cols = [c["name"] for c in inspector.get_columns("collaborators")]
        if "puesto_id" in cols:
            op.drop_column("collaborators", "puesto_id")


def downgrade() -> None:
    conn = op.get_bind()

    # Restore puesto_id (nullable; pick the first linked position)
    op.add_column("collaborators",
                  sa.Column("puesto_id", sa.Integer,
                            sa.ForeignKey("positions.id"), nullable=True))
    conn.execute(sa.text("""
        UPDATE collaborators c
        SET    puesto_id = (
            SELECT position_id
            FROM   collaborator_positions cp
            WHERE  cp.collaborator_id = c.id
            LIMIT  1
        )
    """))
    op.drop_table("collaborator_positions")

    # Restore departamento_id (pick the first linked department)
    op.add_column("positions",
                  sa.Column("departamento_id", sa.Integer,
                            sa.ForeignKey("departments.id"), nullable=True))
    conn.execute(sa.text("""
        UPDATE positions p
        SET    departamento_id = (
            SELECT department_id
            FROM   position_departments pd
            WHERE  pd.position_id = p.id
            LIMIT  1
        )
    """))
    op.drop_table("position_departments")
