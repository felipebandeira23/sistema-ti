from datetime import datetime
import uuid
from sqlalchemy import (
    Column, String, Text, DateTime,
    ForeignKey, Integer, Boolean,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSON

from app.models.base import Base


class ServiceCatalogCategory(Base):
    """Categorias do catálogo de serviços"""
    __tablename__ = "service_catalog_categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    icon: Mapped[str | None] = mapped_column(String(255))  # URL ou emoji
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class ServiceCatalogItem(Base):
    """Itens do catálogo (Instalar Software, Criar Conta, etc)"""
    __tablename__ = "service_catalog_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    category_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("service_catalog_categories.id"))
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    icon: Mapped[str | None] = mapped_column(String(255))
    order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Acesso
    visible_to_groups: Mapped[list[uuid.UUID] | None] = mapped_column(JSON, nullable=True)  # Se None, é público
    
    # Formulário dinâmico (JSON Schema)
    form_schema: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Aprovação
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False)
    approval_group_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    approval_levels: Mapped[int] = mapped_column(Integer, default=1)  # 1 ou múltiplos níveis
    
    # SLA específico deste serviço
    sla_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("slas.id"), nullable=True)
    
    # Tasks automáticas que serão geradas ao criar requisição
    auto_tasks_template: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class ServiceRequest(Base):
    """Requisição de serviço (especialização de Ticket)"""
    __tablename__ = "service_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"))
    service_item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("service_catalog_items.id"))
    
    requested_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Dados preenchidos do formulário
    form_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
