from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import get_current_active_user, require_roles
from app.models.user import User
from app.schemas.problem import ProblemPublic, ProblemCreate, ProblemUpdate, ProblemTicketLinkCreate, ProblemTicketLinkPublic
from app.services.problem_service import list_problems, get_problem, create_problem, update_problem, link_ticket

router = APIRouter(prefix="/problems", tags=["problems"])


@router.get("/", response_model=list[ProblemPublic])
async def list_all_problems(
    status_filter: str | None = None,
    q: str | None = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    return await list_problems(session, status=status_filter, q=q)


@router.get("/{problem_id}", response_model=ProblemPublic)
async def get_problem_by_id(
    problem_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    problem = await get_problem(session, problem_id)
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problema não encontrado")
    return problem


@router.post("/", response_model=ProblemPublic, status_code=status.HTTP_201_CREATED)
async def create_new_problem(
    payload: ProblemCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return await create_problem(session, payload, opened_by=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{problem_id}", response_model=ProblemPublic)
async def update_problem_route(
    problem_id: UUID,
    payload: ProblemUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    problem = await get_problem(session, problem_id)
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problema não encontrado")
    try:
        return await update_problem(session, problem, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{problem_id}/tickets", response_model=ProblemTicketLinkPublic, status_code=status.HTTP_201_CREATED)
async def link_ticket_to_problem(
    problem_id: UUID,
    payload: ProblemTicketLinkCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    problem = await get_problem(session, problem_id)
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problema não encontrado")
    try:
        return await link_ticket(session, problem_id=problem_id, ticket_id=payload.ticket_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
