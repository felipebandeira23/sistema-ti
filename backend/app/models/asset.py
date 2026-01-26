from datetime import datetime
import uuid
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, String, Text, Boolean, DateTime, Enum,
    ForeignKey, Numeric, Integer,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, INET

from app.models.base import Base


class AssetType(str, PyEnum):
    """Tipos de ativos conforme documento"""
    HARDWARE = "HARDWARE"
    PERIFÉRICO = "PERIFÉRICO"
    REDE = "REDE"
    MÓVEL = "MÓVEL"
    SOFTWARE = "SOFTWARE"
    SERVIDOR = "SERVIDOR"
    CONSUMÍVEL = "CONSUMÍVEL"


class AssetStatus(str, PyEnum):
    """Status do ativo"""
    DISPONÍVEL = "DISPONÍVEL"
    EM_USO = "EM_USO"
    MANUTENÇÃO = "MANUTENÇÃO"
    APOSENTADO = "APOSENTADO"
    RESERVADO = "RESERVADO"


class Asset(Base):
    """Inventário de ativos de TI (sincronizado com GLPI)"""
    __tablename__ = "assets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    asset_type: Mapped[AssetType] = mapped_column(Enum(AssetType, name="asset_type"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    serial_number: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    manufacturer: Mapped[str | None] = mapped_column(String(255))
    model: Mapped[str | None] = mapped_column(String(255))
    
    # Dados de aquisição
    acquisition_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    warranty_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cost: Mapped[float | None] = mapped_column(Numeric(12, 2))
    
    # Localização
    location_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # FK para localização futura
    assigned_to_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    status: Mapped[AssetStatus] = mapped_column(Enum(AssetStatus, name="asset_status"), default=AssetStatus.DISPONÍVEL)
    
    # Atributos de rede
    ip_address: Mapped[str | None] = mapped_column(INET, nullable=True)
    mac_address: Mapped[str | None] = mapped_column(String(17), nullable=True)  # XX:XX:XX:XX:XX:XX
    hostname: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Atributos de virtualização
    host_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=True)  # VM hospedada em...
    
    # Sincronização GLPI
    glpi_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    last_sync: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    
    # Auditoria
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)  # Soft delete
