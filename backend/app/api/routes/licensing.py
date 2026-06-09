from datetime import datetime, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import get_current_active_user, require_roles
from app.models.user import User
from app.models.licensing import License, MaintenanceContract

router = APIRouter(prefix="/licensing", tags=["licensing"])

class LicenseCreate(BaseModel):
    software_name: str
    version: str | None = None
    license_key: str | None = None
    quantity: int = 1
    issued_date: datetime
    expiry_date: datetime
    vendor: str | None = None
    cost: float | None = None

class LicenseUpdate(BaseModel):
    software_name: str | None = None
    version: str | None = None
    quantity: int | None = None
    expiry_date: datetime | None = None
    vendor: str | None = None
    cost: float | None = None

class ContractCreate(BaseModel):
    asset_id: str  # UUID as string
    vendor: str
    contract_number: str
    start_date: datetime
    end_date: datetime
    cost: float | None = None
    coverage: str | None = None

class ContractUpdate(BaseModel):
    vendor: str | None = None
    contract_number: str | None = None
    end_date: datetime | None = None
    cost: float | None = None
    coverage: str | None = None

def license_to_dict(lic: License) -> dict:
    days_left = (lic.expiry_date - datetime.utcnow()).days if lic.expiry_date else None
    if days_left is None:
        status_label = "unknown"
    elif days_left < 0:
        status_label = "expired"
    elif days_left <= 30:
        status_label = "critical"
    elif days_left <= 60:
        status_label = "warning"
    else:
        status_label = "ok"
    return {
        "id": str(lic.id),
        "software_name": lic.software_name,
        "version": lic.version,
        "quantity": lic.quantity,
        "issued_date": lic.issued_date.isoformat() if lic.issued_date else None,
        "expiry_date": lic.expiry_date.isoformat() if lic.expiry_date else None,
        "vendor": lic.vendor,
        "cost": lic.cost,
        "days_left": days_left,
        "expiry_status": status_label,
        "created_at": lic.created_at.isoformat() if lic.created_at else None,
    }

def contract_to_dict(c: MaintenanceContract) -> dict:
    return {
        "id": str(c.id),
        "asset_id": str(c.asset_id),
        "vendor": c.vendor,
        "contract_number": c.contract_number,
        "start_date": c.start_date.isoformat() if c.start_date else None,
        "end_date": c.end_date.isoformat() if c.end_date else None,
        "cost": c.cost,
        "coverage": c.coverage,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }

@router.get("/licenses/")
async def list_licenses(
    expiring_in: int | None = Query(None, description="Filter licenses expiring within N days"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    query = select(License).order_by(License.expiry_date.asc())
    if expiring_in is not None:
        cutoff = datetime.utcnow() + timedelta(days=expiring_in)
        query = query.where(License.expiry_date <= cutoff)
    result = await session.execute(query)
    return [license_to_dict(l) for l in result.scalars().all()]

@router.post("/licenses/", status_code=201)
async def create_license(
    payload: LicenseCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    lic = License(**payload.model_dump())
    session.add(lic)
    await session.commit()
    await session.refresh(lic)
    return license_to_dict(lic)

@router.patch("/licenses/{license_id}")
async def update_license(
    license_id: UUID,
    payload: LicenseUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    result = await session.execute(select(License).where(License.id == license_id))
    lic = result.scalar_one_or_none()
    if not lic:
        raise HTTPException(status_code=404, detail="Licença não encontrada")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(lic, field, value)
    lic.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(lic)
    return license_to_dict(lic)

@router.get("/contracts/")
async def list_contracts(
    asset_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    import uuid as _uuid
    query = select(MaintenanceContract).order_by(MaintenanceContract.end_date.asc())
    if asset_id:
        query = query.where(MaintenanceContract.asset_id == _uuid.UUID(asset_id))
    result = await session.execute(query)
    return [contract_to_dict(c) for c in result.scalars().all()]

@router.post("/contracts/", status_code=201)
async def create_contract(
    payload: ContractCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    import uuid as _uuid
    contract = MaintenanceContract(
        asset_id=_uuid.UUID(payload.asset_id),
        vendor=payload.vendor,
        contract_number=payload.contract_number,
        start_date=payload.start_date,
        end_date=payload.end_date,
        cost=payload.cost,
        coverage=payload.coverage,
    )
    session.add(contract)
    await session.commit()
    await session.refresh(contract)
    return contract_to_dict(contract)

@router.patch("/contracts/{contract_id}")
async def update_contract(
    contract_id: UUID,
    payload: ContractUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    result = await session.execute(select(MaintenanceContract).where(MaintenanceContract.id == contract_id))
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(contract, field, value)
    contract.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(contract)
    return contract_to_dict(contract)
