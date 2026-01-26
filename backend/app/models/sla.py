from datetime import datetime, time
import uuid
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, String, Text, DateTime, Integer, Enum,
    ForeignKey, Boolean, Time,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSON, ARRAY

from app.models.base import Base


class SLA(Base):
    """Definição de SLA por tipo e prioridade de ticket"""
    __tablename__ = "slas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    
    # Aplicabilidade
    ticket_type: Mapped[str] = mapped_column(String(50))  # INCIDENTE, REQUISIÇÃO, PROBLEMA, MUDANÇA
    priority_level: Mapped[str] = mapped_column(String(20))  # P1, P2, P3, P4
    
    # Tempos em horas
    response_time: Mapped[int] = mapped_column(Integer)  # RTO - Response Time Objective
    resolution_time: Mapped[int] = mapped_column(Integer)  # TTR - Time To Resolution
    
    # Calendário (horário útil)
    calendar_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("calendars.id"), nullable=True)
    
    # Ações de escalação (JSON para flexibilidade)
    escalation_actions: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class Calendar(Base):
    """Calendário de horário útil para cálculo de SLA"""
    __tablename__ = "calendars"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    name: Mapped[str] = mapped_column(String(255), unique=True)
    timezone: Mapped[str] = mapped_column(String(50), default="America/Sao_Paulo")
    
    # Horário base
    work_hours_start: Mapped[time] = mapped_column(Time, default=time(8, 0))  # 08:00
    work_hours_end: Mapped[time] = mapped_column(Time, default=time(18, 0))  # 18:00
    
    # Dias da semana (MON, TUE, WED, THU, FRI)
    work_days: Mapped[list[str]] = mapped_column(ARRAY(String(3)), default=["MON", "TUE", "WED", "THU", "FRI"])
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class CalendarHoliday(Base):
    """Feriados do calendário"""
    __tablename__ = "calendar_holidays"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calendar_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("calendars.id", ondelete="CASCADE"))
    
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    name: Mapped[str] = mapped_column(String(255))  # "Carnaval", "Natal", etc
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
