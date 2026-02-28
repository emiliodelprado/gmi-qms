"""FastAPI dependency that validates the session cookie."""
import os
from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from saml_handler import verify_session_token
from database import get_db
import models, schemas

DEV_MODE = os.environ.get("DEV_MODE", "false").lower() == "true"

# Roles with full admin privileges
ADMIN_ROLES = {"IT", "admin"}

DEV_USERS = {
    "admin": schemas.UserInfo(
        user_id="dev-admin",
        email="dev-admin@gmiberia.com",
        name="Dev User · IT",
        roles=["IT"],
        role="IT",
        company_id="GMS",
        brand_id="EPUNTO",
    ),
    "auditor": schemas.UserInfo(
        user_id="dev-auditor",
        email="dev-auditor@gmiberia.com",
        name="Dev User · Auditor",
        roles=["Auditor"],
        role="Auditor",
        company_id="GMS",
        brand_id="EPUNTO",
    ),
    "user": schemas.UserInfo(
        user_id="dev-user",
        email="dev-user@gmiberia.com",
        name="Dev User · Colaborador",
        roles=["Colaborador"],
        role="Colaborador",
        company_id="GMS",
        brand_id="EPUNTO",
    ),
}


def get_current_user(request: Request, db: Session = Depends(get_db)) -> schemas.UserInfo:
    if DEV_MODE:
        role_key = request.cookies.get("gmi_dev_role", "admin")
        return DEV_USERS.get(role_key, DEV_USERS["admin"])

    token = request.cookies.get("gmi_session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = verify_session_token(token)
    email   = payload["email"]

    import crud
    user = crud.get_user_access_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=403,
            detail="No tienes acceso a esta aplicación, contacta con el administrador",
        )

    # Resolve active tenant from request headers sent by the frontend
    req_company = request.headers.get("X-Tenant-Company")
    req_brand   = request.headers.get("X-Tenant-Brand")

    tenant = None
    if req_company and req_brand:
        tenant = crud.get_user_tenant_by_context(db, user.id, req_company, req_brand)

    # Fall back to first active tenant if no header or no match
    if not tenant:
        active = [t for t in user.tenants if t.activo == 1]
        tenant = active[0] if active else None

    if not tenant:
        raise HTTPException(
            status_code=403,
            detail="Sin acceso asignado a ninguna entidad. Contacta con el administrador.",
        )

    return schemas.UserInfo(
        user_id    = payload["user_id"],
        email      = email,
        name       = payload.get("name", ""),
        roles      = payload.get("roles", []),
        role       = tenant.role,
        company_id = tenant.company_id,
        brand_id   = tenant.brand_id,
    )


def require_admin(user: schemas.UserInfo = Depends(get_current_user)) -> schemas.UserInfo:
    """Require IT or Calidad role in the active tenant."""
    if user.role not in ADMIN_ROLES and user.role != "Calidad":
        raise HTTPException(status_code=403, detail="Acceso denegado: se requiere rol IT o Calidad")
    return user


def require_it(user: schemas.UserInfo = Depends(get_current_user)) -> schemas.UserInfo:
    """Require IT role only (security and system config)."""
    if user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Acceso denegado: se requiere rol IT")
    return user
