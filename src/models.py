"""SQLAlchemy ORM models for GMI Quality Management System."""
from sqlalchemy import Column, Integer, String, DateTime
from database import Base
from datetime import datetime


class UserAccess(Base):
    """Whitelist of users authorized to access the application."""
    __tablename__ = "user_access"

    id         = Column(Integer, primary_key=True, index=True)
    email      = Column(String(200), unique=True, nullable=False, index=True)
    name       = Column(String(200), nullable=True)
    role       = Column(String(50), nullable=False)   # admin | auditor | user
    activo     = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
