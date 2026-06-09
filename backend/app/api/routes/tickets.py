from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import get_current_active_user, require_roles
from app.models.user import User
from app.schemas import (
    TicketCreate, TicketPublic, TicketStatusUpdate, TicketUpdate,
    TicketCommentCreate, TicketCommentPublic, TicketHistoryPublic,
    TicketTaskCreate, TicketTaskPublic, TicketFeedbackCreate, TicketFeedbackPublic,
)
from app.services import (
    list_tickets, get_ticket, create_ticket, update_ticket_status,
    list_comments, add_comment, get_history, list_tasks, add_task,
    update_task_status, add_ticket_feedback, update_ticket,
)

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("/", response_model=list[TicketPublic])
async def list_all_tickets(
    limit: int = 50,
    offset: int = 0,
    status_filter: str | None = None,
    priority_filter: str | None = None,
    type_filter: str | None = None,
    q: str | None = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    return await list_tickets(
        session,
        limit=limit,
        offset=offset,
        status=status_filter,
        priority=priority_filter,
        type_filter=type_filter,
        q=q,
    )


@router.get("/{ticket_id}", response_model=TicketPublic)
async def get_ticket_by_id(
    ticket_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    ticket = await get_ticket(session, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket não encontrado")
    # Nota: poderia validar se requester é dono ou tem role; simplificado.
    return ticket


@router.post("/", response_model=TicketPublic, status_code=status.HTTP_201_CREATED)
async def create_new_ticket(
    payload: TicketCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return await create_ticket(session, payload, opened_by=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{ticket_id}/status", response_model=TicketPublic)
async def update_ticket_status_route(
    ticket_id: UUID,
    payload: TicketStatusUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    ticket = await get_ticket(session, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket não encontrado")
    try:
        return await update_ticket_status(session, ticket, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{ticket_id}", response_model=TicketPublic)
async def update_ticket_route(
    ticket_id: UUID,
    payload: TicketUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    ticket = await get_ticket(session, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    return await update_ticket(session, ticket, payload, changed_by=current_user.id)


@router.get("/{ticket_id}/comments", response_model=list[TicketCommentPublic])
async def list_ticket_comments(
    ticket_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    return await list_comments(session, ticket_id)


@router.post("/{ticket_id}/comments", response_model=TicketCommentPublic, status_code=201)
async def add_ticket_comment(
    ticket_id: UUID,
    payload: TicketCommentCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    ticket = await get_ticket(session, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    return await add_comment(session, ticket_id, current_user.id, payload.content, payload.is_public)


@router.get("/{ticket_id}/history", response_model=list[TicketHistoryPublic])
async def get_ticket_history(
    ticket_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    return await get_history(session, ticket_id)


@router.get("/{ticket_id}/tasks", response_model=list[TicketTaskPublic])
async def list_ticket_tasks(
    ticket_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    return await list_tasks(session, ticket_id)


@router.post("/{ticket_id}/tasks", response_model=TicketTaskPublic, status_code=201)
async def add_ticket_task(
    ticket_id: UUID,
    payload: TicketTaskCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    ticket = await get_ticket(session, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    return await add_task(session, ticket_id, payload.title, payload.description, payload.due_date)


@router.patch("/{ticket_id}/tasks/{task_id}", response_model=TicketTaskPublic)
async def update_task_status_route(
    ticket_id: UUID,
    task_id: UUID,
    status: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    task = await update_task_status(session, task_id, status)
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    return task


@router.post("/{ticket_id}/feedback", response_model=TicketFeedbackPublic, status_code=201)
async def submit_ticket_feedback(
    ticket_id: UUID,
    payload: TicketFeedbackCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    if not 1 <= payload.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating deve ser entre 1 e 5")
    ticket = await get_ticket(session, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    return await add_ticket_feedback(session, ticket_id, payload.rating, payload.comment, payload.would_recommend)
