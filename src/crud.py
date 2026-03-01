"""Database CRUD operations for GMI QMS."""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime, timedelta
import hashlib, secrets
import models, schemas


# ── Helpers ────────────────────────────────────────────────────────────────────
def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def _argon2_hasher():
    from argon2 import PasswordHasher
    return PasswordHasher(time_cost=2, memory_cost=65536, parallelism=2)


def _user_to_read(
    user: models.UserAccess,
    company_id: Optional[str] = None,
    brand_id:   Optional[str] = None,
) -> schemas.UserAccessRead:
    """Convert a UserAccess ORM object to UserAccessRead schema.

    If company_id/brand_id are provided, the top-level role/company_id/brand_id
    fields are populated from the matching tenant.
    """
    active_tenant = None
    if company_id or brand_id:
        for t in user.tenants:
            if (not company_id or t.company_id == company_id) and \
               (not brand_id   or t.brand_id   == brand_id):
                active_tenant = t
                break

    return schemas.UserAccessRead(
        id                 = user.id,
        email              = user.email,
        name               = user.name,
        activo             = user.activo,
        last_login         = user.last_login,
        created_at         = user.created_at,
        default_company_id = user.default_company_id,
        default_brand_id   = user.default_brand_id,
        tenants    = [
            schemas.UserTenantRead(
                id         = t.id,
                scope      = t.scope,
                company_id = t.company_id,
                brand_id   = t.brand_id,
                role       = t.role,
                activo     = t.activo,
            )
            for t in user.tenants
        ],
        role       = active_tenant.role       if active_tenant else None,
        company_id = active_tenant.company_id if active_tenant else None,
        brand_id   = active_tenant.brand_id   if active_tenant else None,
    )


# ── User Access ────────────────────────────────────────────────────────────────
def get_user_access_list(
    db:         Session,
    company_id: Optional[str] = None,
    brand_id:   Optional[str] = None,
) -> List[schemas.UserAccessRead]:
    """Return active users, optionally filtered to those with a matching tenant."""
    q = db.query(models.UserAccess).filter(models.UserAccess.activo == 1)

    if company_id or brand_id:
        q = q.join(models.UserTenant,
                   models.UserTenant.user_id == models.UserAccess.id)
        q = q.filter(models.UserTenant.activo == 1)
        if company_id:
            q = q.filter(models.UserTenant.company_id == company_id)
        if brand_id:
            q = q.filter(models.UserTenant.brand_id == brand_id)

    users = q.order_by(models.UserAccess.email).distinct().all()
    return [_user_to_read(u, company_id, brand_id) for u in users]


def get_user_access_by_email(db: Session, email: str) -> Optional[models.UserAccess]:
    return (
        db.query(models.UserAccess)
        .filter(models.UserAccess.email == email, models.UserAccess.activo == 1)
        .first()
    )


def get_user_access_by_id(db: Session, user_id: int) -> Optional[models.UserAccess]:
    return db.query(models.UserAccess).filter(models.UserAccess.id == user_id).first()


def create_user_access(db: Session, payload: schemas.UserAccessCreate) -> schemas.UserAccessRead:
    """Create a user identity record and all its tenant assignments."""
    obj = models.UserAccess(
        email              = payload.email,
        name               = payload.name,
        activo             = payload.activo,
        default_company_id = payload.default_company_id,
        default_brand_id   = payload.default_brand_id,
    )
    if payload.password:
        obj.password_hash = _argon2_hasher().hash(payload.password)

    db.add(obj)
    db.flush()   # get obj.id before adding tenants

    for t in payload.tenants:
        db.add(models.UserTenant(
            user_id    = obj.id,
            scope      = t.scope,
            company_id = t.company_id,
            brand_id   = t.brand_id,
            role       = t.role,
            activo     = t.activo,
        ))

    db.commit()
    db.refresh(obj)
    return _user_to_read(obj)


def update_user_access(
    db: Session, user_id: int, payload: schemas.UserAccessCreate
) -> Optional[schemas.UserAccessRead]:
    """Update user identity and replace all tenant assignments."""
    obj = db.query(models.UserAccess).filter(models.UserAccess.id == user_id).first()
    if not obj:
        return None

    obj.email              = payload.email
    obj.name               = payload.name
    obj.activo             = payload.activo
    obj.default_company_id = payload.default_company_id
    obj.default_brand_id   = payload.default_brand_id
    if payload.password:
        obj.password_hash = _argon2_hasher().hash(payload.password)

    # Replace tenants: delete all existing, insert new ones
    db.query(models.UserTenant).filter(models.UserTenant.user_id == user_id).delete()
    for t in payload.tenants:
        db.add(models.UserTenant(
            user_id    = user_id,
            scope      = t.scope,
            company_id = t.company_id,
            brand_id   = t.brand_id,
            role       = t.role,
            activo     = t.activo,
        ))

    db.commit()
    db.refresh(obj)
    return _user_to_read(obj)


