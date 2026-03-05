"""Database CRUD operations for GMI QMS."""
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_
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
        # Priority: marca > entidad > grupo (most specific wins)
        for t in user.tenants:
            if t.scope == "marca" and t.company_id == company_id and t.brand_id == brand_id:
                active_tenant = t
                break
        if not active_tenant and company_id:
            for t in user.tenants:
                if t.scope == "entidad" and t.company_id == company_id:
                    active_tenant = t
                    break
        if not active_tenant:
            for t in user.tenants:
                if t.scope == "grupo":
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
        # Include users whose effective role covers this context:
        #   scope=grupo   → always applies (whole organisation)
        #   scope=entidad → applies when company matches
        #   scope=marca   → applies when company + brand both match
        conditions = [models.UserTenant.scope == "grupo"]
        if company_id:
            conditions.append(and_(
                models.UserTenant.scope == "entidad",
                models.UserTenant.company_id == company_id,
            ))
        marca_conds = [models.UserTenant.scope == "marca"]
        if company_id:
            marca_conds.append(models.UserTenant.company_id == company_id)
        if brand_id:
            marca_conds.append(models.UserTenant.brand_id == brand_id)
        conditions.append(and_(*marca_conds))
        q = q.filter(or_(*conditions))

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
    user_email: Optional[str] = None,
    action:     Optional[str] = None,
    date_from:  Optional[str] = None,   # ISO date string YYYY-MM-DD
    date_to:    Optional[str] = None,   # ISO date string YYYY-MM-DD
    limit:      int = 200,
) -> List[models.AuditLog]:
    q = db.query(models.AuditLog)
    if company_id:
        q = q.filter(models.AuditLog.company_id == company_id)
    if brand_id:
        q = q.filter(models.AuditLog.brand_id == brand_id)
    if user_email:
        q = q.filter(models.AuditLog.user_email.ilike(f"%{user_email}%"))
    if action:
        q = q.filter(models.AuditLog.action == action)
    if date_from:
        q = q.filter(models.AuditLog.timestamp >= datetime.fromisoformat(date_from))
    if date_to:
        q = q.filter(models.AuditLog.timestamp < datetime.fromisoformat(date_to) + timedelta(days=1))
    return q.order_by(desc(models.AuditLog.timestamp)).limit(limit).all()


# ── UI Brand Settings ──────────────────────────────────────────────────────────
def get_ui_brand_settings(
    db: Session, company_id: str, brand_id: str
) -> Optional[models.UIBrandSettings]:
    obj = (
        db.query(models.UIBrandSettings)
        .filter(
            models.UIBrandSettings.company_id == company_id,
            models.UIBrandSettings.brand_id   == brand_id,
        )
        .first()
    )
    # Fall back to the global company entry (brand_id="") when no specific brand config exists
    if not obj and brand_id:
        obj = (
            db.query(models.UIBrandSettings)
            .filter(
                models.UIBrandSettings.company_id == company_id,
                models.UIBrandSettings.brand_id   == "",
            )
            .first()
        )
    return obj


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


# ── Quality policy ──────────────────────────────────────────────────────────────
def get_quality_policy(
    db: Session, company_id: str, brand_id: str
) -> schemas.QualityPolicyRead:
    """Return the policy for the given context.

    Fallback chain (brand_id provided):
      1. Brand-level record with non-empty contenido → is_inherited=False
      2. Entity-level record (brand_id="")           → is_inherited=True

    Also attaches legal-entity footer data and brand logo for the PDF.
    """
    is_inherited = False
    pol: Optional[models.QualityPolicy] = None

    if brand_id:
        pol = (
            db.query(models.QualityPolicy)
            .filter_by(company_id=company_id, brand_id=brand_id)
            .first()
        )
        if not pol or not pol.contenido:
            is_inherited = True
            pol = (
                db.query(models.QualityPolicy)
                .filter_by(company_id=company_id, brand_id="")
                .first()
            )
    else:
        pol = (
            db.query(models.QualityPolicy)
            .filter_by(company_id=company_id, brand_id="")
            .first()
        )

    # Legal entity for PDF footer
    entity = (
        db.query(models.CorporateEntity)
        .filter_by(tipo="Entidad Legal", code=company_id)
        .first()
    )

    # Brand logo: try brand-specific first, then entity-wide
    logo = (
        db.query(models.UIBrandSettings)
        .filter_by(company_id=company_id, brand_id=brand_id)
        .first()
    )
    if not logo:
        logo = (
            db.query(models.UIBrandSettings)
            .filter_by(company_id=company_id, brand_id="")
            .first()
        )

    return schemas.QualityPolicyRead(
        company_id           = company_id,
        brand_id             = brand_id,
        version              = pol.version     if pol else None,
        fecha                = pol.fecha       if pol else None,
        proxima              = pol.proxima     if pol else None,
        responsable          = pol.responsable if pol else None,
        cargo                = pol.cargo       if pol else None,
        contenido            = pol.contenido   if pol else None,
        updated_at           = pol.updated_at  if pol else None,
        updated_by           = pol.updated_by  if pol else None,
        is_inherited         = is_inherited,
        denominacion_social  = entity.denominacion_social if entity else None,
        domicilio_social     = entity.domicilio_social    if entity else None,
        nif                  = entity.nif                 if entity else None,
        brand_logo           = logo.logo_data             if logo   else None,
    )


