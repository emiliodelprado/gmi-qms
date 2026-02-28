"""SQLAlchemy ORM models for GMI Quality Management System."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class UserAccess(Base):
    """Global user identity and credentials (SSO whitelist + local auth).
    company_id / brand_id / role are now in UserTenant.
    """
    __tablename__ = "user_access"

    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String(200), unique=True, nullable=False, index=True)
    name          = Column(String(200), nullable=True)
    activo        = Column(Integer, default=1)           # global account flag
    # Local auth
    password_hash = Column(String(200), nullable=True)   # Argon2id; NULL = SSO-only
    last_login    = Column(DateTime, nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

    tenants       = relationship("UserTenant", back_populates="user",
                                 cascade="all, delete-orphan", lazy="selectin")


class UserTenant(Base):
    """Per-(company_id, brand_id) role assignment for a user."""
    __tablename__ = "user_tenants"
    __table_args__ = (
        UniqueConstraint("user_id", "company_id", "brand_id", name="uq_user_tenant"),
    )

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("user_access.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    company_id = Column(String(10), nullable=False)   # GMS | GMP
    brand_id   = Column(String(50), nullable=False)   # EPUNTO | LIQUID | THE LIQUID FINANCE
    role       = Column(String(50), nullable=False)   # IT|Dirección|Calidad|…|Auditor
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


class RolePermission(Base):
    """Per-role, per-screen permission overrides (persisted matrix)."""
    __tablename__ = "role_permissions"

    id         = Column(Integer, primary_key=True, index=True)
    role       = Column(String(50),  nullable=False, index=True)
    screen_id  = Column(String(30),  nullable=False)
    permission = Column(String(5),   nullable=False, default="—")  # — | R | R/W
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
