"""Pydantic schemas – request & response shapes."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────
class UserInfo(BaseModel):
    user_id: str
    email:   str
    name:    str
    roles:   List[str]
    role:    Optional[str] = None   # QMS role: admin | auditor | user


# ── User Access ───────────────────────────────────────────────────────────────
class UserAccessBase(BaseModel):
    email: str
    name:  Optional[str] = None
    role:  str                      # admin | auditor | user


class UserAccessCreate(UserAccessBase):
    pass


class UserAccessRead(UserAccessBase):
    id:         int
    activo:     int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
