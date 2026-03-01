"""Pydantic schemas – request & response shapes."""
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Literal
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────
class UserInfo(BaseModel):
    user_id:            str
    email:              str
    name:               str
    roles:              List[str]
    role:               Optional[str] = None   # QMS role (resolved for active tenant)
    scope:              Optional[str] = None   # "grupo" | "entidad" | "marca"
    company_id:         Optional[str] = None
    brand_id:           Optional[str] = None
    # Stored default context (used to initialise the TopBar selector on login)
    default_company_id: Optional[str] = None
    default_brand_id:   Optional[str] = None


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
    """A single role assignment with hierarchical scope.

    scope='marca'   → company_id (Entidad) + brand_id (Marca) required
    scope='entidad' → company_id (Entidad) required; brand_id must be None
    scope='grupo'   → company_id (Grupo) required; brand_id must be None
    """
    scope:      str           = "marca"   # "grupo" | "entidad" | "marca"
    company_id: Optional[str] = None
    brand_id:   Optional[str] = None
    role:       str
    activo:     int = 1

    @validator("company_id", always=True)
    def _require_company(cls, v, values):
        scope = values.get("scope", "marca")
        if scope in ("entidad", "marca") and not v:
            raise ValueError(f"company_id es obligatorio para scope '{scope}'")
        return v

    @validator("brand_id", always=True)
    def _require_brand(cls, v, values):
        scope = values.get("scope", "marca")
        if scope == "marca" and not v:
            raise ValueError("brand_id es obligatorio para scope 'marca'")
        if scope in ("grupo", "entidad") and v:
            raise ValueError(f"brand_id debe ser None para scope '{scope}'")
        return v


class UserTenantRead(UserTenantEntry):
    """UserTenant as returned by the API (includes id)."""
    id: int

    class Config:
        from_attributes = True


# ── User Access ───────────────────────────────────────────────────────────────
class UserAccessCreate(BaseModel):
    """Payload to create or fully replace a user (identity + tenant list)."""
    email:              str
    name:               Optional[str] = None
    password:           Optional[str] = None   # plain-text; hashed before storage; None = SSO-only
    activo:             int = 1
    tenants:            List[UserTenantEntry] = []
    default_company_id: Optional[str] = None
    default_brand_id:   Optional[str] = None


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


# ── UI Brand Settings ──────────────────────────────────────────────────────────
class UIBrandSettingsUpsert(BaseModel):
    company_id:    str
    brand_id:      str = ""
    logo_data:     Optional[str] = None   # base64 data URL or None to remove
    primary_color: Optional[str] = None   # e.g. "#A91E22"


class CorporateEntityCreate(BaseModel):
    tipo:                str
    label:               str
    code:                str
    parent_id:           Optional[int] = None
    activo:              int = 1
    sort_order:          int = 0
    # Legal-entity specific (only relevant when tipo == "Entidad Legal")
    denominacion_social: Optional[str] = None
    domicilio_social:    Optional[str] = None
    nif:                 Optional[str] = None


class CorporateEntityRead(CorporateEntityCreate):
    id:         int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UIBrandSettingsRead(BaseModel):
    company_id:    str
    brand_id:      str
    logo_data:     Optional[str] = None
    primary_color: Optional[str] = None
    updated_at:    Optional[datetime] = None

    class Config:
        from_attributes = True
