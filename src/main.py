"""
GMI Quality Management System – FastAPI Backend
"""
from fastapi import FastAPI, Depends, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
import os, time

from database import get_db, engine
import models, schemas, crud
from auth import get_current_user, require_admin, require_it, require_manager, DEV_MODE

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


@app.get("/auth/dev-users")
def dev_users(db: Session = Depends(get_db)):
    """DEV_MODE only: list active users for the dev login picker."""
    if not DEV_MODE:
        raise HTTPException(status_code=404, detail="Not found")
    users = (
        db.query(models.UserAccess)
        .filter(models.UserAccess.activo == 1)
        .order_by(models.UserAccess.name)
        .all()
    )
    return [
        {
            "id": u.id,
            "email": u.email,
            "name": u.name or u.email,
            "tenants": [
                {"scope": t.scope, "company_id": t.company_id, "brand_id": t.brand_id, "role": t.role}
                for t in u.tenants if t.activo == 1
            ],
        }
        for u in users
    ]


@app.get("/auth/dev-login/user/{user_id}")
def dev_login_as_user(user_id: int, db: Session = Depends(get_db)):
    """DEV_MODE only: create a real session token for the given user."""
    if not DEV_MODE:
        raise HTTPException(status_code=404, detail="Not found")
    user = db.query(models.UserAccess).filter(
        models.UserAccess.id == user_id,
        models.UserAccess.activo == 1,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    from saml_handler import _sign_token
    session_token = _sign_token({
        "user_id": str(user.id),
        "email":   user.email,
        "name":    user.name or "",
        "roles":   [t.role for t in user.tenants if t.activo == 1],
        "exp":     int(time.time()) + 28800,
    })
    response = JSONResponse({"ok": True, "email": user.email})
    response.set_cookie(
        key="gmi_session", value=session_token,
        httponly=True, secure=False, samesite="lax", max_age=28800,
    )
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


# ── EST – Quality policy ────────────────────────────────────────────────────────
@app.get("/api/est/quality-policy", response_model=schemas.QualityPolicyRead)
def get_quality_policy(
    company_id: str           = Query(...),
    brand_id:   str           = Query(""),
    db:         Session       = Depends(get_db),
    user=Depends(get_current_user),
):
    ensure_tables()
    return crud.get_quality_policy(db, company_id, brand_id)


@app.put("/api/est/quality-policy")
def upsert_quality_policy(
    payload: schemas.QualityPolicyUpsert,
    db:      Session       = Depends(get_db),
    user=Depends(require_admin),
):
    ensure_tables()
    crud.upsert_quality_policy(db, payload, user.email)
    crud.write_audit(
        db, user.email, "EDIT",
        f"quality_policy:{payload.company_id}:{payload.brand_id or ''}",
        company_id=user.company_id, brand_id=user.brand_id,
    )
    return {"ok": True}


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
    try:
        obj = crud.create_user_access(db, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese email, o hay accesos duplicados (misma empresa·marca, empresa o grupo).")
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
    # Prevent self-deactivation
    if uid == int(user.user_id) and payload.activo == 0:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propia cuenta")
    try:
        obj = crud.update_user_access(db, uid, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Hay accesos duplicados: la combinación de scope + empresa/marca debe ser única por usuario.")
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
    if uid == int(user.user_id):
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta")
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
    scope_label = f"{payload.scope}:{payload.company_id}"
    if payload.brand_id:
        scope_label += f"·{payload.brand_id}"
    crud.write_audit(db, user.email, "TENANT_ADD",
                     f"user:{uid} {scope_label}={payload.role}",
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
    user_email: Optional[str] = Query(None),
    action:     Optional[str] = Query(None),
    date_from:  Optional[str] = Query(None),   # YYYY-MM-DD
    date_to:    Optional[str] = Query(None),   # YYYY-MM-DD
    limit:      int            = Query(500, ge=1, le=2000),
    db:         Session        = Depends(get_db),
    user=Depends(require_admin),
):
    ensure_tables()
    return crud.get_audit_log(
        db,
        company_id=company_id, brand_id=brand_id,
        user_email=user_email, action=action,
        date_from=date_from, date_to=date_to,
        limit=limit,
    )


@app.get("/api/adm/audit-log/csv")
def export_audit_log_csv(
    company_id: Optional[str] = Query(None),
    brand_id:   Optional[str] = Query(None),
    user_email: Optional[str] = Query(None),
    action:     Optional[str] = Query(None),
    date_from:  Optional[str] = Query(None),
    date_to:    Optional[str] = Query(None),
    db:         Session        = Depends(get_db),
    user=Depends(require_admin),
):
    """Export audit log as CSV (ISO 27001 evidence)."""
    import csv, io
    from fastapi.responses import StreamingResponse

    ensure_tables()
    rows = crud.get_audit_log(
        db,
        company_id=company_id, brand_id=brand_id,
        user_email=user_email, action=action,
        date_from=date_from, date_to=date_to,
        limit=10000,
    )

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["timestamp", "user_email", "action", "entity", "company_id", "brand_id", "ip_address"])
    for r in rows:
        writer.writerow([
            r.timestamp.isoformat() if r.timestamp else "",
            r.user_email, r.action, r.entity or "",
            r.company_id or "", r.brand_id or "", r.ip_address or "",
        ])

    buf.seek(0)
    filename = f"audit_log_{date_from or 'all'}_{date_to or 'all'}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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


# ── UI BRAND SETTINGS ────────────────────────────────────────────────────────
@app.get("/api/adm/ui/brand-settings", response_model=schemas.UIBrandSettingsRead)
def get_ui_brand_settings(
    company_id: str     = Query(...),
    brand_id:   str     = Query(""),
    db:         Session = Depends(get_db),
    user=Depends(get_current_user),
):
    ensure_tables()
    obj = crud.get_ui_brand_settings(db, company_id, brand_id)
    if not obj:
        return schemas.UIBrandSettingsRead(company_id=company_id, brand_id=brand_id)
    return obj


@app.put("/api/adm/ui/brand-settings", response_model=schemas.UIBrandSettingsRead)
def upsert_ui_brand_settings(
    payload: schemas.UIBrandSettingsUpsert,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_it),
):
    ensure_tables()
    obj = crud.upsert_ui_brand_settings(db, payload)
    crud.write_audit(db, user.email, "UI_SETTINGS",
                     f"{payload.company_id}·{payload.brand_id}",
                     company_id=payload.company_id, brand_id=payload.brand_id,
                     ip_address=_client_ip(request))
    return obj


@app.delete("/api/adm/ui/brand-settings", status_code=204)
def delete_ui_brand_settings(
    company_id: str     = Query(...),
    brand_id:   str     = Query(""),
    request:    Request = None,
    db:         Session = Depends(get_db),
    user=Depends(require_it),
):
    ensure_tables()
    crud.delete_ui_brand_settings(db, company_id, brand_id)
    crud.write_audit(db, user.email, "UI_SETTINGS_DELETE",
                     f"{company_id}·{brand_id}",
                     company_id=company_id, brand_id=brand_id,
                     ip_address=_client_ip(request))


# ── CORPORATE STRUCTURE ──────────────────────────────────────────────────────
@app.get("/api/adm/structure", response_model=List[schemas.CorporateEntityRead])
def list_structure(
    db:   Session = Depends(get_db),
    user=Depends(get_current_user),
):
    ensure_tables()
    return crud.get_corporate_entities(db)


@app.post("/api/adm/structure", response_model=schemas.CorporateEntityRead, status_code=201)
def create_entity(
    payload: schemas.CorporateEntityCreate,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_it),
):
    ensure_tables()
    obj = crud.create_corporate_entity(db, payload)
    crud.write_audit(db, user.email, "STRUCTURE_CREATE", f"{payload.tipo}:{payload.code}",
                     ip_address=_client_ip(request))
    return obj


