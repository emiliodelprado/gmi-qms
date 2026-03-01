"""
Seed script for DEV_MODE: inserts example users into the database.
Idempotent — skips users whose email already exists.

Run manually:   python seed_dev.py
Or via start-dev.sh (automatic in DEV_MODE).
"""
import os, sys

# .env.local is already sourced by start-dev.sh before this script runs
from database import SessionLocal
import models, crud, schemas

# Each user is defined with a list of tenant assignments (company_id, brand_id, role).
# This demonstrates the multi-tenant model: one identity, multiple access contexts.
SEED_USERS = [
    # ── admin@gms.com — IT en GMS·EPUNTO + Dirección en GMP·EPUNTO
    schemas.UserAccessCreate(
        email="admin@gms.com",
        name="Administrador IT",
        password="Admin1234Gms!",
        tenants=[
            schemas.UserTenantEntry(company_id="GMS", brand_id="EPUNTO",           role="IT"),
            schemas.UserTenantEntry(company_id="GMP", brand_id="EPUNTO",           role="IT"),
        ],
    ),
    # ── laura.sanchez@gms.com — Calidad en GMS (todas las marcas)
    schemas.UserAccessCreate(
        email="laura.sanchez@gms.com",
        name="Laura Sánchez",
        password="Calidad1234Gms!",
        tenants=[
            schemas.UserTenantEntry(company_id="GMS", brand_id="EPUNTO",           role="Calidad"),
            schemas.UserTenantEntry(company_id="GMS", brand_id="LIQUID",           role="Calidad"),
            schemas.UserTenantEntry(company_id="GMS", brand_id="THE LIQUID FINANCE", role="Calidad"),
        ],
    ),
    # ── ana.garcia@gms.com — Auditor en GMS·EPUNTO y GMP·EPUNTO
    schemas.UserAccessCreate(
        email="ana.garcia@gms.com",
        name="Ana García",
        password="Audit1234Gms!",
        tenants=[
            schemas.UserTenantEntry(company_id="GMS", brand_id="EPUNTO",           role="Auditor"),
            schemas.UserTenantEntry(company_id="GMP", brand_id="EPUNTO",           role="Auditor"),
        ],
    ),
    # ── carlos.dir@gms.com — Dirección en GMS·EPUNTO
    schemas.UserAccessCreate(
        email="carlos.dir@gms.com",
        name="Carlos Dirección",
        password="Direcc1234Gms!",
        tenants=[
            schemas.UserTenantEntry(company_id="GMS", brand_id="EPUNTO",           role="Dirección"),
        ],
    ),
    # ── miguel.torres@gms.com — Managers en GMS·LIQUID + GMP·LIQUID
    schemas.UserAccessCreate(
        email="miguel.torres@gms.com",
        name="Miguel Torres",
        password="Manager1234Gms!",
        tenants=[
            schemas.UserTenantEntry(company_id="GMS", brand_id="LIQUID",           role="Managers"),
            schemas.UserTenantEntry(company_id="GMP", brand_id="LIQUID",           role="Managers"),
        ],
    ),
    # ── sofia.colab@gms.com — Colaborador en GMS·LIQUID
    schemas.UserAccessCreate(
        email="sofia.colab@gms.com",
        name="Sofía Colaboradora",
        password="Colabo1234Gms!",
        tenants=[
            schemas.UserTenantEntry(company_id="GMS", brand_id="LIQUID",           role="Colaborador"),
        ],
    ),
    # ── partner.ext@acme.com — Partners en GMS·THE LIQUID FINANCE
    schemas.UserAccessCreate(
        email="partner.ext@acme.com",
        name="ACME Partner",
        password="Partner1234Gms!",
        tenants=[
            schemas.UserTenantEntry(company_id="GMS", brand_id="THE LIQUID FINANCE", role="Partners"),
        ],
    ),
    # ── pedro.lopez@gms.com — Colaborador inactivo en GMS·THE LIQUID FINANCE
    schemas.UserAccessCreate(
        email="pedro.lopez@gms.com",
        name="Pedro López",
        password="Colabo1234Gms!",
        activo=0,
        tenants=[
            schemas.UserTenantEntry(company_id="GMS", brand_id="THE LIQUID FINANCE", role="Colaborador", activo=0),
        ],
    ),
    # ── isabel.costa@gmp.com — Dirección en GMP (EPUNTO + LIQUID)
    schemas.UserAccessCreate(
        email="isabel.costa@gmp.com",
        name="Isabel Costa",
        password="Direcc1234Gmp!",
        tenants=[
            schemas.UserTenantEntry(company_id="GMP", brand_id="EPUNTO",           role="Dirección"),
            schemas.UserTenantEntry(company_id="GMP", brand_id="LIQUID",           role="Dirección"),
        ],
    ),
    # ── sofia.melo@gmp.com — Calidad en GMP·EPUNTO
    schemas.UserAccessCreate(
        email="sofia.melo@gmp.com",
        name="Sofia Melo",
        password="Calidad1234Gmp!",
        tenants=[
            schemas.UserTenantEntry(company_id="GMP", brand_id="EPUNTO",           role="Calidad"),
        ],
    ),
    # ── joao.ferreira@gmp.com — Managers en GMP·LIQUID
    schemas.UserAccessCreate(
        email="joao.ferreira@gmp.com",
        name="João Ferreira",
        password="Manager1234Gmp!",
        tenants=[
            schemas.UserTenantEntry(company_id="GMP", brand_id="LIQUID",           role="Managers"),
        ],
    ),
]


