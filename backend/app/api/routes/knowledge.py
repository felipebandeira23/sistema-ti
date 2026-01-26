from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import get_current_active_user, require_roles
from app.models.user import User
from app.schemas import (
    KnowledgeCategoryPublic,
    KnowledgeCategoryCreate,
    KnowledgeCategoryUpdate,
    KnowledgeArticlePublic,
    KnowledgeArticleCreate,
    KnowledgeArticleUpdate,
    KnowledgeFeedbackPublic,
    KnowledgeFeedbackCreate,
)
from app.services import (
    list_kb_categories,
    create_kb_category,
    update_kb_category,
    get_kb_category,
    list_articles,
    get_article,
    create_article,
    update_article,
    add_feedback,
)

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


# Categories
@router.get("/categories", response_model=list[KnowledgeCategoryPublic])
async def list_categories_route(session: AsyncSession = Depends(get_session)):
    return await list_kb_categories(session)


@router.post("/categories", response_model=KnowledgeCategoryPublic, status_code=status.HTTP_201_CREATED)
async def create_category_route(
    payload: KnowledgeCategoryCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    return await create_kb_category(session, payload)


@router.patch("/categories/{category_id}", response_model=KnowledgeCategoryPublic)
async def update_category_route(
    category_id: UUID,
    payload: KnowledgeCategoryUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    category = await get_kb_category(session, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada")
    return await update_kb_category(session, category, payload)


# Articles
@router.get("/articles", response_model=list[KnowledgeArticlePublic])
async def list_articles_route(
    session: AsyncSession = Depends(get_session),
    published_only: bool = True,
    category_id: UUID | None = None,
    q: str | None = None,
):
    return await list_articles(session, published_only=published_only, category_id=category_id, q=q)


@router.get("/articles/{article_id}", response_model=KnowledgeArticlePublic)
async def get_article_route(article_id: UUID, session: AsyncSession = Depends(get_session)):
    article = await get_article(session, article_id)
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artigo não encontrado")
    return article


@router.post("/articles", response_model=KnowledgeArticlePublic, status_code=status.HTTP_201_CREATED)
async def create_article_route(
    payload: KnowledgeArticleCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    return await create_article(session, payload, author_id=current_user.id)


@router.patch("/articles/{article_id}", response_model=KnowledgeArticlePublic)
async def update_article_route(
    article_id: UUID,
    payload: KnowledgeArticleUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    article = await get_article(session, article_id)
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artigo não encontrado")
    return await update_article(session, article, payload, editor_id=current_user.id)


@router.post("/articles/{article_id}/feedback", response_model=KnowledgeFeedbackPublic, status_code=status.HTTP_201_CREATED)
async def add_feedback_route(
    article_id: UUID,
    payload: KnowledgeFeedbackCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    return await add_feedback(session, article_id, payload)
