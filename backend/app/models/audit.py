from datetime import datetime
import uuid
from sqlalchemy import (
    Column, String, Text, DateTime, Enum,
    ForeignKey, Integer,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSON

from app.models.base import Base


class AuditLog(Base):
    """Log de auditoria - todas as ações críticas do sistema"""
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    action: Mapped[str] = mapped_column(String(50))  # LOGIN, LOGOUT, CREATE, UPDATE, DELETE, APPROVE, REJECT, etc
    resource_type: Mapped[str] = mapped_column(String(50))  # TICKET, ASSET, USER, CI, KNOWLEDGE, etc
    resource_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Before/After para rastrear mudanças
    before: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    after: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Contexto
    ip_address: Mapped[str | None] = mapped_column(String(45))  # Suporta IPv6
    user_agent: Mapped[str | None] = mapped_column(String(500))
    
    # Severidade
    severity: Mapped[str] = mapped_column(String(20), default="INFO")  # INFO, WARNING, CRITICAL
    
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
