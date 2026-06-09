from fastapi import APIRouter

from app.api.routes import (
	auth,
	users,
	assets,
	tickets,
	service_catalog,
	sla,
	knowledge,
	approvals,
	cmdb,
    dashboard,
    problems,
    changes,
    ai_search,
    reports,
    notifications,
    announcements,
    licensing,
    audit,
    integrations,
)


api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(assets.router)
api_router.include_router(tickets.router)
api_router.include_router(service_catalog.router)
api_router.include_router(sla.router)
api_router.include_router(knowledge.router)
api_router.include_router(approvals.router)
api_router.include_router(cmdb.router)
api_router.include_router(dashboard.router)
api_router.include_router(problems.router)
api_router.include_router(changes.router)
api_router.include_router(ai_search.router)
api_router.include_router(reports.router)
api_router.include_router(notifications.router)
api_router.include_router(announcements.router)
api_router.include_router(licensing.router)
api_router.include_router(audit.router)
api_router.include_router(integrations.router)

__all__ = ["api_router"]
