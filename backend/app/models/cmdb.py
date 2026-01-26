from datetime import datetime
import uuid
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, String, Text, Boolean, DateTime, Enum,
    ForeignKey, Integer, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSON

from app.models.base import Base


class CIType(str, PyEnum):
    """Tipos de Configuration Items (CI)"""
    HARDWARE = "HARDWARE"
    SOFTWARE = "SOFTWARE"
    SERVIÇO = "SERVIÇO"
    APLICAÇÃO = "APLICAÇÃO"
    BANCO_DADOS = "BANCO_DADOS"
    REDE = "REDE"
    DOCUMENTAÇÃO = "DOCUMENTAÇÃO"


class CIStatus(str, PyEnum):
    """Status do CI"""
    ATIVO = "ATIVO"
    INATIVO = "INATIVO"
    DEPRECIADO = "DEPRECIADO"


class RelationshipType(str, PyEnum):
    """Tipos de relacionamentos entre CIs"""
    HOSPEDA = "HOSPEDA"
    DEPENDE_DE = "DEPENDE_DE"
    FORNECE_ACESSO_A = "FORNECE_ACESSO_A"
    USA = "USA"
    CONECTA_A = "CONECTA_A"
    FALHA_AFETA = "FALHA_AFETA"


class ConfigurationItem(Base):
    """CMDB: Item de Configuração (CI) - elemento da infraestrutura"""
    __tablename__ = "configuration_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    ci_type: Mapped[CIType] = mapped_column(Enum(CIType, name="ci_type"))
    status: Mapped[CIStatus] = mapped_column(Enum(CIStatus, name="ci_status"), default=CIStatus.ATIVO)
    
    # Proprietário e criticidade
    owner_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    criticality: Mapped[int] = mapped_column(Integer, default=3)  # 1-5, onde 5 = crítico
    impact_level: Mapped[int] = mapped_column(Integer, default=0)  # Quantos tickets seriam afetados se down
    
    # Relacionamento com asset
    asset_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=True)
    
    # Atributos customizáveis por tipo de CI
    attributes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Auditoria
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class CIRelationship(Base):
    """Relacionamentos entre CIs (grafo para análise de impacto)"""
    __tablename__ = "ci_relationships"
    __table_args__ = (
        UniqueConstraint("source_ci_id", "target_ci_id", "relationship_type", name="uq_ci_relationship"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_ci_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("configuration_items.id", ondelete="CASCADE"))
    target_ci_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("configuration_items.id", ondelete="CASCADE"))
    relationship_type: Mapped[RelationshipType] = mapped_column(Enum(RelationshipType, name="relationship_type"))
    
    # Propagação de impacto
    impact_propagation: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Auditoria
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
