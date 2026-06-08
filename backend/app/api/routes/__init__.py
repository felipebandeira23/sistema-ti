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

__all__ = ["api_router"]
