from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class KnowledgeCategoryCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    parent_id: UUID | None = None
    order: int = 0


class KnowledgeCategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    parent_id: UUID | None = None
    order: int | None = None


class KnowledgeCategoryPublic(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str | None = None
    parent_id: UUID | None = None
    order: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class KnowledgeArticleCreate(BaseModel):
    title: str
    slug: str
    content: str
    summary: str | None = None
    category_id: UUID
    tags: list[str] | None = None
    is_published: bool = False
    visibility: str = "PÚBLICO"
    visible_to_groups: list[UUID] | None = None


class KnowledgeArticleUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    content: str | None = None
    summary: str | None = None
    category_id: UUID | None = None
    tags: list[str] | None = None
    is_published: bool | None = None
    visibility: str | None = None
    visible_to_groups: list[UUID] | None = None


class KnowledgeArticlePublic(BaseModel):
    id: UUID
    title: str
    slug: str
    content: str
    summary: str | None = None
    category_id: UUID
    tags: list[str] | None = None
    is_published: bool
    visibility: str
    visible_to_groups: list[UUID] | None = None
    author_id: UUID
    view_count: int
    helpful_count: int
    not_helpful_count: int
    version: int
    created_at: datetime
    published_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class KnowledgeFeedbackCreate(BaseModel):
    helpful: bool
    comment: str | None = None


class KnowledgeFeedbackPublic(BaseModel):
    id: UUID
    article_id: UUID
    helpful: bool
    comment: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