def delete_user_access(db: Session, user_id: int) -> bool:
    obj = db.query(models.UserAccess).filter(models.UserAccess.id == user_id).first()
    if not obj:
        return False
    obj.activo = 0   # soft delete
    db.commit()
    return True


def update_last_login(db: Session, email: str) -> None:
    obj = db.query(models.UserAccess).filter(models.UserAccess.email == email).first()
    if obj:
        obj.last_login = datetime.utcnow()
        db.commit()


# ── User Tenants ───────────────────────────────────────────────────────────────
def get_user_tenants(db: Session, user_id: int) -> List[models.UserTenant]:
    return (
        db.query(models.UserTenant)
        .filter(models.UserTenant.user_id == user_id)
        .order_by(models.UserTenant.company_id, models.UserTenant.brand_id)
        .all()
    )


def get_user_tenant_by_context(
    db: Session, user_id: int, company_id: str, brand_id: str
) -> Optional[models.UserTenant]:
    """Resolve the effective role for (user_id, company_id, brand_id).

    Priority: marca > entidad > grupo.
    Navigates corporate_entities to validate hierarchy membership.
    """
    # 1. Exact Marca match
    tenant = (
        db.query(models.UserTenant)
        .filter(
            models.UserTenant.user_id    == user_id,
            models.UserTenant.company_id == company_id,
            models.UserTenant.brand_id   == brand_id,
            models.UserTenant.scope      == "marca",
            models.UserTenant.activo     == 1,
        )
        .first()
    )
    if tenant:
        return tenant

    # 2. Entidad level — verify brand belongs to this entity
    tenant = (
        db.query(models.UserTenant)
        .filter(
            models.UserTenant.user_id    == user_id,
            models.UserTenant.company_id == company_id,
            models.UserTenant.scope      == "entidad",
            models.UserTenant.activo     == 1,
        )
        .first()
    )
    if tenant:
        brand_ent = db.query(models.CorporateEntity).filter(
            models.CorporateEntity.code   == brand_id,
            models.CorporateEntity.tipo   == "Marca",
            models.CorporateEntity.activo == 1,
        ).first()
        entity_ent = db.query(models.CorporateEntity).filter(
            models.CorporateEntity.code   == company_id,
            models.CorporateEntity.tipo   == "Entidad Legal",
            models.CorporateEntity.activo == 1,
        ).first()
        if brand_ent and entity_ent and brand_ent.parent_id == entity_ent.id:
            return tenant

    # 3. Grupo level — verify brand → entity → group chain
    grupo_tenants = (
        db.query(models.UserTenant)
        .filter(
            models.UserTenant.user_id == user_id,
            models.UserTenant.scope   == "grupo",
            models.UserTenant.activo  == 1,
        )
        .all()
    )
    for tenant in grupo_tenants:
        brand_ent = db.query(models.CorporateEntity).filter(
            models.CorporateEntity.code   == brand_id,
            models.CorporateEntity.tipo   == "Marca",
            models.CorporateEntity.activo == 1,
        ).first()
        if not brand_ent:
            continue
        entity_ent = db.query(models.CorporateEntity).filter(
            models.CorporateEntity.id     == brand_ent.parent_id,
            models.CorporateEntity.tipo   == "Entidad Legal",
            models.CorporateEntity.activo == 1,
        ).first()
        if not entity_ent:
            continue
        grupo_ent = db.query(models.CorporateEntity).filter(
            models.CorporateEntity.id     == entity_ent.parent_id,
            models.CorporateEntity.code   == tenant.company_id,
            models.CorporateEntity.tipo   == "Grupo",
            models.CorporateEntity.activo == 1,
        ).first()
        if grupo_ent:
            return tenant

    return None


