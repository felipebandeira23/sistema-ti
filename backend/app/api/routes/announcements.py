from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import get_current_active_user, require_roles
from app.models.user import User
from app.models.integrations import Announcement

router = APIRouter(prefix="/announcements", tags=["announcements"])

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    scheduled_start: datetime
    scheduled_end: datetime
    is_highlight: bool = False

class AnnouncementUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    scheduled_end: datetime | None = None
    is_highlight: bool | None = None

@router.get("/")
async def list_active_announcements(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    now = datetime.utcnow()
    result = await session.execute(
        select(Announcement)
        .where(Announcement.scheduled_start <= now, Announcement.scheduled_end >= now)
        .order_by(Announcement.is_highlight.desc(), Announcement.created_at.desc())
    )
    announcements = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "title": a.title,
            "content": a.content,
            "is_highlight": a.is_highlight,
            "scheduled_start": a.scheduled_start.isoformat(),
            "scheduled_end": a.scheduled_end.isoformat(),
            "created_at": a.created_at.isoformat(),
        }
        for a in announcements
    ]

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_announcement(
    payload: AnnouncementCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin"])),
):
    ann = Announcement(
        title=payload.title,
        content=payload.content,
        scheduled_start=payload.scheduled_start,
        scheduled_end=payload.scheduled_end,
        is_highlight=payload.is_highlight,
        created_by_user_id=current_user.id,
    )
    session.add(ann)
    await session.commit()
    await session.refresh(ann)
    return {"id": str(ann.id), "title": ann.title, "content": ann.content, "is_highlight": ann.is_highlight}

@router.patch("/{announcement_id}")
async def update_announcement(
    announcement_id: UUID,
    payload: AnnouncementUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin"])),
):
    result = await session.execute(select(Announcement).where(Announcement.id == announcement_id))
    ann = result.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=404, detail="Anúncio não encontrado")
    if payload.title is not None:
        ann.title = payload.title
    if payload.content is not None:
        ann.content = payload.content
    if payload.scheduled_end is not None:
        ann.scheduled_end = payload.scheduled_end
    if payload.is_highlight is not None:
        ann.is_highlight = payload.is_highlight
    await session.commit()
    await session.refresh(ann)
    return {"id": str(ann.id), "title": ann.title}
