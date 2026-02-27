"""Database CRUD operations for GMI QMS."""
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas


# ── User Access ────────────────────────────────────────────────────────────────
def get_user_access_list(db: Session) -> List[models.UserAccess]:
    return (
        db.query(models.UserAccess)
        .filter(models.UserAccess.activo == 1)
        .order_by(models.UserAccess.email)
        .all()
    )


def get_user_access_by_email(db: Session, email: str) -> Optional[models.UserAccess]:
    return (
        db.query(models.UserAccess)
        .filter(models.UserAccess.email == email, models.UserAccess.activo == 1)
        .first()
    )


def create_user_access(db: Session, payload: schemas.UserAccessCreate) -> models.UserAccess:
    obj = models.UserAccess(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_user_access(
    db: Session, user_id: int, payload: schemas.UserAccessCreate
) -> Optional[models.UserAccess]:
    obj = db.query(models.UserAccess).filter(models.UserAccess.id == user_id).first()
    if not obj:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_user_access(db: Session, user_id: int) -> bool:
    obj = db.query(models.UserAccess).filter(models.UserAccess.id == user_id).first()
    if not obj:
        return False
    obj.activo = 0  # soft delete
    db.commit()
    return True
