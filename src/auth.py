"""FastAPI dependency that validates the session cookie."""
import os
from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from saml_handler import verify_session_token
from database import get_db
import schemas

DEV_MODE = os.environ.get("DEV_MODE", "false").lower() == "true"

DEV_USERS = {
    "admin": schemas.UserInfo(
        user_id="dev-admin",
        email="dev-admin@gmiberia.com",
        name="Dev User · Admin",
        roles=["admin"],
        role="admin",
    ),
    "auditor": schemas.UserInfo(
        user_id="dev-auditor",
        email="dev-auditor@gmiberia.com",
        name="Dev User · Auditor",
        roles=["auditor"],
        role="auditor",
    ),
    "user": schemas.UserInfo(
        user_id="dev-user",
        email="dev-user@gmiberia.com",
        name="Dev User · User",
        roles=["user"],
        role="user",
    ),
}


def get_current_user(request: Request, db: Session = Depends(get_db)) -> schemas.UserInfo:
    if DEV_MODE:
        role = request.cookies.get("gmi_dev_role", "admin")
        return DEV_USERS.get(role, DEV_USERS["admin"])
    token = request.cookies.get("gmi_session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_session_token(token)

    import crud
    user_access = crud.get_user_access_by_email(db, payload["email"])
    if not user_access:
        raise HTTPException(
            status_code=403,
            detail="No tienes acceso a esta aplicación, contacta con el administrador",
        )
    return schemas.UserInfo(
        user_id=payload["user_id"],
        email=payload["email"],
        name=payload.get("name", ""),
        roles=payload.get("roles", []),
        role=user_access.role,
    )


def require_admin(user: schemas.UserInfo = Depends(get_current_user)) -> schemas.UserInfo:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: se requiere rol Admin")
    return user
