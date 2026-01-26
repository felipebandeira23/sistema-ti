from datetime import datetime
import uuid
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, String, Text, DateTime, Enum,
    ForeignKey, Integer, Boolean, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSON

from app.models.base import Base


class TicketType(str, PyEnum):
    """Tipos de tickets ITSM"""
    INCIDENTE = "INCIDENTE"
    REQUISIÇÃO = "REQUISIÇÃO"
    PROBLEMA = "PROBLEMA"
    MUDANÇA = "MUDANÇA"


class TicketStatus(str, PyEnum):
    """Estados do ticket"""
    NOVO = "NOVO"
    TRIAGEM = "TRIAGEM"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    AGUARDANDO = "AGUARDANDO"
    RESOLVIDO = "RESOLVIDO"
    FECHADO = "FECHADO"
    CANCELADO = "CANCELADO"


class TicketPriority(str, PyEnum):
    """Prioridade do ticket (matriz 3x3: urgência x impacto)"""
    P1_CRÍTICO = "P1_CRÍTICO"
    P2_ALTO = "P2_ALTO"
    P3_MÉDIO = "P3_MÉDIO"
    P4_BAIXO = "P4_BAIXO"


class TicketUrgency(str, PyEnum):
    """Urgência percebida pelo usuário"""
    CRÍTICA = "CRÍTICA"
    ALTA = "ALTA"
    MÉDIA = "MÉDIA"
    BAIXA = "BAIXA"


class TicketImpact(str, PyEnum):
    """Impacto na organização"""
    MÚLTIPLOS = "MÚLTIPLOS"
    ALGUNS = "ALGUNS"
    INDIVIDUAL = "INDIVIDUAL"


class SLAStatus(str, PyEnum):
    """Status do SLA do ticket"""
    OK = "OK"
    CRÍTICO = "CRÍTICO"  # >= 70% do tempo
    EXPIRADO = "EXPIRADO"  # >= 100%
    PAUSADO = "PAUSADO"  # Ticket em AGUARDANDO


class Ticket(Base):
    """Ticket ITSM - Incidente, Requisição, Problema ou Mudança"""
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    ticket_number: Mapped[int] = mapped_column(Integer, unique=True, autoincrement=True)  # #12345
    
    type: Mapped[TicketType] = mapped_column(Enum(TicketType, name="ticket_type"))
    status: Mapped[TicketStatus] = mapped_column(Enum(TicketStatus, name="ticket_status"), default=TicketStatus.NOVO, index=True)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    priority: Mapped[TicketPriority] = mapped_column(Enum(TicketPriority, name="ticket_priority"), index=True)
    urgency: Mapped[TicketUrgency] = mapped_column(Enum(TicketUrgency, name="ticket_urgency"))
    impact: Mapped[TicketImpact] = mapped_column(Enum(TicketImpact, name="ticket_impact"))
    
    # Rastreabilidade
    opened_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    assigned_to_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_to_group_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # FK para grupo de técnicos
    
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    asset_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=True)
    ci_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("configuration_items.id"), nullable=True)
    
    # SLA
    sla_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("slas.id"), nullable=True)
    sla_target_response: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sla_target_resolution: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sla_status: Mapped[SLAStatus] = mapped_column(Enum(SLAStatus, name="sla_status"), default=SLAStatus.OK)
    
    # Resolução
    solution: Mapped[str | None] = mapped_column(Text)
    root_cause: Mapped[str | None] = mapped_column(Text)  # Para problemas
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    
    # Auditoria
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)  # Soft delete


class TicketComment(Base):
    """Comentários públicos e internos no ticket"""
    __tablename__ = "ticket_comments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"))
    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)  # Visível ao solicitante?
    
    # @mention
    mentions: Mapped[list[uuid.UUID] | None] = mapped_column(JSON, nullable=True)
    
    # Auditoria
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class TicketHistory(Base):
    """Histórico de mudanças em campos do ticket"""
    __tablename__ = "ticket_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), index=True)
    
    field: Mapped[str] = mapped_column(String(64))  # Campo modificado (status, priority, etc)
    old_value: Mapped[str | None] = mapped_column(Text)
    new_value: Mapped[str | None] = mapped_column(Text)
    
    changed_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class TicketFeedback(Base):
    """Satisfação do usuário após fechamento do ticket"""
    __tablename__ = "ticket_feedback"
    __table_args__ = (
        UniqueConstraint("ticket_id", name="uq_ticket_feedback"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"))
    
    rating: Mapped[int] = mapped_column(Integer)  # 1-5 estrelas
    comment: Mapped[str | None] = mapped_column(Text)
    would_recommend: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class TicketTask(Base):
    """Subtasks de um ticket (especialmente para requisições complexas)"""
    __tablename__ = "ticket_tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"))
    
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    assigned_to_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    status: Mapped[str] = mapped_column(String(20), default="PENDENTE")  # PENDENTE, EM_ANDAMENTO, CONCLUÍDO
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