SEED_STRUCTURE = [
    # (tipo, label, code, parent_code, sort_order)
    ("Grupo",         "Global Manager Iberia",   "GMI",    None,  0),
    ("Entidad Legal", "Global Manager Spain",    "GMS",    "GMI", 0),
    ("Marca",         "EPUNTO",                  "EPT",    "GMS", 0),
    ("Marca",         "LIQUID",                  "LIQ",    "GMS", 1),
    ("Marca",         "THE LIQUID FINANCE",      "TLF",    "GMS", 2),
    ("Entidad Legal", "Global Manager Portugal", "GMP",    "GMI", 1),
    ("Marca",         "EPUNTO",                  "EPT-PT", "GMP", 0),
    ("Marca",         "LIQUID",                  "LIQ-PT", "GMP", 1),
]


def seed_structure(db):
    count = db.query(models.CorporateEntity).count()
    if count > 0:
        print(f"  Estructura ya tiene {count} entidades — seed omitido.")
        return

    # Two-pass: insert roots first, then children (need parent ids)
    by_code = {}
    for tipo, label, code, parent_code, sort_order in SEED_STRUCTURE:
        parent_id = by_code.get(parent_code) if parent_code else None
        obj = models.CorporateEntity(
            tipo=tipo, label=label, code=code,
            parent_id=parent_id, sort_order=sort_order,
        )
        db.add(obj)
        db.flush()
        by_code[code] = obj.id
        print(f"  ✓  [{tipo:<14}] {label:<30} ({code})")

    db.commit()
    print(f"\n  Estructura corporativa: {len(SEED_STRUCTURE)} entidades creadas.")


def run():
    db = SessionLocal()
    try:
        count = db.query(models.UserAccess).count()
        if count > 0:
            print(f"  BD ya tiene {count} usuarios — seed omitido.")
        else:
            created = 0
            for u in SEED_USERS:
                crud.create_user_access(db, u)
                created += 1
                tenant_summary = ", ".join(f"{t.company_id}·{t.brand_id}={t.role}" for t in u.tenants)
                print(f"  ✓  {u.email:<40}  [{tenant_summary}]")
            print(f"\n  Seed completado: {created} creados.")

        print()
        print("▶ Seeding estructura corporativa…")
        seed_structure(db)
    finally:
        db.close()


if __name__ == "__main__":
    print("▶ Seeding usuarios de desarrollo…")
    run()