def resolve_first_accessible_brand(
    db: Session, tenant: models.UserTenant
) -> Optional[tuple]:
    """For a grupo/entidad scope tenant, return (company_code, brand_code)
    of the first active Marca under that scope's hierarchy."""
    if tenant.scope == "entidad":
        entity = db.query(models.CorporateEntity).filter(
            models.CorporateEntity.code   == tenant.company_id,
            models.CorporateEntity.tipo   == "Entidad Legal",
            models.CorporateEntity.activo == 1,
        ).first()
        if not entity:
            return None
        brand = db.query(models.CorporateEntity).filter(
            models.CorporateEntity.parent_id == entity.id,
            models.CorporateEntity.tipo      == "Marca",
            models.CorporateEntity.activo    == 1,
        ).order_by(models.CorporateEntity.sort_order).first()
        if brand:
            return (tenant.company_id, brand.code)

    elif tenant.scope == "grupo":
        grupo = db.query(models.CorporateEntity).filter(
            models.CorporateEntity.code   == tenant.company_id,
            models.CorporateEntity.tipo   == "Grupo",
            models.CorporateEntity.activo == 1,
        ).first()
        if not grupo:
            return None
        entity = db.query(models.CorporateEntity).filter(
            models.CorporateEntity.parent_id == grupo.id,
            models.CorporateEntity.tipo      == "Entidad Legal",
            models.CorporateEntity.activo    == 1,
        ).order_by(models.CorporateEntity.sort_order).first()
        if not entity:
            return None
        brand = db.query(models.CorporateEntity).filter(
            models.CorporateEntity.parent_id == entity.id,
            models.CorporateEntity.tipo      == "Marca",
            models.CorporateEntity.activo    == 1,
        ).order_by(models.CorporateEntity.sort_order).first()
        if brand:
            return (entity.code, brand.code)

    return None


def add_user_tenant(
    db: Session, user_id: int, entry: schemas.UserTenantEntry
) -> models.UserTenant:
    obj = models.UserTenant(
        user_id    = user_id,
        scope      = entry.scope,
        company_id = entry.company_id,
        brand_id   = entry.brand_id,
        role       = entry.role,
        activo     = entry.activo,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_user_tenant(
    db: Session, tenant_id: int, entry: schemas.UserTenantEntry
) -> Optional[models.UserTenant]:
    obj = db.query(models.UserTenant).filter(models.UserTenant.id == tenant_id).first()
    if not obj:
        return None
    obj.role   = entry.role
    obj.activo = entry.activo
    db.commit()
    db.refresh(obj)
    return obj


def remove_user_tenant(db: Session, tenant_id: int) -> bool:
    obj = db.query(models.UserTenant).filter(models.UserTenant.id == tenant_id).first()
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


# ── Local auth ─────────────────────────────────────────────────────────────────
def verify_local_password(db: Session, email: str, password: str) -> Optional[models.UserAccess]:
    """Return UserAccess if email+password are valid, else None."""
    user = get_user_access_by_email(db, email)
    if not user or not user.password_hash:
        return None
    try:
        ph = _argon2_hasher()
        ph.verify(user.password_hash, password)
        if ph.check_needs_rehash(user.password_hash):
            user.password_hash = ph.hash(password)
            db.commit()
        return user
    except Exception:
        return None


# ── Password reset ─────────────────────────────────────────────────────────────
def create_password_reset_token(db: Session, email: str) -> str:
    """Generate a reset token, persist its hash, return the raw token."""
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_email == email,
        models.PasswordResetToken.used == 0,
    ).update({"used": 1})

    raw   = secrets.token_urlsafe(32)
    entry = models.PasswordResetToken(
        user_email = email,
        token_hash = _hash_token(raw),
        expires_at = datetime.utcnow() + timedelta(hours=24),
    )
    db.add(entry)
    db.commit()
    return raw


def consume_password_reset_token(
    db: Session, raw_token: str, new_password: str
) -> bool:
    """Verify token, update password, mark token used. Returns True on success."""
    entry = (
        db.query(models.PasswordResetToken)
        .filter(
            models.PasswordResetToken.token_hash == _hash_token(raw_token),
            models.PasswordResetToken.used == 0,
            models.PasswordResetToken.expires_at > datetime.utcnow(),
        )
        .first()
    )
    if not entry:
        return False

    user = get_user_access_by_email(db, entry.user_email)
    if not user:
        return False

    user.password_hash = _argon2_hasher().hash(new_password)
    entry.used = 1
    db.commit()
    return True


# ── Audit log ──────────────────────────────────────────────────────────────────
def write_audit(
    db:         Session,
    user_email: str,
    action:     str,
    entity:     Optional[str] = None,
    company_id: Optional[str] = None,
    brand_id:   Optional[str] = None,
    ip_address: Optional[str] = None,
) -> None:
    db.add(models.AuditLog(
        user_email = user_email,
        action     = action,
        entity     = entity,
        company_id = company_id,
        brand_id   = brand_id,
        ip_address = ip_address,
    ))
    db.commit()


