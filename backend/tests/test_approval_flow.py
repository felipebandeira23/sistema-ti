import asyncio
import uuid
from datetime import datetime
import pytest

from app.services.approval_service import add_decision

class Obj:
    def __init__(self, **kw):
        self.__dict__.update(kw)

class StubSession:
    def __init__(self):
        self._store = {}
    async def execute(self, *_args, **_kwargs):
        class R:
            def scalar(self_inner):
                return 1  # simula 1 aprovado
        return R()
    async def get(self, _model, _id):
        # retorna ticket simplificado
        return Obj(status="NOVO", sla_status="OK")
    async def commit(self):
        pass
    async def refresh(self, _):
        pass
    async def add(self, _):
        pass
    async def flush(self):
        pass

@pytest.mark.asyncio
async def test_approval_quorum_creates_next_level(monkeypatch):
    session = StubSession()
    approval = Obj(id=uuid.uuid4(), ticket_id=uuid.uuid4(), level=1, required_approver_count=1, status="PENDENTE")
    payload = Obj(decision="APROVADO", comment=None)

    # monkeypatch ServiceRequest/ServiceCatalogItem lookup
    async def fake_select(*_args, **_kwargs):
        class R:
            def scalars(self_inner):
                class S:
                    def first(self_inn):
                        return Obj(service_item_id=uuid.uuid4())
                return S()
        return R()

    async def fake_session_get(_model, _id):
        if getattr(_model, "__name__", "") == "ServiceCatalogItem":
            return Obj(approval_levels=2)
        return Obj(status="NOVO", sla_status="OK")

    from app.services import approval_service as svc
    monkeypatch.setattr(svc, "select", fake_select)
    monkeypatch.setattr(session, "get", fake_session_get)

    decision = await add_decision(session, approval, uuid.uuid4(), payload)
    assert approval.status == "APROVADO"

@pytest.mark.asyncio
async def test_approval_reject_cancels_ticket():
    session = StubSession()
    approval = Obj(id=uuid.uuid4(), ticket_id=uuid.uuid4(), level=1, required_approver_count=2, status="PENDENTE")
    payload = Obj(decision="REJEITADO", comment="")

    decision = await add_decision(session, approval, uuid.uuid4(), payload)
    assert approval.status == "REJEITADO"