@app.put("/api/adm/structure/{eid}", response_model=schemas.CorporateEntityRead)
def update_entity(
    eid:     int,
    payload: schemas.CorporateEntityCreate,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_it),
):
    ensure_tables()
    obj = crud.update_corporate_entity(db, eid, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="Entidad no encontrada")
    crud.write_audit(db, user.email, "STRUCTURE_EDIT", f"{payload.tipo}:{payload.code}",
                     ip_address=_client_ip(request))
    return obj


@app.delete("/api/adm/structure/{eid}", status_code=204)
def delete_entity(
    eid:     int,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_it),
):
    ensure_tables()
    obj = crud.get_corporate_entity(db, eid)
    if not crud.delete_corporate_entity(db, eid):
        raise HTTPException(status_code=404, detail="Entidad no encontrada")
    crud.write_audit(db, user.email, "STRUCTURE_DELETE", f"entity:{eid}",
                     ip_address=_client_ip(request))


# ── DEPARTMENTS (Departamentos – global catalog) ──────────────────────────────
@app.get("/api/adm/departments", response_model=List[schemas.DepartmentRead])
def list_departments(
    db:   Session = Depends(get_db),
    user=Depends(get_current_user),
):
    ensure_tables()
    return crud.get_departments(db)


@app.post("/api/adm/departments", response_model=schemas.DepartmentRead, status_code=201)
def create_department(
    payload: schemas.DepartmentCreate,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_it),
):
    ensure_tables()
    obj = crud.create_department(db, payload)
    crud.write_audit(db, user.email, "CREATE", f"department:{obj.nombre}",
                     ip_address=_client_ip(request))
    return obj


@app.put("/api/adm/departments/{did}", response_model=schemas.DepartmentRead)
def update_department(
    did:     int,
    payload: schemas.DepartmentCreate,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_it),
):
    ensure_tables()
    obj = crud.update_department(db, did, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    crud.write_audit(db, user.email, "EDIT", f"department:{obj.nombre}",
                     ip_address=_client_ip(request))
    return obj


@app.delete("/api/adm/departments/{did}", status_code=204)
def delete_department(
    did:     int,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_it),
):
    ensure_tables()
    obj = crud.get_department(db, did)
    if not crud.delete_department(db, did):
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    crud.write_audit(db, user.email, "DELETE", f"department:{obj.nombre if obj else did}",
                     ip_address=_client_ip(request))


