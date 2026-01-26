"""Serviços para CMDB (Configuration Items)."""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cmdb import ConfigurationItem, CIStatus, CIType, CIRelationship, RelationshipType
from app.schemas.cmdb import CICreate, CIUpdate, CIRelationshipCreate


async def list_cis(session: AsyncSession, limit: int = 100, offset: int = 0) -> list[ConfigurationItem]:
    result = await session.execute(select(ConfigurationItem).offset(offset).limit(limit))
    return list(result.scalars().all())


async def get_ci(session: AsyncSession, ci_id: UUID) -> Optional[ConfigurationItem]:
    result = await session.execute(select(ConfigurationItem).where(ConfigurationItem.id == ci_id))
    return result.scalar_one_or_none()


async def create_ci(session: AsyncSession, payload: CICreate) -> ConfigurationItem:
    ci = ConfigurationItem(
        name=payload.name,
        description=payload.description,
        ci_type=CIType(payload.ci_type),
        status=CIStatus(payload.status) if payload.status else CIStatus.ATIVO,
        owner_id=payload.owner_id,
        criticality=payload.criticality,
        impact_level=payload.impact_level,
        asset_id=payload.asset_id,
        attributes=payload.attributes,
    )
    session.add(ci)
    await session.commit()
    await session.refresh(ci)
    return ci


async def update_ci(session: AsyncSession, ci: ConfigurationItem, payload: CIUpdate) -> ConfigurationItem:
    if payload.name is not None:
        ci.name = payload.name
    if payload.description is not None:
        ci.description = payload.description
    if payload.status is not None:
        ci.status = CIStatus(payload.status)
    if payload.owner_id is not None:
        ci.owner_id = payload.owner_id
    if payload.criticality is not None:
        ci.criticality = payload.criticality
    if payload.impact_level is not None:
        ci.impact_level = payload.impact_level
    if payload.asset_id is not None:
        ci.asset_id = payload.asset_id
    if payload.attributes is not None:
        ci.attributes = payload.attributes
    await session.commit()
    await session.refresh(ci)
    return ci


async def create_relationship(session: AsyncSession, payload: CIRelationshipCreate) -> CIRelationship:
    rel = CIRelationship(
        source_ci_id=payload.source_ci_id,
        target_ci_id=payload.target_ci_id,
        relationship_type=RelationshipType(payload.relationship_type),
        impact_propagation=payload.impact_propagation,
    )
    session.add(rel)
    await session.commit()
    await session.refresh(rel)
    return rel
