"""Service Catalogue API: Web, App, SEO, Social, Branding, CRM/ERP, EdTech."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.policies.rbac import require_permission, AccessScope
from app.api.schemas import ApiResponse
from app.db.models.crm import ServiceCatalogue

router = APIRouter(prefix="/services", tags=["Services Catalogue"])


class ServiceItem(BaseModel):
    id: str
    name: str
    code: str
    category: str
    description: Optional[str] = None
    pricing_type: str
    default_price_rupees: float
    currency: str
    hsn_sac_code: Optional[str] = None
    is_active: bool


@router.get("", response_model=ApiResponse[List[ServiceItem]])
def list_services(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List configurable services in the catalogue."""
    query = db.query(ServiceCatalogue).filter(ServiceCatalogue.is_deleted == False, ServiceCatalogue.is_active == True)
    if category:
        query = query.filter(ServiceCatalogue.category == category)

    services = query.order_by(ServiceCatalogue.category, ServiceCatalogue.name).all()
    items = [
        ServiceItem(
            id=s.id,
            name=s.name,
            code=s.code,
            category=s.category,
            description=s.description,
            pricing_type=s.pricing_type,
            default_price_rupees=round(s.default_price_paise / 100.0, 2),
            currency=s.currency,
            hsn_sac_code=s.hsn_sac_code,
            is_active=s.is_active,
        )
        for s in services
    ]
    return ApiResponse(success=True, data=items)
