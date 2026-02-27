"""
GMI Quality Management System – FastAPI Backend
"""
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session
from typing import List
import os

from database import get_db, engine
import models, schemas, crud
from auth import get_current_user, require_admin

app = FastAPI(
    title="GMI Quality Management System API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://qms.gmiberia.com",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok"}


# ── Startup ────────────────────────────────────────────────────────────────────
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


# ── AUTH ──────────────────────────────────────────────────────────────────────
@app.post("/auth/saml/callback")
async def saml_callback(request: Request):
    from saml_handler import process_saml_response
    session_token = await process_saml_response(request)
    response = RedirectResponse(url="/", status_code=302)
    response.set_cookie(
        key="gmi_session",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=28800,
    )
    return response


@app.get("/auth/saml/metadata")
async def saml_metadata():
    from saml_handler import get_sp_metadata
    xml = get_sp_metadata()
    return JSONResponse(content=xml, media_type="application/xml")


@app.post("/auth/logout")
def logout():
    response = JSONResponse({"status": "logged_out"})
    response.delete_cookie("gmi_session")
    return response


@app.get("/auth/me", response_model=schemas.UserInfo)
def me(current_user: schemas.UserInfo = Depends(get_current_user)):
    return current_user


@app.get("/auth/dev-login/{role}")
def dev_login(role: str):
    """DEV_MODE only: switch active dev user role via browser URL."""
    from auth import DEV_MODE
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


# ── ADMIN – User Access ────────────────────────────────────────────────────────
@app.get("/api/admin/users", response_model=List[schemas.UserAccessRead])
def list_users(db: Session = Depends(get_db), user=Depends(require_admin)):
    ensure_tables()
    return crud.get_user_access_list(db)


@app.post("/api/admin/users", response_model=schemas.UserAccessRead, status_code=201)
def create_user(
    payload: schemas.UserAccessCreate,
    db: Session = Depends(get_db),
    user=Depends(require_admin),
):
    ensure_tables()
    return crud.create_user_access(db, payload)


@app.put("/api/admin/users/{uid}", response_model=schemas.UserAccessRead)
def update_user(
    uid: int,
    payload: schemas.UserAccessCreate,
    db: Session = Depends(get_db),
    user=Depends(require_admin),
):
    ensure_tables()
    item = crud.update_user_access(db, uid, payload)
    if not item:
        raise HTTPException(status_code=404, detail="User not found")
    return item


@app.delete("/api/admin/users/{uid}", status_code=204)
def delete_user(
    uid: int,
    db: Session = Depends(get_db),
    user=Depends(require_admin),
):
    ensure_tables()
    if not crud.delete_user_access(db, uid):
        raise HTTPException(status_code=404, detail="User not found")


# ── Servir frontend React (catch-all — siempre al final) ──────────────────────
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
