"""Move positions and supervisors to per-entity assignments.

- Add supervisor_id to collaborator_entities
- Create collaborator_entity_positions join table
- Migrate existing data from collaborator_positions + collaborators.supervisor_id
- Drop collaborator_positions table
- Drop collaborators.supervisor_id column

Revision ID: 016entityPosSupervisor
Revises: 015regionalSettings
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision = "016entityPosSupervisor"
down_revision = "015regionalSettings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)

    # 1. Add supervisor_id to collaborator_entities
    if "collaborator_entities" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("collaborator_entities")]
        if "supervisor_id" not in cols:
            op.add_column(
                "collaborator_entities",
                sa.Column("supervisor_id", sa.Integer,
                          sa.ForeignKey("collaborators.id"), nullable=True),
            )

    # 2. Create collaborator_entity_positions table
    if "collaborator_entity_positions" not in inspector.get_table_names():
        op.create_table(
            "collaborator_entity_positions",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("collaborator_entity_id", sa.Integer,
                      sa.ForeignKey("collaborator_entities.id", ondelete="CASCADE"),
                      nullable=False),
            sa.Column("position_id", sa.Integer,
                      sa.ForeignKey("positions.id", ondelete="CASCADE"),
                      nullable=False),
            sa.UniqueConstraint("collaborator_entity_id", "position_id",
                                name="uq_ce_pos"),
        )

    # 3. Migrate supervisor: copy collaborators.supervisor_id → all entity rows
    if "collaborators" in inspector.get_table_names():
        c_cols = [c["name"] for c in inspector.get_columns("collaborators")]
        if "supervisor_id" in c_cols:
            conn.execute(sa.text("""
                UPDATE collaborator_entities ce
                SET    supervisor_id = c.supervisor_id
                FROM   collaborators c
                WHERE  c.id = ce.collaborator_id
                  AND  c.supervisor_id IS NOT NULL
                  AND  ce.supervisor_id IS NULL
            """))

    # 4. Migrate positions: for each collaborator_positions row, create a row
    #    in collaborator_entity_positions for EVERY entity of that collaborator
    if "collaborator_positions" in inspector.get_table_names():
        conn.execute(sa.text("""
            INSERT INTO collaborator_entity_positions (collaborator_entity_id, position_id)
            SELECT ce.id, cp.position_id
            FROM   collaborator_positions cp
            JOIN   collaborator_entities ce
              ON   ce.collaborator_id = cp.collaborator_id
            WHERE  NOT EXISTS (
                SELECT 1 FROM collaborator_entity_positions cep
                WHERE  cep.collaborator_entity_id = ce.id
                  AND  cep.position_id = cp.position_id
            )
        """))

    # 5. Drop collaborator_positions table
    if "collaborator_positions" in inspector.get_table_names():
        op.drop_table("collaborator_positions")

    # 6. Drop collaborators.supervisor_id column
    if "collaborators" in inspector.get_table_names():
        c_cols2 = [c["name"] for c in inspector.get_columns("collaborators")]
        if "supervisor_id" in c_cols2:
            op.drop_column("collaborators", "supervisor_id")


def downgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)

    # Re-add collaborators.supervisor_id
    if "collaborators" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("collaborators")]
        if "supervisor_id" not in cols:
            op.add_column(
                "collaborators",
                sa.Column("supervisor_id", sa.Integer,
                          sa.ForeignKey("collaborators.id"), nullable=True),
            )

    # Re-create collaborator_positions table
    if "collaborator_positions" not in inspector.get_table_names():
        op.create_table(
            "collaborator_positions",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("collaborator_id", sa.Integer,
                      sa.ForeignKey("collaborators.id", ondelete="CASCADE"),
                      nullable=False),
            sa.Column("position_id", sa.Integer,
                      sa.ForeignKey("positions.id", ondelete="CASCADE"),
                      nullable=False),
            sa.UniqueConstraint("collaborator_id", "position_id",
                                name="uq_collab_pos"),
        )

    # Drop collaborator_entity_positions table
    if "collaborator_entity_positions" in inspector.get_table_names():
        op.drop_table("collaborator_entity_positions")

    # Drop supervisor_id from collaborator_entities
    if "collaborator_entities" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("collaborator_entities")]
        if "supervisor_id" in cols:
            op.drop_column("collaborator_entities", "supervisor_id")