# ── POSITIONS (Puestos – global catalog) ─────────────────────────────────────
@app.get("/api/adm/positions", response_model=List[schemas.PositionRead])
def list_positions(
    db:   Session = Depends(get_db),
    user=Depends(get_current_user),
):
    ensure_tables()
    return crud.get_positions(db)


@app.post("/api/adm/positions", response_model=schemas.PositionRead, status_code=201)
def create_position(
    payload: schemas.PositionCreate,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_it),
):
    ensure_tables()
    obj = crud.create_position(db, payload)
    crud.write_audit(db, user.email, "CREATE", f"position:{obj.nombre}",
                     ip_address=_client_ip(request))
    return obj


@app.put("/api/adm/positions/{pid}", response_model=schemas.PositionRead)
def update_position(
    pid:     int,
    payload: schemas.PositionCreate,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_it),
):
    ensure_tables()
    obj = crud.update_position(db, pid, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="Puesto no encontrado")
    crud.write_audit(db, user.email, "EDIT", f"position:{obj.nombre}",
                     ip_address=_client_ip(request))
    return obj


@app.delete("/api/adm/positions/{pid}", status_code=204)
def delete_position(
    pid:     int,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_it),
):
    ensure_tables()
    obj = crud.get_position(db, pid)
    if not crud.delete_position(db, pid):
        raise HTTPException(status_code=404, detail="Puesto no encontrado")
    crud.write_audit(db, user.email, "DELETE", f"position:{obj.nombre if obj else pid}",
                     ip_address=_client_ip(request))


# ── COLLABORATORS (Ficha Colaborador) ─────────────────────────────────────────
@app.get("/api/tal/collaborators", response_model=List[schemas.CollaboratorRead])
def list_collaborators(
    activo: Optional[int] = Query(None),
    db:     Session        = Depends(get_db),
    user=Depends(get_current_user),
):
    ensure_tables()
    return crud.get_collaborators(db, activo=activo)


@app.get("/api/tal/collaborators/{cid}", response_model=schemas.CollaboratorRead)
def get_collaborator(
    cid: int,
    db:  Session = Depends(get_db),
    user=Depends(get_current_user),
):
    ensure_tables()
    obj = crud.get_collaborator(db, cid)
    if not obj:
        raise HTTPException(status_code=404, detail="Colaborador no encontrado")
    return obj


@app.post("/api/tal/collaborators", response_model=schemas.CollaboratorRead, status_code=201)
def create_collaborator(
    payload: schemas.CollaboratorCreate,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_manager),
):
    ensure_tables()
    obj = crud.create_collaborator(db, payload)
    crud.write_audit(db, user.email, "CREATE",
                     f"collaborator:{obj.nombre} {obj.apellidos}",
                     company_id=user.company_id, brand_id=user.brand_id,
                     ip_address=_client_ip(request))
    return obj


@app.put("/api/tal/collaborators/{cid}", response_model=schemas.CollaboratorRead)
def update_collaborator(
    cid:     int,
    payload: schemas.CollaboratorCreate,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_manager),
):
    ensure_tables()
    obj = crud.update_collaborator(db, cid, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="Colaborador no encontrado")
    crud.write_audit(db, user.email, "EDIT",
                     f"collaborator:{obj.nombre} {obj.apellidos}",
                     company_id=user.company_id, brand_id=user.brand_id,
                     ip_address=_client_ip(request))
    return obj


@app.delete("/api/tal/collaborators/{cid}", status_code=204)
def delete_collaborator(
    cid:     int,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_manager),
):
    ensure_tables()
    obj = crud.get_collaborator(db, cid)
    if not crud.delete_collaborator(db, cid):
        raise HTTPException(status_code=404, detail="Colaborador no encontrado")
    crud.write_audit(db, user.email, "DELETE",
                     f"collaborator:{obj.nombre + ' ' + obj.apellidos if obj else cid}",
                     company_id=user.company_id, brand_id=user.brand_id,
                     ip_address=_client_ip(request))


# ── REGIONAL SETTINGS ─────────────────────────────────────────────────────────
@app.get("/api/adm/regional-settings", response_model=schemas.RegionalSettingsRead)
def get_regional_settings(
    db:   Session = Depends(get_db),
    user=Depends(get_current_user),
):
    ensure_tables()
    return crud.get_regional_settings(db)


@app.put("/api/adm/regional-settings", response_model=schemas.RegionalSettingsRead)
def update_regional_settings(
    payload: schemas.RegionalSettingsUpdate,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(require_admin),
):
    ensure_tables()
    obj = crud.update_regional_settings(db, payload)
    crud.write_audit(
        db, user.email, "EDIT", f"regional_settings:timezone={payload.timezone}",
        company_id=user.company_id, brand_id=user.brand_id,
        ip_address=_client_ip(request),
    )
    return obj


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
