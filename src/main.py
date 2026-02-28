"""
GMI Quality Management System – FastAPI Backend
"""
from fastapi import FastAPI, Depends, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os, time

from database import get_db, engine
import models, schemas, crud
from auth import get_current_user, require_admin, require_it, DEV_MODE

app = FastAPI(
    title="GMI Quality Management System API",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://qms.gmiberia.com",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-Tenant-Company", "X-Tenant-Brand"],
)


# ── Health ──────────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


# ── Startup ─────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    try:
        models.Base.metadata.create_all(bind=engine)
    except Exception:
        pass


def ensure_tables():
    try:
        models.Base.metadata.create_all(bind=engine)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    return xff.split(",")[0].strip() if xff else (request.client.host if request.client else "unknown")


# ── SSO / SAML auth ─────────────────────────────────────────────────────────────
@app.post("/auth/saml/callback")
async def saml_callback(request: Request, db: Session = Depends(get_db)):
    from saml_handler import process_saml_response
    session_token = await process_saml_response(request)

    from saml_handler import verify_session_token
    payload = verify_session_token(session_token)
    crud.update_last_login(db, payload["email"])
    crud.write_audit(db, payload["email"], "LOGIN", "Sesión SSO", ip_address=_client_ip(request))

    response = RedirectResponse(url="/", status_code=302)
    response.set_cookie(
        key="gmi_session", value=session_token,
        httponly=True, secure=True, samesite="lax", max_age=28800,
    )
    return response


@app.get("/auth/saml/metadata")
async def saml_metadata():
    from saml_handler import get_sp_metadata
    xml = get_sp_metadata()
    return JSONResponse(content=xml, media_type="application/xml")


