"""Serviços para CRUD de ativos."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset, AssetStatus, AssetType
from app.schemas.asset import AssetCreate, AssetUpdate


async def list_assets(
    session: AsyncSession,
    limit: int = 50,
    offset: int = 0,
    asset_type: str | None = None,
    status: str | None = None,
    q: str | None = None,
) -> list[Asset]:
    query = select(Asset).where(Asset.deleted_at.is_(None))
    if asset_type:
        query = query.where(Asset.asset_type == AssetType(asset_type))
    if status:
        query = query.where(Asset.status == AssetStatus(status))
    if q:
        like = f"%{q}%"
        query = query.where(or_(Asset.name.ilike(like), Asset.serial_number.ilike(like)))
    result = await session.execute(query.order_by(Asset.created_at.desc()).offset(offset).limit(limit))
    return list(result.scalars().all())


async def get_asset(session: AsyncSession, asset_id: UUID) -> Optional[Asset]:
    result = await session.execute(select(Asset).where(Asset.id == asset_id, Asset.deleted_at.is_(None)))
    return result.scalar_one_or_none()


async def create_asset(session: AsyncSession, payload: AssetCreate, created_by: UUID | None) -> Asset:
    status_value = payload.status or AssetStatus.DISPONÍVEL.value
    asset = Asset(
        asset_type=AssetType(payload.asset_type),
        name=payload.name,
        description=payload.description,
        serial_number=payload.serial_number,
        manufacturer=payload.manufacturer,
        model=payload.model,
        acquisition_date=payload.acquisition_date,
        warranty_until=payload.warranty_until,
        cost=payload.cost,
        location_id=payload.location_id,
        assigned_to_user_id=payload.assigned_to_user_id,
        status=AssetStatus(status_value),
        ip_address=payload.ip_address,
        mac_address=payload.mac_address,
        hostname=payload.hostname,
        host_id=payload.host_id,
        glpi_id=payload.glpi_id,
        created_by_user_id=created_by,
    )
    session.add(asset)
    await session.commit()
    await session.refresh(asset)
    return asset


async def update_asset(session: AsyncSession, asset: Asset, payload: AssetUpdate) -> Asset:
    if payload.description is not None:
        asset.description = payload.description
    if payload.manufacturer is not None:
        asset.manufacturer = payload.manufacturer
    if payload.model is not None:
        asset.model = payload.model
    if payload.warranty_until is not None:
        asset.warranty_until = payload.warranty_until
    if payload.cost is not None:
        asset.cost = payload.cost
    if payload.assigned_to_user_id is not None:
        asset.assigned_to_user_id = payload.assigned_to_user_id
    if payload.status is not None:
        asset.status = AssetStatus(payload.status)
    if payload.ip_address is not None:
        asset.ip_address = payload.ip_address
    if payload.mac_address is not None:
        asset.mac_address = payload.mac_address
    if payload.hostname is not None:
        asset.hostname = payload.hostname

    await session.commit()
    await session.refresh(asset)
    return asset


async def soft_delete_asset(session: AsyncSession, asset: Asset) -> None:
    asset.deleted_at = datetime.utcnow()
    await session.commit()
