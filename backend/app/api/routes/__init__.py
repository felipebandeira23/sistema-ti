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

__all__ = ["api_router"]
