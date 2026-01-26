"""Serviços para base de conhecimento."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge import (
    KnowledgeCategory,
    KnowledgeArticle,
    KnowledgeArticleVersion,
    KnowledgeFeedback,
)
from app.schemas.knowledge import (
    KnowledgeCategoryCreate,
    KnowledgeCategoryUpdate,
    KnowledgeArticleCreate,
    KnowledgeArticleUpdate,
    KnowledgeFeedbackCreate,
)


# Categorias
async def list_categories(session: AsyncSession) -> list[KnowledgeCategory]:
    result = await session.execute(select(KnowledgeCategory).order_by(KnowledgeCategory.order))
    return list(result.scalars().all())


async def create_category(session: AsyncSession, payload: KnowledgeCategoryCreate) -> KnowledgeCategory:
    category = KnowledgeCategory(**payload.model_dump())
    session.add(category)
    await session.commit()
    await session.refresh(category)
    return category


async def update_category(session: AsyncSession, category: KnowledgeCategory, payload: KnowledgeCategoryUpdate) -> KnowledgeCategory:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    await session.commit()
    await session.refresh(category)
    return category


async def get_category(session: AsyncSession, category_id: UUID) -> Optional[KnowledgeCategory]:
    result = await session.execute(select(KnowledgeCategory).where(KnowledgeCategory.id == category_id))
    return result.scalar_one_or_none()


# Artigos
async def list_articles(
    session: AsyncSession,
    published_only: bool = True,
    category_id: UUID | None = None,
    q: str | None = None,
) -> list[KnowledgeArticle]:
    query = select(KnowledgeArticle)
    if published_only:
        query = query.where(KnowledgeArticle.is_published.is_(True))
    if category_id:
        query = query.where(KnowledgeArticle.category_id == category_id)
    if q:
        like = f"%{q}%"
        query = query.where(or_(KnowledgeArticle.title.ilike(like), KnowledgeArticle.content.ilike(like)))
    result = await session.execute(query.order_by(KnowledgeArticle.created_at.desc()))
    return list(result.scalars().all())


async def get_article(session: AsyncSession, article_id: UUID) -> Optional[KnowledgeArticle]:
    result = await session.execute(select(KnowledgeArticle).where(KnowledgeArticle.id == article_id))
    return result.scalar_one_or_none()


async def create_article(session: AsyncSession, payload: KnowledgeArticleCreate, author_id: UUID) -> KnowledgeArticle:
    article = KnowledgeArticle(
        **payload.model_dump(),
        author_id=author_id,
        version=1,
        published_at=datetime.utcnow() if payload.is_published else None,
    )
    session.add(article)
    await session.commit()
    await session.refresh(article)
    return article


async def update_article(session: AsyncSession, article: KnowledgeArticle, payload: KnowledgeArticleUpdate, editor_id: UUID) -> KnowledgeArticle:
    # Salva versão anterior
    version = KnowledgeArticleVersion(
        article_id=article.id,
        version=article.version,
        content=article.content,
        changed_by_user_id=editor_id,
        change_note="update",
    )
    session.add(version)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(article, field, value)
    article.version += 1
    if payload.is_published:
        article.published_at = datetime.utcnow()

    await session.commit()
    await session.refresh(article)
    return article


async def add_feedback(session: AsyncSession, article_id: UUID, payload: KnowledgeFeedbackCreate) -> KnowledgeFeedback:
    feedback = KnowledgeFeedback(article_id=article_id, **payload.model_dump())
    session.add(feedback)
    # Atualiza contadores básicos
    article = await get_article(session, article_id)
    if article:
        if payload.helpful:
            article.helpful_count += 1
        else:
            article.not_helpful_count += 1
    await session.commit()
    await session.refresh(feedback)
    return feedback
