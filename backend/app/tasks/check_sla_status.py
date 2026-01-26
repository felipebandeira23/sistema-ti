from app.tasks.celery_app import celery_app
from app.core.database import async_session_factory
from app.services.sla_service import recalculate_sla_status


@celery_app.task(name="check_sla_status")
def check_sla_status_task() -> int:
    """Tarefa Celery para recalcular status de SLA dos tickets.
    Retorna o número de tickets atualizados.
    """
    async def _run() -> int:
        async with async_session_factory() as session:
            return await recalculate_sla_status(session)

    import asyncio
    return asyncio.get_event_loop().run_until_complete(_run())
