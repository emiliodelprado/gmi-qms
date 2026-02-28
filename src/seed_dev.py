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


def run():
    db = SessionLocal()
    created = 0
    skipped = 0
    try:
        for u in SEED_USERS:
            any_existing = db.query(models.UserAccess).filter(
                models.UserAccess.email == u.email
            ).first()
            if any_existing:
                skipped += 1
                continue
            crud.create_user_access(db, u)
            created += 1
            tenant_summary = ", ".join(f"{t.company_id}·{t.brand_id}={t.role}" for t in u.tenants)
            print(f"  ✓  {u.email:<40}  [{tenant_summary}]")
    finally:
        db.close()

    print(f"\n  Seed completado: {created} creados, {skipped} ya existían.")


if __name__ == "__main__":
    print("▶ Seeding usuarios de desarrollo…")
    run()
