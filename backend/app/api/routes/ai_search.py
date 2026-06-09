"""AI-like search routes using PostgreSQL ILIKE full-text matching.

Simulates semantic search across ITSM entities without requiring ML infrastructure.
Results include a `source` field to identify the originating entity type.
"""
from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import get_current_active_user
from app.models.user import User
from app.models.ticket import Ticket
from app.models.knowledge import KnowledgeArticle
from app.models.problem import Problem
from app.models.change import Change

router = APIRouter(prefix="/ai", tags=["ai-search"])


def _ticket_to_dict(ticket: Ticket) -> dict[str, Any]:
    return {
        "source": "ticket",
        "id": str(ticket.id),
        "title": ticket.title,
        "description": ticket.description,
        "status": ticket.status,
        "type": ticket.type,
    }


def _article_to_dict(article: KnowledgeArticle) -> dict[str, Any]:
    return {
        "source": "knowledge_article",
        "id": str(article.id),
        "title": article.title,
        "description": article.summary or "",
        "status": "published" if article.is_published else "draft",
    }


def _problem_to_dict(problem: Problem) -> dict[str, Any]:
    return {
        "source": "problem",
        "id": str(problem.id),
        "title": problem.title,
        "description": problem.description,
        "status": problem.status,
    }


def _change_to_dict(change: Change) -> dict[str, Any]:
    return {
        "source": "change",
        "id": str(change.id),
        "title": change.title,
        "description": change.description,
        "status": change.status,
    }


@router.get("/similar-tickets")
async def similar_tickets(
    q: str = Query(..., min_length=2, description="Search text"),
    limit: int = Query(5, ge=1, le=50),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> list[dict[str, Any]]:
    """Find tickets matching the query text in title or description."""
    like = f"%{q}%"
    query = (
        select(Ticket)
        .where(
            Ticket.deleted_at.is_(None),
            or_(Ticket.title.ilike(like), Ticket.description.ilike(like)),
        )
        .order_by(Ticket.created_at.desc())
        .limit(limit)
    )
    result = await session.execute(query)
    tickets = result.scalars().unique().all()
    return [_ticket_to_dict(t) for t in tickets]


@router.get("/suggest-articles")
async def suggest_articles(
    q: str = Query(..., min_length=2, description="Search text"),
    limit: int = Query(3, ge=1, le=20),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> list[dict[str, Any]]:
    """Find published knowledge articles matching the query text."""
    like = f"%{q}%"
    query = (
        select(KnowledgeArticle)
        .where(
            KnowledgeArticle.is_published.is_(True),
            or_(
                KnowledgeArticle.title.ilike(like),
                KnowledgeArticle.content.ilike(like),
                KnowledgeArticle.summary.ilike(like),
            ),
        )
        .order_by(KnowledgeArticle.view_count.desc())
        .limit(limit)
    )
    result = await session.execute(query)
    articles = result.scalars().unique().all()
    return [_article_to_dict(a) for a in articles]


@router.get("/search")
async def global_search(
    q: str = Query(..., min_length=2, description="Search text"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, list[dict[str, Any]]]:
    """Search across tickets, knowledge articles, problems and changes."""
    like = f"%{q}%"

    # Tickets
    ticket_query = (
        select(Ticket)
        .where(
            Ticket.deleted_at.is_(None),
            or_(Ticket.title.ilike(like), Ticket.description.ilike(like)),
        )
        .order_by(Ticket.created_at.desc())
        .limit(5)
    )
    ticket_result = await session.execute(ticket_query)
    tickets = [_ticket_to_dict(t) for t in ticket_result.scalars().unique().all()]

    # Knowledge articles
    article_query = (
        select(KnowledgeArticle)
        .where(
            KnowledgeArticle.is_published.is_(True),
            or_(
                KnowledgeArticle.title.ilike(like),
                KnowledgeArticle.content.ilike(like),
                KnowledgeArticle.summary.ilike(like),
            ),
        )
        .order_by(KnowledgeArticle.view_count.desc())
        .limit(5)
    )
    article_result = await session.execute(article_query)
    articles = [_article_to_dict(a) for a in article_result.scalars().unique().all()]

    # Problems
    problem_query = (
        select(Problem)
        .where(
            Problem.deleted_at.is_(None),
            or_(Problem.title.ilike(like), Problem.description.ilike(like)),
        )
        .order_by(Problem.created_at.desc())
        .limit(5)
    )
    problem_result = await session.execute(problem_query)
    problems = [_problem_to_dict(p) for p in problem_result.scalars().unique().all()]

    # Changes
    change_query = (
        select(Change)
        .where(
            Change.deleted_at.is_(None),
            or_(Change.title.ilike(like), Change.description.ilike(like)),
        )
        .order_by(Change.created_at.desc())
        .limit(5)
    )
    change_result = await session.execute(change_query)
    changes = [_change_to_dict(c) for c in change_result.scalars().unique().all()]

    return {
        "tickets": tickets,
        "articles": articles,
        "problems": problems,
        "changes": changes,
    }
