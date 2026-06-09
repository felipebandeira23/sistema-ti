from datetime import datetime
import uuid
from enum import Enum as PyEnum
from sqlalchemy import String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class ChangeType(str, PyEnum):
    NORMAL = "NORMAL"
    EMERGENCIA = "EMERGENCIA"
    PADRAO = "PADRAO"


class ChangeStatus(str, PyEnum):
    RASCUNHO = "RASCUNHO"
    ANALISE = "ANALISE"
    APROVACAO = "APROVACAO"
    APROVADO = "APROVADO"
    EXECUCAO = "EXECUCAO"
    ENCERRADO = "ENCERRADO"
    CANCELADO = "CANCELADO"


class ChangeRisk(str, PyEnum):
    BAIXO = "BAIXO"
    MEDIO = "MEDIO"
    ALTO = "ALTO"


class Change(Base):
    __tablename__ = "changes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[ChangeType] = mapped_column(
        Enum(ChangeType, name="change_type"), default=ChangeType.NORMAL
    )
    status: Mapped[ChangeStatus] = mapped_column(
        Enum(ChangeStatus, name="change_status"), default=ChangeStatus.RASCUNHO, index=True
    )
    risk: Mapped[ChangeRisk] = mapped_column(
        Enum(ChangeRisk, name="change_risk"), default=ChangeRisk.MEDIO
    )
    justification: Mapped[str] = mapped_column(Text, nullable=False)
    impact_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    rollback_plan: Mapped[str | None] = mapped_column(Text, nullable=True)
    implementation_plan: Mapped[str | None] = mapped_column(Text, nullable=True)
    opened_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    assigned_to_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    scheduled_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scheduled_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