def get_audit_log(
    db:         Session,
    company_id: Optional[str] = None,
    brand_id:   Optional[str] = None,
    limit:      int = 200,
) -> List[models.AuditLog]:
    q = db.query(models.AuditLog)
    if company_id:
        q = q.filter(models.AuditLog.company_id == company_id)
    if brand_id:
        q = q.filter(models.AuditLog.brand_id == brand_id)
    return q.order_by(desc(models.AuditLog.timestamp)).limit(limit).all()


# ── UI Brand Settings ──────────────────────────────────────────────────────────
def get_ui_brand_settings(
    db: Session, company_id: str, brand_id: str
) -> Optional[models.UIBrandSettings]:
    return (
        db.query(models.UIBrandSettings)
        .filter(
            models.UIBrandSettings.company_id == company_id,
            models.UIBrandSettings.brand_id   == brand_id,
        )
        .first()
    )


def upsert_ui_brand_settings(
    db: Session, payload: schemas.UIBrandSettingsUpsert
) -> models.UIBrandSettings:
    obj = get_ui_brand_settings(db, payload.company_id, payload.brand_id)
    if obj:
        obj.logo_data     = payload.logo_data
        obj.primary_color = payload.primary_color
        obj.updated_at    = datetime.utcnow()
    else:
        obj = models.UIBrandSettings(
            company_id    = payload.company_id,
            brand_id      = payload.brand_id,
            logo_data     = payload.logo_data,
            primary_color = payload.primary_color,
            updated_at    = datetime.utcnow(),
        )
        db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def delete_ui_brand_settings(
    db: Session, company_id: str, brand_id: str
) -> bool:
    obj = get_ui_brand_settings(db, company_id, brand_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


# ── Corporate Structure ────────────────────────────────────────────────────────
def get_corporate_entities(db: Session) -> List[models.CorporateEntity]:
    return db.query(models.CorporateEntity).order_by(
        models.CorporateEntity.sort_order, models.CorporateEntity.id
    ).all()


def get_corporate_entity(db: Session, eid: int) -> Optional[models.CorporateEntity]:
    return db.query(models.CorporateEntity).filter(models.CorporateEntity.id == eid).first()


def create_corporate_entity(
    db: Session, payload: schemas.CorporateEntityCreate
) -> models.CorporateEntity:
    obj = models.CorporateEntity(
        tipo                = payload.tipo,
        label               = payload.label,
        code                = payload.code,
        parent_id           = payload.parent_id,
        activo              = payload.activo,
        sort_order          = payload.sort_order,
        denominacion_social = payload.denominacion_social,
        domicilio_social    = payload.domicilio_social,
        nif                 = payload.nif,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_corporate_entity(
    db: Session, eid: int, payload: schemas.CorporateEntityCreate
) -> Optional[models.CorporateEntity]:
    obj = get_corporate_entity(db, eid)
    if not obj:
        return None
    obj.tipo                = payload.tipo
    obj.label               = payload.label
    obj.code                = payload.code
    obj.parent_id           = payload.parent_id
    obj.activo              = payload.activo
    obj.sort_order          = payload.sort_order
    obj.denominacion_social = payload.denominacion_social
    obj.domicilio_social    = payload.domicilio_social
    obj.nif                 = payload.nif
    db.commit()
    db.refresh(obj)
    return obj


def delete_corporate_entity(db: Session, eid: int) -> bool:
    obj = get_corporate_entity(db, eid)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


# ── Role permissions ───────────────────────────────────────────────────────────
def get_role_permissions(db: Session) -> List[models.RolePermission]:
    return db.query(models.RolePermission).order_by(
        models.RolePermission.role, models.RolePermission.screen_id
    ).all()


def get_role_permissions_by_role(db: Session, role: str) -> List[models.RolePermission]:
    return db.query(models.RolePermission).filter(
        models.RolePermission.role == role
    ).all()


def save_role_permissions(
    db: Session, entries: List[schemas.RolePermissionEntry]
) -> List[models.RolePermission]:
    """Upsert the full permissions matrix."""
    for entry in entries:
        existing = (
            db.query(models.RolePermission)
            .filter(
                models.RolePermission.role      == entry.role,
                models.RolePermission.screen_id == entry.screen_id,
            )
            .first()
        )
        if existing:
            existing.permission = entry.permission
            existing.updated_at = datetime.utcnow()
        else:
            db.add(models.RolePermission(
                role       = entry.role,
                screen_id  = entry.screen_id,
                permission = entry.permission,
            ))
    db.commit()
    return get_role_permissions(db)
