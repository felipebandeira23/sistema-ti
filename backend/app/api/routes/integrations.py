from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import require_roles
from app.models.user import User
from app.models.integrations import WebhookConfig, WebhookLog

router = APIRouter(prefix="/integrations", tags=["integrations"])

class WebhookCreate(BaseModel):
    name: str
    url: str
    event_type: str
    action: str

class WebhookUpdate(BaseModel):
    name: str | None = None
    url: str | None = None
    is_active: bool | None = None

def webhook_to_dict(w: WebhookConfig) -> dict:
    return {
        "id": str(w.id),
        "name": w.name,
        "url": w.url,
        "event_type": w.event_type,
        "action": w.action,
        "is_active": w.is_active,
        "created_at": w.created_at.isoformat() if w.created_at else None,
    }

@router.get("/webhooks/")
async def list_webhooks(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin"])),
):
    result = await session.execute(select(WebhookConfig).order_by(WebhookConfig.created_at.desc()))
    return [webhook_to_dict(w) for w in result.scalars().all()]

@router.post("/webhooks/", status_code=201)
async def create_webhook(
    payload: WebhookCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin"])),
):
    webhook = WebhookConfig(**payload.model_dump())
    session.add(webhook)
    await session.commit()
    await session.refresh(webhook)
    return webhook_to_dict(webhook)

@router.patch("/webhooks/{webhook_id}")
async def update_webhook(
    webhook_id: UUID,
    payload: WebhookUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin"])),
):
    result = await session.execute(select(WebhookConfig).where(WebhookConfig.id == webhook_id))
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook não encontrado")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(webhook, field, value)
    webhook.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(webhook)
    return webhook_to_dict(webhook)

@router.get("/webhooks/{webhook_id}/logs")
async def get_webhook_logs(
    webhook_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin"])),
):
    result = await session.execute(
        select(WebhookLog)
        .where(WebhookLog.webhook_config_id == webhook_id)
        .order_by(WebhookLog.created_at.desc())
        .limit(50)
    )
    logs = result.scalars().all()
    return [
        {
            "id": str(log.id),
            "status_code": log.status_code,
            "response": log.response,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]

@router.post("/webhooks/{webhook_id}/test")
async def test_webhook(
    webhook_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin"])),
):
    import httpx
    result = await session.execute(select(WebhookConfig).where(WebhookConfig.id == webhook_id))
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook não encontrado")
    test_payload = {"event": "test", "timestamp": datetime.utcnow().isoformat(), "source": "COPPEAD ITSM"}
    status_code = 0
    response_text = ""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(webhook.url, json=test_payload)
            status_code = resp.status_code
            response_text = resp.text[:500]
    except Exception as e:
        response_text = str(e)
    log = WebhookLog(webhook_config_id=webhook.id, payload=test_payload, status_code=status_code, response=response_text)
    session.add(log)
    await session.commit()
    return {"status_code": status_code, "response": response_text}
