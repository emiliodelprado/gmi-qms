"""Pydantic schemas – request & response shapes."""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────
class UserInfo(BaseModel):
    user_id:    str
    email:      str
    name:       str
    roles:      List[str]
    role:       Optional[str] = None   # QMS role (resolved for active tenant)
    company_id: Optional[str] = None
    brand_id:   Optional[str] = None


# ── Local auth ────────────────────────────────────────────────────────────────
class LocalLoginRequest(BaseModel):
    email:    EmailStr
    password: str


class LocalLoginResponse(BaseModel):
    ok:    bool
    email: str
    role:  str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token:        str
    new_password: str


class PasswordResetRequestResponse(BaseModel):
    ok:      bool
    message: str
    token:   Optional[str] = None   # only present in DEV_MODE


# ── User Tenants ───────────────────────────────────────────────────────────────
class UserTenantEntry(BaseModel):
    """A single (company, brand, role) assignment — used in create/update."""
    company_id: str
    brand_id:   str
    role:       str
    activo:     int = 1


class UserTenantRead(UserTenantEntry):
    """UserTenant as returned by the API (includes id)."""
    id: int

    class Config:
        from_attributes = True


# ── User Access ───────────────────────────────────────────────────────────────
class UserAccessCreate(BaseModel):
    """Payload to create or fully replace a user (identity + tenant list)."""
    email:    str
    name:     Optional[str] = None
    password: Optional[str] = None   # plain-text; hashed before storage; None = SSO-only
    activo:   int = 1
    tenants:  List[UserTenantEntry] = []


class UserAccessRead(BaseModel):
    """User as returned by the API. Includes all tenant assignments.

    When the endpoint is called with ?company_id=X&brand_id=Y, the top-level
    `role`, `company_id`, `brand_id` fields reflect the role in that tenant context.
    """
    id:         int
    email:      str
    name:       Optional[str] = None
    activo:     int
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None
    tenants:    List[UserTenantRead] = []
    # Active-tenant convenience fields (populated when filtered by company/brand)
    role:       Optional[str] = None
    company_id: Optional[str] = None
    brand_id:   Optional[str] = None

    class Config:
        from_attributes = True


# ── Audit log ─────────────────────────────────────────────────────────────────
class AuditLogEntry(BaseModel):
    id:         int
    user_email: str
    action:     str
    entity:     Optional[str] = None
    company_id: Optional[str] = None
    brand_id:   Optional[str] = None
    ip_address: Optional[str] = None
    timestamp:  Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Role permissions ──────────────────────────────────────────────────────────
class RolePermissionEntry(BaseModel):
    role:       str
    screen_id:  str
    permission: str   # — | R | R/W


class RolePermissionBulkSave(BaseModel):
    permissions: List[RolePermissionEntry]
