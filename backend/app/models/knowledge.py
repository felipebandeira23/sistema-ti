from datetime import datetime
import uuid
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, String, Text, DateTime,
    ForeignKey, Integer, Boolean, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSON

from app.models.base import Base


class KnowledgeCategory(Base):
    """Categorias hierárquicas da base de conhecimento"""
    __tablename__ = "knowledge_categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    
    # Hierarquia
    parent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("knowledge_categories.id"), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class KnowledgeArticle(Base):
    """Artigos da base de conhecimento (FAQ, procedimentos, etc)"""
    __tablename__ = "knowledge_articles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)  # Markdown
    summary: Mapped[str | None] = mapped_column(Text)
    
    category_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("knowledge_categories.id"))
    
    # Tags
    tags: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    
    # Controle
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    visibility: Mapped[str] = mapped_column(String(20), default="PÚBLICO")  # PÚBLICO, INTERNO, RESTRITO
    visible_to_groups: Mapped[list[uuid.UUID] | None] = mapped_column(JSON, nullable=True)
    
    # Autoria
    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Relevância
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    helpful_count: Mapped[int] = mapped_column(Integer, default=0)
    not_helpful_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Versionamento
    version: Mapped[int] = mapped_column(Integer, default=1)
    
    # Auditoria
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class KnowledgeArticleVersion(Base):
    """Histórico de versões dos artigos"""
    __tablename__ = "knowledge_article_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("knowledge_articles.id", ondelete="CASCADE"))
    
    version: Mapped[int]
    content: Mapped[str] = mapped_column(Text)
    
    changed_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    change_note: Mapped[str | None] = mapped_column(String(255))
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class KnowledgeFeedback(Base):
    """Feedback sobre utilidade de artigos"""
    __tablename__ = "knowledge_feedback"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("knowledge_articles.id", ondelete="CASCADE"))
    
    helpful: Mapped[bool]
    comment: Mapped[str | None] = mapped_column(Text)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
