"""
copy_datos_to_prod.py — Copia todos los datos de la BD local a producción,
excepto las tablas de usuarios y seguridad.

Tablas copiadas:
  - corporate_entities   → estructura corporativa (debe ir primera: FK auto-referencial)
  - ui_brand_settings    → logos y colores de marca
  - role_permissions     → matriz de roles y permisos

Tablas NO copiadas (datos de usuario / seguridad, se gestionan en producción):
  - user_access          → usuarios y contraseñas
  - user_tenants         → asignaciones de tenant/rol
  - password_reset_tokens
  - audit_log            → registro de actividad

──────────────────────────────────────────────────────────────────────────────
INSTRUCCIONES DE USO
──────────────────────────────────────────────────────────────────────────────

1. Obtén la contraseña de producción desde Secret Manager:

     gcloud secrets versions access latest --secret=db-password --project=gmiberia

2. Inicia el Cloud SQL Auth Proxy en un terminal aparte:

     cloud-sql-proxy gmiberia:europe-west1:gmi-qms-db --port=5433

3. Ejecuta este script (desde el directorio src/, con el venv activo):

     # Vista previa sin cambios:
     TARGET_DB_PASSWORD=<contraseña> python copy_datos_to_prod.py --dry-run

     # Ejecución real:
     TARGET_DB_PASSWORD=<contraseña> python copy_datos_to_prod.py

Variables de entorno para el target (defaults para Cloud SQL via proxy):
  TARGET_DB_HOST      (default: 127.0.0.1)
  TARGET_DB_PORT      (default: 5433)
  TARGET_DB_USER      (default: gmi)
  TARGET_DB_NAME      (default: gmi_qms)
  TARGET_DB_PASSWORD  (requerido)

  O directamente: TARGET_DB_URL="postgresql+psycopg2://..."
"""
import os, sys, argparse
from pathlib import Path

# ── Load .env.local so the source DB vars are available ──────────────────────
env_local = Path(__file__).parent / ".env.local"
if env_local.exists():
    for line in env_local.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import models


# ── Source DB URL (same logic as database.py) ─────────────────────────────────
def _build_source_url() -> str:
    user = os.environ["DB_USER"]
    pwd  = os.environ["DB_PASSWORD"]
    name = os.environ.get("DB_NAME", "gmi_qms")
    host = os.environ.get("DB_HOST", "localhost")
    port = os.environ.get("DB_PORT", "5432")
    if host.startswith("/"):
        return f"postgresql+psycopg2://{user}:{pwd}@/{name}?host={host}"
    return f"postgresql+psycopg2://{user}:{pwd}@{host}:{port}/{name}"


# ── Target DB URL (proxy / direct) ────────────────────────────────────────────
def _build_target_url() -> str:
    if url := os.environ.get("TARGET_DB_URL"):
        return url
    user = os.environ.get("TARGET_DB_USER",     "gmi")
    name = os.environ.get("TARGET_DB_NAME",     "gmi_qms")
    host = os.environ.get("TARGET_DB_HOST",     "127.0.0.1")
    port = os.environ.get("TARGET_DB_PORT",     "5433")
    pwd  = os.environ.get("TARGET_DB_PASSWORD", "")
    if not pwd:
        print("ERROR: TARGET_DB_PASSWORD no está definida.", file=sys.stderr)
        print("       Obtén la contraseña con:", file=sys.stderr)
        print("       gcloud secrets versions access latest --secret=db-password --project=gmiberia", file=sys.stderr)
        sys.exit(1)
    return f"postgresql+psycopg2://{user}:{pwd}@{host}:{port}/{name}"


# ── Tables to copy, in insertion order ───────────────────────────────────────
# corporate_entities must be first (self-referential FK, insert by id order).
# Excluded: user_access, user_tenants, password_reset_tokens, audit_log
#           (user data and security — managed directly in production).
COPY_PLAN = [
    models.CorporateEntity,
    models.UIBrandSettings,
    models.RolePermission,
]


def transfer(src_url: str, tgt_url: str, dry_run: bool = False) -> None:
    print(f"  Origen : {src_url.split('@')[-1]}")
    print(f"  Destino: {tgt_url.split('@')[-1]}")
    print()

    src_engine = create_engine(src_url, pool_pre_ping=True)
    tgt_engine = create_engine(tgt_url, pool_pre_ping=True)

    # ── 1. Read all source data ───────────────────────────────────────────────
    plan: list[tuple] = []
    with Session(src_engine) as src_db:
        for model in COPY_PLAN:
            rows = src_db.query(model).order_by(model.id).all()
            dicts = [
                {col.name: getattr(row, col.name) for col in model.__table__.columns}
                for row in rows
            ]
            plan.append((model, dicts))
            print(f"  {'[DRY]' if dry_run else '     '} {model.__tablename__:<25} {len(dicts)} filas")

    if dry_run:
        print("\n  Dry run — sin cambios.")
        return

    print()

    with Session(tgt_engine) as tgt_db:
        # ── 2. Clear target tables (reverse order to avoid FK issues) ─────────
        for model, _ in reversed(plan):
            tname = model.__tablename__
            tgt_db.execute(text(f"TRUNCATE TABLE {tname} RESTART IDENTITY CASCADE"))
            tgt_db.commit()
            print(f"  🗑  {tname} vaciada")

        print()

        # ── 3. Insert rows with explicit IDs ──────────────────────────────────
        for model, dicts in plan:
            tname = model.__tablename__
            if not dicts:
                print(f"  ✓  {tname}: 0 filas (skip)")
                continue

            # Rows are already sorted by id (order_by(model.id) at read time),
            # so parents always precede children — no need to bypass FK checks.
            for row_dict in dicts:
                tgt_db.execute(model.__table__.insert().values(**row_dict))

            # Advance the sequence so future inserts don't collide
            max_id = max(d["id"] for d in dicts)
            tgt_db.execute(text(f"SELECT setval(pg_get_serial_sequence('{tname}','id'), {max_id}, true)"))

            tgt_db.commit()
            print(f"  ✓  {tname}: {len(dicts)} filas insertadas (max id={max_id})")

    print("\n  ✅ Transferencia completada.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Copia datos de local a producción (excluye tablas de usuario)"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Muestra qué se copiaría sin hacer cambios"
    )
    args = parser.parse_args()

    print("▶ GMI QMS — Copia de datos a producción")
    print("=" * 52)

    src_url = _build_source_url()
    tgt_url = _build_target_url()

    transfer(src_url, tgt_url, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
