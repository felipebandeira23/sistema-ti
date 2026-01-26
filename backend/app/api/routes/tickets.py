from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import get_current_active_user, require_roles
from app.models.user import User
from app.schemas import TicketCreate, TicketPublic, TicketStatusUpdate
from app.services import list_tickets, get_ticket, create_ticket, update_ticket_status

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
