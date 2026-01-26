from datetime import datetime
import uuid
from sqlalchemy import (
    Column, String, DateTime, ForeignKey, Integer,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class License(Base):
    """Registro de software com datas de expiração"""
    __tablename__ = "licenses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    software_name: Mapped[str] = mapped_column(String(255))
    version: Mapped[str | None] = mapped_column(String(50))
    license_key: Mapped[str | None] = mapped_column(String(255))
    
    quantity: Mapped[int] = mapped_column(default=1)
    issued_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    expiry_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    
    vendor: Mapped[str | None] = mapped_column(String(255))
    cost: Mapped[float | None] = mapped_column()
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class MaintenanceContract(Base):
    """Contrato de manutenção por asset"""
    __tablename__ = "maintenance_contracts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("assets.id"))
    
    vendor: Mapped[str] = mapped_column(String(255))
    contract_number: Mapped[str] = mapped_column(String(100))
    
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    
    cost: Mapped[float | None] = mapped_column()
    coverage: Mapped[str | None] = mapped_column(String(255))  # Tipo de cobertura
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
