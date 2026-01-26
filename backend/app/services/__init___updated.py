"""
Exportação de todos os serviços
"""

# Auth
from app.services.auth_service import authenticate_user, create_access_token

# Users
from app.services.user_service import (
    list_users,
    get_user,
    create_user,
    update_user,
    delete_user,
)

# Tickets
from app.services.ticket_service import (
    list_tickets,
    get_ticket,
    create_ticket,
    update_ticket_status,
)

# SLA
from app.services.sla_service import (
    list_slas,
    get_sla,
    create_sla,
    update_sla,
    delete_sla,
    recalculate_sla_status,
    add_business_hours,
    get_calendar,
)

# Assets
from app.services.asset_service import (
    list_assets,
    get_asset,
    create_asset,
    update_asset,
    delete_asset,
)

# Knowledge Base
from app.services.knowledge_service import (
    list_kb_categories,
    get_kb_category,
    create_kb_category,
    update_kb_category,
    list_articles,
    get_article,
    create_article,
    update_article,
    add_feedback,
)

# Service Catalog
from app.services.service_catalog_service import (
    list_categories,
    get_category,
    create_category,
    update_category,
    list_items,
    get_item,
    create_item,
    update_item,
    create_service_request,
)

# Approvals
from app.services.approval_service import (
    list_approvals,
    get_approval,
    create_approval,
    add_decision,
)

# CMDB
from app.services.cmdb_service import (
    list_cis,
    get_ci,
    create_ci,
    update_ci,
    delete_ci,
    create_relationship,
)

# Dashboard
from app.services.dashboard_service import get_dashboard_summary

# Email
from app.services.email_service import email_service, EmailTemplates

# Notifications
from app.services.notification_service import (
    create_ticket_with_notification,
    update_ticket_status_with_notification,
    assign_ticket_with_notification,
)

# Approval Notifications
from app.services.approval_notification_service import (
    add_decision_with_notification,
    create_approval_with_notification,
)

# GLPI
from app.services.glpi_service import glpi_service

# Reports
from app.services.report_service import report_service

__all__ = [
    # Auth
    "authenticate_user",
    "create_access_token",
    # Users
    "list_users",
    "get_user",
    "create_user",
    "update_user",
    "delete_user",
    # Tickets
    "list_tickets",
    "get_ticket",
    "create_ticket",
    "update_ticket_status",
    # SLA
    "list_slas",
    "get_sla",
    "create_sla",
    "update_sla",
    "delete_sla",
    "recalculate_sla_status",
    "add_business_hours",
    "get_calendar",
    # Assets
    "list_assets",
    "get_asset",
    "create_asset",
    "update_asset",
    "delete_asset",
    # Knowledge Base
    "list_kb_categories",
    "get_kb_category",
    "create_kb_category",
    "update_kb_category",
    "list_articles",
    "get_article",
    "create_article",
    "update_article",
    "add_feedback",
    # Service Catalog
    "list_categories",
    "get_category",
    "create_category",
    "update_category",
    "list_items",
    "get_item",
    "create_item",
    "update_item",
    "create_service_request",
    # Approvals
    "list_approvals",
    "get_approval",
    "create_approval",
    "add_decision",
    # CMDB
    "list_cis",
    "get_ci",
    "create_ci",
    "update_ci",
    "delete_ci",
    "create_relationship",
    # Dashboard
    "get_dashboard_summary",
    # Email
    "email_service",
    "EmailTemplates",
    # Notifications
    "create_ticket_with_notification",
    "update_ticket_status_with_notification",
    "assign_ticket_with_notification",
    # Approval Notifications
    "add_decision_with_notification",
    "create_approval_with_notification",
    # GLPI
    "glpi_service",
    # Reports
    "report_service",
]
