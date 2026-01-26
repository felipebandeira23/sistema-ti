from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "itsm_tasks",
    broker="redis://localhost:6379/1",
    backend="redis://localhost:6379/2",
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
)

celery_app.conf.beat_schedule = {
    # Recalcular status de SLA a cada 5 minutos
    "check_sla_status_every_5min": {
        "task": "check_sla_status",
        "schedule": 300.0,
    },
    # Exemplos futuros (comentados até implementação):
    # "sync_users_from_ldap_daily": {
    #     "task": "sync_users_from_ldap",
    #     "schedule": {"type": "crontab", "minute": 0, "hour": 2},
    # },
    # "auto_close_inactive_tickets_daily": {
    #     "task": "auto_close_inactive_tickets",
    #     "schedule": {"type": "crontab", "minute": 0, "hour": 1},
    # },
}

# Tarefas serão registradas aqui:
# - sync_users_from_ldap (diária 02:00)
# - sync_glpi_assets (diária 02:00)
# - send_notifications (conforme geradas)
# - auto_close_inactive_tickets (diária 01:00)
# - escalate_expired_approvals (a cada 15 min)