@app.post("/auth/logout")
def logout(request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    crud.write_audit(db, current_user.email, "LOGOUT", "Sesión", ip_address=_client_ip(request))
    response = JSONResponse({"status": "logged_out"})
    response.delete_cookie("gmi_session")
    return response


@app.get("/auth/me", response_model=schemas.UserInfo)
def me(current_user: schemas.UserInfo = Depends(get_current_user)):
    return current_user


@app.get("/auth/permissions")
def my_permissions(
    current_user = Depends(get_current_user),
    db: Session  = Depends(get_db),
):
    """Returns the permission map {screen_id: permission} for the current user's active role."""
    rows = crud.get_role_permissions_by_role(db, current_user.role)
    return {"role": current_user.role, "permissions": {r.screen_id: r.permission for r in rows}}


@app.get("/auth/dev-login/{role}")
def dev_login(role: str):
    """DEV_MODE only: switch active dev user role via browser URL."""
    if not DEV_MODE:
        raise HTTPException(status_code=404, detail="Not found")
    valid_roles = ("admin", "auditor", "user")
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Role '{role}' no válido. Usa: {' | '.join(valid_roles)}")
    response = RedirectResponse(url="/", status_code=302)
    response.set_cookie(key="gmi_dev_role", value=role, httponly=True, samesite="lax")
    return response


@app.get("/auth/login")
async def saml_login(request: Request):
    from saml_handler import get_saml_auth
    auth = get_saml_auth(request)
    return RedirectResponse(auth.login(return_to="/"))


# ── LOCAL AUTH ──────────────────────────────────────────────────────────────────
@app.post("/auth/local/login", response_model=schemas.LocalLoginResponse)
def local_login(
    payload: schemas.LocalLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Authenticate with email + password (Argon2id). Sets session cookie."""
    ensure_tables()
    user = crud.verify_local_password(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    crud.update_last_login(db, user.email)

    # Resolve first active tenant for initial role
    first_tenant = next((t for t in user.tenants if t.activo == 1), None)
    role = first_tenant.role if first_tenant else "Colaborador"

    crud.write_audit(db, user.email, "LOGIN", "Sesión local", ip_address=_client_ip(request))

    from saml_handler import _sign_token
    session_token = _sign_token({
        "user_id": str(user.id),
        "email":   user.email,
        "name":    user.name or "",
        "roles":   [t.role for t in user.tenants if t.activo == 1],
        "exp":     int(time.time()) + 28800,   # 8 h
    })

    response = JSONResponse({"ok": True, "email": user.email, "role": role})
    response.set_cookie(
        key="gmi_session", value=session_token,
        httponly=True, secure=not DEV_MODE, samesite="lax", max_age=28800,
    )
    return response


@app.post("/auth/local/password-reset/request", response_model=schemas.PasswordResetRequestResponse)
def password_reset_request(
    payload: schemas.PasswordResetRequest,
    db: Session = Depends(get_db),
):
    ensure_tables()
    user = crud.get_user_access_by_email(db, payload.email)
    if not user or not user.password_hash:
        return schemas.PasswordResetRequestResponse(
            ok=True, message="Si el email existe, recibirás un enlace en breve."
        )

    raw_token = crud.create_password_reset_token(db, payload.email)

    if DEV_MODE:
        return schemas.PasswordResetRequestResponse(
            ok=True,
            message=f"[DEV_MODE] Token generado para {payload.email}.",
            token=raw_token,
        )

    return schemas.PasswordResetRequestResponse(
        ok=True, message="Si el email existe, recibirás un enlace en breve."
    )


@app.post("/auth/local/password-reset/confirm")
def password_reset_confirm(
    payload: schemas.PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    ensure_tables()
    if len(payload.new_password) < 12:
        raise HTTPException(status_code=422, detail="La contraseña debe tener al menos 12 caracteres")

    ok = crud.consume_password_reset_token(db, payload.token, payload.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail="Token inválido, expirado o ya utilizado")

    return {"ok": True, "message": "Contraseña actualizada correctamente"}


# ── ADMIN – User management ─────────────────────────────────────────────────────
@app.get("/api/adm/users", response_model=List[schemas.UserAccessRead])
def list_users(
    company_id: Optional[str] = Query(None),
    brand_id:   Optional[str] = Query(None),
    db:         Session        = Depends(get_db),
    user=Depends(require_admin),
):
    ensure_tables()
    return crud.get_user_access_list(db, company_id=company_id, brand_id=brand_id)


@app.post("/api/adm/users", response_model=schemas.UserAccessRead, status_code=201)
def create_user(
    payload: schemas.UserAccessCreate,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_admin),
):
    ensure_tables()
    obj = crud.create_user_access(db, payload)
    crud.write_audit(db, user.email, "USER_CREATE", payload.email,
                     company_id=user.company_id, brand_id=user.brand_id,
                     ip_address=_client_ip(request))
    return obj


@app.put("/api/adm/users/{uid}", response_model=schemas.UserAccessRead)
def update_user(
    uid:     int,
    payload: schemas.UserAccessCreate,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_admin),
):
    ensure_tables()
    obj = crud.update_user_access(db, uid, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="User not found")
    crud.write_audit(db, user.email, "EDIT", f"user:{payload.email}",
                     company_id=user.company_id, brand_id=user.brand_id,
                     ip_address=_client_ip(request))
    return obj


@app.delete("/api/adm/users/{uid}", status_code=204)
def delete_user(
    uid:     int,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_admin),
):
    ensure_tables()
    target = crud.get_user_access_by_id(db, uid)
    if not crud.delete_user_access(db, uid):
        raise HTTPException(status_code=404, detail="User not found")
    crud.write_audit(db, user.email, "DELETE", f"user:{target.email if target else uid}",
                     company_id=user.company_id, brand_id=user.brand_id,
                     ip_address=_client_ip(request))


@app.post("/api/adm/users/{uid}/reset-password")
def admin_reset_password(
    uid:     int,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_it),
):
    """IT-only: force-generate a password reset token for any user."""
    ensure_tables()
    target = crud.get_user_access_by_id(db, uid)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    raw_token = crud.create_password_reset_token(db, target.email)
    crud.write_audit(db, user.email, "ROLE_CHANGE", f"reset_password:{target.email}",
                     ip_address=_client_ip(request))

    result = {"ok": True, "email": target.email}
    if DEV_MODE:
        result["token"] = raw_token
    return result


# ── ADMIN – Tenant management ────────────────────────────────────────────────────
@app.get("/api/adm/users/{uid}/tenants", response_model=List[schemas.UserTenantRead])
def list_user_tenants(
    uid: int,
    db:  Session = Depends(get_db),
    user=Depends(require_admin),
):
    ensure_tables()
    return crud.get_user_tenants(db, uid)


@app.post("/api/adm/users/{uid}/tenants", response_model=schemas.UserTenantRead, status_code=201)
def add_tenant(
    uid:     int,
    payload: schemas.UserTenantEntry,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_admin),
):
    ensure_tables()
    obj = crud.add_user_tenant(db, uid, payload)
    crud.write_audit(db, user.email, "TENANT_ADD",
                     f"user:{uid} {payload.company_id}·{payload.brand_id}={payload.role}",
                     ip_address=_client_ip(request))
    return obj


@app.put("/api/adm/users/{uid}/tenants/{tid}", response_model=schemas.UserTenantRead)
def update_tenant(
    uid:     int,
    tid:     int,
    payload: schemas.UserTenantEntry,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_admin),
):
    ensure_tables()
    obj = crud.update_user_tenant(db, tid, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="Tenant assignment not found")
    crud.write_audit(db, user.email, "TENANT_EDIT",
                     f"user:{uid} tenant:{tid} role={payload.role}",
                     ip_address=_client_ip(request))
    return obj


@app.delete("/api/adm/users/{uid}/tenants/{tid}", status_code=204)
def remove_tenant(
    uid:     int,
    tid:     int,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_admin),
):
    ensure_tables()
    if not crud.remove_user_tenant(db, tid):
        raise HTTPException(status_code=404, detail="Tenant assignment not found")
    crud.write_audit(db, user.email, "TENANT_REMOVE",
                     f"user:{uid} tenant:{tid}",
                     ip_address=_client_ip(request))


# ── AUDIT LOG ───────────────────────────────────────────────────────────────────
@app.get("/api/adm/audit-log", response_model=List[schemas.AuditLogEntry])
def get_audit_log(
    company_id: Optional[str] = Query(None),
    brand_id:   Optional[str] = Query(None),
    limit:      int            = Query(200, ge=1, le=1000),
    db:         Session        = Depends(get_db),
    user=Depends(require_admin),
):
    ensure_tables()
    return crud.get_audit_log(db, company_id=company_id, brand_id=brand_id, limit=limit)


# ── ROLE PERMISSIONS ─────────────────────────────────────────────────────────────
@app.get("/api/adm/role-permissions", response_model=List[schemas.RolePermissionEntry])
def get_role_permissions(
    db: Session = Depends(get_db),
    user=Depends(require_admin),
):
    ensure_tables()
    rows = crud.get_role_permissions(db)
    return [schemas.RolePermissionEntry(role=r.role, screen_id=r.screen_id, permission=r.permission) for r in rows]


@app.put("/api/adm/role-permissions")
def save_role_permissions(
    payload: schemas.RolePermissionBulkSave,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_it),
):
    ensure_tables()
    crud.save_role_permissions(db, payload.permissions)
    crud.write_audit(db, user.email, "ROLE_CHANGE", "role_permissions_matrix",
                     ip_address=_client_ip(request))
    return {"ok": True, "saved": len(payload.permissions)}


# ── Serve frontend React (catch-all — siempre al final) ──────────────────────
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=f"{static_dir}/assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = os.path.join(static_dir, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(f"{static_dir}/index.html")
