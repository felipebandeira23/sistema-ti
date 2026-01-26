import asyncio
from datetime import datetime, time
import uuid
import pytest

from app.services.sla_service import add_business_hours

class StubCalendar:
    def __init__(self):
        self.work_days = ["MON", "TUE", "WED", "THU", "FRI"]
        self.work_hours_start = time(8, 0)
        self.work_hours_end = time(18, 0)

class StubSession:
    def __init__(self, holidays=None, calendar=None):
        self._holidays = holidays or []
        self._calendar = calendar or StubCalendar()
    async def execute(self, _):
        class R:
            def scalars(self):
                class S:
                    def all(self_inner):
                        return self._holidays
                return S()
        return R()

@pytest.mark.asyncio
async def test_add_business_hours_basic(monkeypatch):
    cal_id = uuid.uuid4()
    start = datetime(2026, 1, 23, 16, 0)  # Sexta 16:00
    session = StubSession(holidays=[])

    async def fake_get_calendar(sess, cid):
        assert cid == cal_id
        return sess._calendar

    from app.services import sla_service as svc
    monkeypatch.setattr(svc, "get_calendar", fake_get_calendar)

    # Adiciona 4 horas úteis: sexta 16:00 + 2h (até 18:00) e +2h na segunda (08:00->10:00)
    target = await add_business_hours(session, cal_id, start, 4)
    assert target == datetime(2026, 1, 26, 10, 0)

@pytest.mark.asyncio
async def test_add_business_hours_with_holiday(monkeypatch):
    cal_id = uuid.uuid4()
    start = datetime(2026, 1, 23, 16, 0)
    # Segunda é feriado
    class HolidayDate:
        def __init__(self, dt):
            self._dt = dt
        def date(self):
            return self._dt
    holidays = [HolidayDate(datetime(2026, 1, 26))]
    session = StubSession(holidays=holidays)

    async def fake_get_calendar(sess, cid):
        return sess._calendar

    from app.services import sla_service as svc
    monkeypatch.setattr(svc, "get_calendar", fake_get_calendar)

    # 4h úteis: sexta 16-18 (2h), pula segunda (feriado), retoma terça 08-10 (2h)
    target = await add_business_hours(session, cal_id, start, 4)
    assert target == datetime(2026, 1, 27, 10, 0)
