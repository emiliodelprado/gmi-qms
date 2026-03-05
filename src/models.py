"""SQLAlchemy ORM models for GMI Quality Management System."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class UserAccess(Base):
    """Global user identity and credentials (SSO whitelist + local auth).
    company_id / brand_id / role are now in UserTenant.
    """
    __tablename__ = "user_access"

    id                 = Column(Integer, primary_key=True, index=True)
    email              = Column(String(200), unique=True, nullable=False, index=True)
    name               = Column(String(200), nullable=True)
    activo             = Column(Integer, default=1)           # global account flag
    # Local auth
    password_hash      = Column(String(200), nullable=True)   # Argon2id; NULL = SSO-only
    last_login         = Column(DateTime, nullable=True)
    created_at         = Column(DateTime, default=datetime.utcnow)
    # Default context shown in TopBar on first login
    default_company_id = Column(String(10),  nullable=True)
    default_brand_id   = Column(String(50),  nullable=True)

    tenants       = relationship("UserTenant", back_populates="user",
                                 cascade="all, delete-orphan", lazy="selectin")


class UserTenant(Base):
    """Per-scope role assignment for a user.

    scope='marca'   → company_id=Entidad code, brand_id=Marca code
    scope='entidad' → company_id=Entidad code, brand_id=NULL
    scope='grupo'   → company_id=Grupo code,   brand_id=NULL
    Unique indexes per scope are created in migration 006.
    """
    __tablename__ = "user_tenants"
    __table_args__ = (
        UniqueConstraint("user_id", "company_id", "brand_id", name="uq_user_tenant"),
    )

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("user_access.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    scope      = Column(String(15), nullable=False, server_default="marca")
    company_id = Column(String(10), nullable=True)   # Grupo/Entidad/Entidad code
    brand_id   = Column(String(50), nullable=True)   # Marca code; NULL for grupo/entidad scope
    role       = Column(String(50), nullable=False)  # IT|Dirección|Calidad|…|Auditor
    activo     = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    user       = relationship("UserAccess", back_populates="tenants")


class PasswordResetToken(Base):
    """Single-use tokens for the on-premise password reset flow."""
    __tablename__ = "password_reset_tokens"

    id         = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(200), nullable=False, index=True)
    token_hash = Column(String(64), nullable=False, unique=True)  # SHA-256 of raw token
    expires_at = Column(DateTime, nullable=False)
    used       = Column(Integer, default=0)  # 0=pending, 1=consumed
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    """Immutable audit trail for all state-changing actions."""
    __tablename__ = "audit_log"

    id         = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(200), nullable=False, index=True)
    action     = Column(String(30),  nullable=False)  # LOGIN|LOGOUT|CREATE|EDIT|DELETE|…
    entity     = Column(String(100), nullable=True)
    company_id = Column(String(10),  nullable=True)
    brand_id   = Column(String(50),  nullable=True)
    ip_address = Column(String(45),  nullable=True)
    timestamp  = Column(DateTime, default=datetime.utcnow, index=True)


class UIBrandSettings(Base):
    """Per-(company, brand) UI customization: logo and primary color."""
    __tablename__ = "ui_brand_settings"
    __table_args__ = (
        UniqueConstraint("company_id", "brand_id", name="uq_ui_brand_settings"),
    )

    id            = Column(Integer, primary_key=True, index=True)
    company_id    = Column(String(10), nullable=False)
    brand_id      = Column(String(50), nullable=False, default="")  # "" = company-wide
    logo_data     = Column(Text, nullable=True)        # base64 data URL
    primary_color = Column(String(20), nullable=True)  # e.g. "#A91E22"
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CorporateEntity(Base):
    """Hierarchical corporate structure: Grupo → Entidad Legal → Marca."""
    __tablename__ = "corporate_entities"

    id                  = Column(Integer, primary_key=True, index=True)
    tipo                = Column(String(20),  nullable=False)             # Grupo | Entidad Legal | Marca
    label               = Column(String(200), nullable=False)             # Display name
    code                = Column(String(20),  nullable=False)             # Short code, e.g. GMS
    parent_id           = Column(Integer, ForeignKey("corporate_entities.id", ondelete="SET NULL"), nullable=True)
    activo              = Column(Integer, default=1)
    sort_order          = Column(Integer, default=0)
    created_at          = Column(DateTime, default=datetime.utcnow)
    # Legal-entity specific fields (only relevant when tipo == "Entidad Legal")
    denominacion_social = Column(String(300), nullable=True)
    domicilio_social    = Column(String(500), nullable=True)
    nif                 = Column(String(20),  nullable=True)


class QualityPolicy(Base):
    """Quality policy document, stored per (company, brand) context.

    brand_id="" means entity-level policy (Entidad Legal).
    Brand-level policies override the entity-level one; if a brand has no
    policy (or empty contenido) the entity-level policy is used as fallback.
    """
    __tablename__ = "quality_policies"
    __table_args__ = (
        UniqueConstraint("company_id", "brand_id", name="uq_quality_policy"),
    )

    id          = Column(Integer, primary_key=True, index=True)
    company_id  = Column(String(10),  nullable=False)
    brand_id    = Column(String(50),  nullable=False, server_default="")  # "" = entity-level
    version     = Column(String(20),  nullable=True)
    fecha       = Column(String(10),  nullable=True)   # ISO date string
    proxima     = Column(String(10),  nullable=True)   # ISO date string
    responsable = Column(String(200), nullable=True)
    cargo       = Column(String(200), nullable=True)
    contenido   = Column(Text,        nullable=True)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by  = Column(String(200), nullable=True)


class RolePermission(Base):
    """Per-role, per-screen permission overrides (persisted matrix)."""
    __tablename__ = "role_permissions"

    id         = Column(Integer, primary_key=True, index=True)
    role       = Column(String(50),  nullable=False, index=True)
    screen_id  = Column(String(30),  nullable=False)
    permission = Column(String(5),   nullable=False, default="—")  # — | R | R/W
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Department(Base):
    """Global catalog of departments (Departamentos).

    nivel: 0=más alto (Corporativo), 1, 2, 3, 4=más bajo (Operacional).
    """
    __tablename__ = "departments"

    id          = Column(Integer, primary_key=True, index=True)
    nombre      = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    nivel       = Column(Integer, default=0, nullable=False)
    activo      = Column(Integer, default=1)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Position(Base):
    """Global catalog of job positions (Puestos)."""
    __tablename__ = "positions"

    id          = Column(Integer, primary_key=True, index=True)
    nombre      = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)   # Objetivos y funciones
    requisitos  = Column(Text, nullable=True)
    activo      = Column(Integer, default=1)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    departments = relationship(
        "PositionDepartment", back_populates="position",
        cascade="all, delete-orphan", lazy="selectin",
    )


class PositionDepartment(Base):
    """Many-to-many: position ↔ department."""
    __tablename__ = "position_departments"
    __table_args__ = (
        UniqueConstraint("position_id", "department_id", name="uq_pos_dept"),
    )

    id            = Column(Integer, primary_key=True, index=True)
    position_id   = Column(Integer, ForeignKey("positions.id",   ondelete="CASCADE"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)

    position   = relationship("Position", back_populates="departments")
    department = relationship("Department", lazy="select")


class Collaborator(Base):
    """Employee/collaborator profile."""
    __tablename__ = "collaborators"

    id                 = Column(Integer, primary_key=True, index=True)
    nombre             = Column(String(200), nullable=False)
    apellidos          = Column(String(200), nullable=False)
    identificador_hrms = Column(String(100), nullable=True)
    enlace_hrms        = Column(String(500), nullable=True)
    user_id            = Column(Integer, ForeignKey("user_access.id"), nullable=True)
    activo             = Column(Integer, default=1)
    created_at         = Column(DateTime, default=datetime.utcnow)
    updated_at         = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user      = relationship("UserAccess", lazy="select")
    entities  = relationship(
        "CollaboratorEntity", back_populates="collaborator",
        foreign_keys="[CollaboratorEntity.collaborator_id]",
        cascade="all, delete-orphan", lazy="selectin",
    )


class CollaboratorEntity(Base):
    """Collaborator ↔ entity assignment with per-entity supervisor."""
    __tablename__ = "collaborator_entities"
    __table_args__ = (
        UniqueConstraint("collaborator_id", "entity_id", name="uq_collab_entity"),
    )

    id              = Column(Integer, primary_key=True, index=True)
    collaborator_id = Column(Integer, ForeignKey("collaborators.id", ondelete="CASCADE"), nullable=False)
    entity_id       = Column(Integer, ForeignKey("corporate_entities.id", ondelete="CASCADE"), nullable=False)
    supervisor_id   = Column(Integer, ForeignKey("collaborators.id"), nullable=True)

    collaborator     = relationship("Collaborator", back_populates="entities",
                                    foreign_keys=[collaborator_id])
    entity           = relationship("CorporateEntity", lazy="select")
    supervisor       = relationship("Collaborator", foreign_keys=[supervisor_id],
                                    lazy="select")
    entity_positions = relationship(
        "CollaboratorEntityPosition", back_populates="collaborator_entity",
        cascade="all, delete-orphan", lazy="selectin",
    )


class CollaboratorEntityPosition(Base):
    """Positions assigned per entity assignment."""
    __tablename__ = "collaborator_entity_positions"
    __table_args__ = (
        UniqueConstraint("collaborator_entity_id", "position_id", name="uq_ce_pos"),
    )

    id                     = Column(Integer, primary_key=True, index=True)
    collaborator_entity_id = Column(Integer, ForeignKey("collaborator_entities.id", ondelete="CASCADE"), nullable=False)
    position_id            = Column(Integer, ForeignKey("positions.id", ondelete="CASCADE"), nullable=False)

    collaborator_entity = relationship("CollaboratorEntity", back_populates="entity_positions")
    position            = relationship("Position", lazy="select")


class Solicitud(Base):
    """User-submitted requests, bug reports, and improvement suggestions."""
    __tablename__ = "solicitudes"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("user_access.id"), nullable=False)
    user_email       = Column(String(255), nullable=False)
    user_name        = Column(String(255), nullable=False)
    pantalla         = Column(String(200), nullable=False)
    detalle          = Column(Text, nullable=False)
    estado           = Column(String(20), nullable=False, server_default="enviada")
    comentario_admin = Column(Text, nullable=True)
    company_id       = Column(String(10), nullable=True)
    brand_id         = Column(String(50), nullable=True)
    activo           = Column(Integer, default=1)
    created_at       = Column(DateTime, default=datetime.utcnow)
    updated_at       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserAccess", lazy="select")


class RegionalSettings(Base):
    """App-wide regional settings (single-row table)."""
    __tablename__ = "regional_settings"

    id         = Column(Integer, primary_key=True)
    timezone   = Column(String(100), nullable=False, default="Europe/Madrid")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmailConfig(Base):
    """App-wide email provider configuration (single-row table, id=1)."""
    __tablename__ = "email_config"

    id             = Column(Integer, primary_key=True)
    provider       = Column(String(20), nullable=False, default="mailjet")
    api_key        = Column(String(500), nullable=True)
    api_secret     = Column(String(500), nullable=True)
    sender_name    = Column(String(200), nullable=True)
    sender_email   = Column(String(200), nullable=True)
    reply_to       = Column(String(200), nullable=True)
    signature_html = Column(Text, nullable=True)
    updated_at     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmailTemplate(Base):
    """Reusable email templates with HTML body."""
    __tablename__ = "email_templates"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(200), nullable=False)
    subject    = Column(String(500), nullable=False)
    body_html  = Column(Text, nullable=True)
    activo     = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
