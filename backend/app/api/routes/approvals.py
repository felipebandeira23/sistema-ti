from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import get_current_active_user, require_roles
from app.models.user import User
from app.schemas import (
    ApprovalRequestPublic,
    ApprovalRequestCreate,
    ApprovalDecisionPublic,
    ApprovalDecisionCreate,
)
from app.services import (
    list_approvals,
    get_approval,
    create_approval,
    add_decision,
)

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.get("/", response_model=list[ApprovalRequestPublic])
async def list_all_approvals(
    ticket_id: UUID | None = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    return await list_approvals(session, ticket_id=ticket_id)


@router.post("/", response_model=ApprovalRequestPublic, status_code=status.HTTP_201_CREATED)
async def create_approval_route(
    payload: ApprovalRequestCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    return await create_approval(session, payload)


@router.post("/{approval_id}/decisions", response_model=ApprovalDecisionPublic, status_code=status.HTTP_201_CREATED)
async def decide_route(
    approval_id: UUID,
    payload: ApprovalDecisionCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    approval = await get_approval(session, approval_id)
    if not approval:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aprovação não encontrada")
    return await add_decision(session, approval, approver_id=current_user.id, payload=payload)
