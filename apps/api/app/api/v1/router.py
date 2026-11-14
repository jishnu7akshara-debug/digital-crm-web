"""Master API v1 Router."""

from fastapi import APIRouter

from app.api.v1.agreements import router as agreements_router
from app.api.v1.attendance import router as attendance_router
from app.api.v1.auth import router as auth_router
from app.api.v1.clients import router as clients_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.invoices import router as invoices_router
from app.api.v1.leads import router as leads_router
from app.api.v1.projects import router as projects_router
from app.api.v1.proposals import router as proposals_router
from app.api.v1.reports import router as reports_router
from app.api.v1.roles import router as roles_router
from app.api.v1.services import router as services_router
from app.api.v1.support import router as support_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.team import router as team_router

api_v1_router = APIRouter(prefix="/v1")


@api_v1_router.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint for Vercel and uptime monitoring."""
    return {"status": "ok", "service": "Digital Footprint OS API", "version": "1.0.0"}


api_v1_router.include_router(auth_router)
api_v1_router.include_router(dashboard_router)
api_v1_router.include_router(roles_router)
api_v1_router.include_router(clients_router)
api_v1_router.include_router(projects_router)
api_v1_router.include_router(proposals_router)
api_v1_router.include_router(leads_router)
api_v1_router.include_router(invoices_router)
api_v1_router.include_router(services_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(tasks_router)
api_v1_router.include_router(team_router)
api_v1_router.include_router(support_router)
api_v1_router.include_router(attendance_router)
api_v1_router.include_router(agreements_router)
