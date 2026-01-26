from datetime import datetime
import uuid
from sqlalchemy import (
    Column, String, DateTime, ForeignKey, Boolean,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class ApprovalRequest(Base):
    """Requisição de aprovação para serviços que requerem autorização"""
    __tablename__ = "approval_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"))
    
    level: Mapped[int]  # Nível hierárquico da aprovação
    required_approver_count: Mapped[int] = mapped_column(default=1)  # Quantos devem aprovar
    
    status: Mapped[str] = mapped_column(String(20), default="PENDENTE")  # PENDENTE, APROVADO, REJEITADO
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class ApprovalDecision(Base):
    """Decisão individual de aprovação"""
    __tablename__ = "approval_decisions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    approval_request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("approval_requests.id", ondelete="CASCADE"))
    
    approver_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    decision: Mapped[str] = mapped_column(String(20))  # APROVADO, REJEITADO
    comment: Mapped[str | None] = mapped_column(String(500))
    
    decided_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
