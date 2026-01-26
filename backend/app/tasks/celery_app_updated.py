from celery import Celery

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
    # Verifica status de SLA a cada 5 minutos
    "check_sla_status_every_5min": {
        "task": "check_sla_status",
        "schedule": 300.0,  # 5 minutos
    },
    # Fecha tickets inativos diariamente às 2h
    "auto_close_inactive_tickets_daily": {
        "task": "auto_close_inactive_tickets",
        "schedule": {"type": "crontab", "minute": 0, "hour": 2},
        "kwargs": {"days_inactive": 30}
    },
    # Sincroniza usuários LDAP diariamente às 3h
    "sync_users_from_ldap_daily": {
        "task": "sync_users_from_ldap",
        "schedule": {"type": "crontab", "minute": 0, "hour": 3},
    },
}

# Importa tasks para registro
from app.tasks.sla_tasks import check_sla_status
from app.tasks.ticket_tasks import auto_close_inactive_tickets
from app.tasks.ldap_tasks import sync_users_from_ldap
