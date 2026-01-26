"""
Tasks assíncronas do Celery
"""
from app.tasks.celery_app import celery_app
from app.tasks.sla_tasks import check_sla_status
from app.tasks.ticket_tasks import auto_close_inactive_tickets
from app.tasks.ldap_tasks import sync_users_from_ldap

__all__ = [
    "celery_app",
    "check_sla_status",
    "auto_close_inactive_tickets",
    "sync_users_from_ldap",
]