# ── Departments ────────────────────────────────────────────────────────────────
def get_departments(db: Session) -> List[models.Department]:
    return db.query(models.Department).order_by(models.Department.nivel, models.Department.nombre).all()


def get_department(db: Session, did: int) -> Optional[models.Department]:
    return db.query(models.Department).filter(models.Department.id == did).first()


def create_department(db: Session, payload: schemas.DepartmentCreate) -> models.Department:
    obj = models.Department(
        nombre      = payload.nombre,
        descripcion = payload.descripcion,
        nivel       = payload.nivel,
        activo      = payload.activo,
        created_at  = datetime.utcnow(),
        updated_at  = datetime.utcnow(),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_department(
    db: Session, did: int, payload: schemas.DepartmentCreate
) -> Optional[models.Department]:
    obj = get_department(db, did)
    if not obj:
        return None
    obj.nombre      = payload.nombre
    obj.descripcion = payload.descripcion
    obj.nivel       = payload.nivel
    obj.activo      = payload.activo
    obj.updated_at  = datetime.utcnow()
    db.commit()
    db.refresh(obj)
    return obj


def delete_department(db: Session, did: int) -> bool:
    obj = get_department(db, did)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


# ── Positions ──────────────────────────────────────────────────────────────────
def _position_to_read(pos: models.Position) -> schemas.PositionRead:
    dept_ids     = []
    departamentos = []
    for pd in pos.departments:
        if pd.department:
            dept_ids.append(pd.department_id)
            departamentos.append({"id": pd.department.id, "nombre": pd.department.nombre})
    return schemas.PositionRead(
        id               = pos.id,
        nombre           = pos.nombre,
        departamento_ids = dept_ids,
        departamentos    = departamentos,
        descripcion      = pos.descripcion,
        requisitos       = pos.requisitos,
        activo           = pos.activo,
        created_at       = pos.created_at,
        updated_at       = pos.updated_at,
    )


def get_positions(db: Session) -> List[schemas.PositionRead]:
    items = db.query(models.Position).order_by(models.Position.nombre).all()
    return [_position_to_read(p) for p in items]


def get_position(db: Session, pid: int) -> Optional[models.Position]:
    return db.query(models.Position).filter(models.Position.id == pid).first()


def create_position(db: Session, payload: schemas.PositionCreate) -> schemas.PositionRead:
    obj = models.Position(
        nombre      = payload.nombre,
        descripcion = payload.descripcion,
        requisitos  = payload.requisitos,
        activo      = payload.activo,
        created_at  = datetime.utcnow(),
        updated_at  = datetime.utcnow(),
    )
    db.add(obj)
    db.flush()
    for dept_id in payload.departamento_ids:
        db.add(models.PositionDepartment(position_id=obj.id, department_id=dept_id))
    db.commit()
    db.refresh(obj)
    return _position_to_read(obj)


def update_position(
    db: Session, pid: int, payload: schemas.PositionCreate
) -> Optional[schemas.PositionRead]:
    obj = get_position(db, pid)
    if not obj:
        return None
    obj.nombre      = payload.nombre
    obj.descripcion = payload.descripcion
    obj.requisitos  = payload.requisitos
    obj.activo      = payload.activo
    obj.updated_at  = datetime.utcnow()
    db.query(models.PositionDepartment).filter(
        models.PositionDepartment.position_id == pid
    ).delete()
    for dept_id in payload.departamento_ids:
        db.add(models.PositionDepartment(position_id=pid, department_id=dept_id))
    db.commit()
    db.refresh(obj)
    return _position_to_read(obj)


def delete_position(db: Session, pid: int) -> bool:
    obj = get_position(db, pid)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


# ── Collaborators ──────────────────────────────────────────────────────────────
def _collab_to_read(c: models.Collaborator) -> schemas.CollaboratorRead:
    entity_ids: List[int] = []
    entity_assignments: List[schemas.EntityAssignmentRead] = []

    for ce in c.entities:
        if not ce.entity:
            continue
        entity_ids.append(ce.entity_id)

        # Per-entity positions
        pos_ids = []
        puestos = []
        for cep in ce.entity_positions:
            if cep.position:
                pos_ids.append(cep.position_id)
                puestos.append({"id": cep.position.id, "nombre": cep.position.nombre})

        sup_nombre = None
        if ce.supervisor:
            sup_nombre = f"{ce.supervisor.nombre} {ce.supervisor.apellidos}"

        entity_assignments.append(schemas.EntityAssignmentRead(
            entity_id         = ce.entity_id,
            entity_tipo       = ce.entity.tipo,
            entity_label      = ce.entity.label,
            entity_code       = ce.entity.code,
            entity_parent_id  = ce.entity.parent_id,
            supervisor_id     = ce.supervisor_id,
            supervisor_nombre = sup_nombre,
            position_ids      = pos_ids,
            puestos           = puestos,
        ))

    user_tenants = []
    user_email   = None
    user_name    = None
    if c.user:
        user_email = c.user.email
        user_name  = c.user.name
        for t in c.user.tenants:
            if t.activo == 1:
                user_tenants.append({
                    "id":         t.id,
                    "scope":      t.scope,
                    "company_id": t.company_id,
                    "brand_id":   t.brand_id,
                    "role":       t.role,
                })

    return schemas.CollaboratorRead(
        id                 = c.id,
        nombre             = c.nombre,
        apellidos          = c.apellidos,
        identificador_hrms = c.identificador_hrms,
        enlace_hrms        = c.enlace_hrms,
        user_id            = c.user_id,
        user_email         = user_email,
        user_name          = user_name,
        user_tenants       = user_tenants,
        activo             = c.activo,
        entity_ids         = entity_ids,
        entity_assignments = entity_assignments,
        created_at         = c.created_at,
        updated_at         = c.updated_at,
    )


def _save_entity_assignments(db: Session, collaborator_id: int,
                              assignments: List[schemas.EntityAssignment]):
    """Create CollaboratorEntity + CollaboratorEntityPosition rows."""
    for ea in assignments:
        ce = models.CollaboratorEntity(
            collaborator_id = collaborator_id,
            entity_id       = ea.entity_id,
            supervisor_id   = ea.supervisor_id,
        )
        db.add(ce)
        db.flush()
        for pid in ea.position_ids:
            db.add(models.CollaboratorEntityPosition(
                collaborator_entity_id=ce.id, position_id=pid,
            ))


def get_collaborators(
    db: Session, activo: Optional[int] = None
) -> List[schemas.CollaboratorRead]:
    q = db.query(models.Collaborator)
    if activo is not None:
        q = q.filter(models.Collaborator.activo == activo)
    items = q.order_by(models.Collaborator.apellidos, models.Collaborator.nombre).all()
    return [_collab_to_read(c) for c in items]


def get_collaborator(db: Session, cid: int) -> Optional[schemas.CollaboratorRead]:
    c = db.query(models.Collaborator).filter(models.Collaborator.id == cid).first()
    return _collab_to_read(c) if c else None


def create_collaborator(
    db: Session, payload: schemas.CollaboratorCreate
) -> schemas.CollaboratorRead:
    obj = models.Collaborator(
        nombre             = payload.nombre,
        apellidos          = payload.apellidos,
        identificador_hrms = payload.identificador_hrms,
        enlace_hrms        = payload.enlace_hrms,
        user_id            = payload.user_id,
        activo             = payload.activo,
        created_at         = datetime.utcnow(),
        updated_at         = datetime.utcnow(),
    )
    db.add(obj)
    db.flush()
    _save_entity_assignments(db, obj.id, payload.entity_assignments)
    db.commit()
    db.refresh(obj)
    return _collab_to_read(obj)


def update_collaborator(
    db: Session, cid: int, payload: schemas.CollaboratorCreate
) -> Optional[schemas.CollaboratorRead]:
    obj = db.query(models.Collaborator).filter(models.Collaborator.id == cid).first()
    if not obj:
        return None
    obj.nombre             = payload.nombre
    obj.apellidos          = payload.apellidos
    obj.identificador_hrms = payload.identificador_hrms
    obj.enlace_hrms        = payload.enlace_hrms
    obj.user_id            = payload.user_id
    obj.activo             = payload.activo
    obj.updated_at         = datetime.utcnow()
    # Replace entity assignments (cascade deletes entity_positions)
    db.query(models.CollaboratorEntity).filter(
        models.CollaboratorEntity.collaborator_id == cid
    ).delete()
    db.flush()
    _save_entity_assignments(db, cid, payload.entity_assignments)
    db.commit()
    db.refresh(obj)
    return _collab_to_read(obj)


def delete_collaborator(db: Session, cid: int) -> bool:
    obj = db.query(models.Collaborator).filter(models.Collaborator.id == cid).first()
    if not obj:
        return False
    obj.activo = 0
    db.commit()
    return True


def upsert_quality_policy(
    db: Session, payload: schemas.QualityPolicyUpsert, user_email: str
) -> models.QualityPolicy:
    """Create or update the quality policy for the given (company, brand) context."""
    brand = payload.brand_id or ""
    pol = (
        db.query(models.QualityPolicy)
        .filter_by(company_id=payload.company_id, brand_id=brand)
        .first()
    )
    if pol:
        pol.version     = payload.version
        pol.fecha       = payload.fecha
        pol.proxima     = payload.proxima
        pol.responsable = payload.responsable
        pol.cargo       = payload.cargo
        pol.contenido   = payload.contenido
        pol.updated_by  = user_email
        pol.updated_at  = datetime.utcnow()
    else:
        pol = models.QualityPolicy(
            company_id  = payload.company_id,
            brand_id    = brand,
            version     = payload.version,
            fecha       = payload.fecha,
            proxima     = payload.proxima,
            responsable = payload.responsable,
            cargo       = payload.cargo,
            contenido   = payload.contenido,
            updated_by  = user_email,
        )
        db.add(pol)
    db.commit()
    db.refresh(pol)
    return pol


# ── Regional Settings ─────────────────────────────────────────────────────────
def get_regional_settings(db: Session) -> models.RegionalSettings:
    """Return the single regional_settings row (always id=1)."""
    row = db.query(models.RegionalSettings).filter(models.RegionalSettings.id == 1).first()
    if not row:
        row = models.RegionalSettings(id=1, timezone="Europe/Madrid")
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def update_regional_settings(
    db: Session, payload: schemas.RegionalSettingsUpdate
) -> models.RegionalSettings:
    """Update regional settings (single-row)."""
    row = get_regional_settings(db)
    row.timezone   = payload.timezone
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


# ── Solicitudes ──────────────────────────────────────────────────────────────
def get_solicitudes(
    db: Session,
    company_id: Optional[str] = None,
    brand_id: Optional[str] = None,
    user_id: Optional[int] = None,
) -> List[models.Solicitud]:
    q = db.query(models.Solicitud).filter(models.Solicitud.activo == 1)
    if company_id:
        q = q.filter(models.Solicitud.company_id == company_id)
    if brand_id:
        q = q.filter(models.Solicitud.brand_id == brand_id)
    if user_id:
        q = q.filter(models.Solicitud.user_id == user_id)
    return q.order_by(desc(models.Solicitud.created_at)).all()


def get_solicitud(db: Session, sid: int) -> Optional[models.Solicitud]:
    return (
        db.query(models.Solicitud)
        .filter(models.Solicitud.id == sid, models.Solicitud.activo == 1)
        .first()
    )


def create_solicitud(
    db: Session, payload: schemas.SolicitudCreate,
    user_id: int, user_email: str, user_name: str,
    company_id: Optional[str] = None, brand_id: Optional[str] = None,
) -> models.Solicitud:
    obj = models.Solicitud(
        user_id    = user_id,
        user_email = user_email,
        user_name  = user_name,
        pantalla   = payload.pantalla,
        detalle    = payload.detalle,
        company_id = company_id,
        brand_id   = brand_id,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_solicitud(
    db: Session, sid: int, payload: schemas.SolicitudUpdate,
) -> Optional[models.Solicitud]:
    obj = get_solicitud(db, sid)
    if not obj:
        return None
    if payload.estado is not None:
        obj.estado = payload.estado
    if payload.comentario_admin is not None:
        obj.comentario_admin = payload.comentario_admin
    obj.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(obj)
    return obj


def delete_solicitud(db: Session, sid: int) -> bool:
    obj = get_solicitud(db, sid)
    if not obj:
        return False
    obj.activo = 0
    db.commit()
    return True
