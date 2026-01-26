from datetime import datetime
import uuid
from sqlalchemy import (
    Column, String, DateTime, ForeignKey, Boolean, Integer,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSON

from app.models.base import Base


class WebhookConfig(Base):
    """Configuração de webhooks customizáveis"""
    __tablename__ = "webhook_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    name: Mapped[str] = mapped_column(String(255))
    url: Mapped[str] = mapped_column(String(500))  # URL do webhook externo
    event_type: Mapped[str] = mapped_column(String(50))  # push, release, etc
    
    action: Mapped[str] = mapped_column(String(50))  # create_ticket, update_ticket, etc
    ticket_template: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class WebhookLog(Base):
    """Log de chamadas de webhook"""
    __tablename__ = "webhook_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    webhook_config_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("webhook_configs.id", ondelete="CASCADE"))
    
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status_code: Mapped[int] = mapped_column(Integer)
    response: Mapped[str | None] = mapped_column(String(1000))
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class Announcement(Base):
    """Avisos agendados no portal"""
    __tablename__ = "announcements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(String(1000))
    
    visible_to_groups: Mapped[list[uuid.UUID] | None] = mapped_column(JSON, nullable=True)
    
    scheduled_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    scheduled_end: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    
    is_highlight: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
