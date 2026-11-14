"""Service Catalogue API: Web, App, SEO, Social, Branding, CRM/ERP, EdTech (B-04)."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse
from app.core.audit import log_audit_event
from app.core.database import get_db
from app.db.models.crm import ServiceCatalogue
from app.policies.rbac import AccessScope, require_permission

router = APIRouter(prefix="/services", tags=["Services Catalogue"])


class ServiceItem(BaseModel):
    id: str
    name: str
    code: str
    category: str
    description: str | None = None
    pricing_type: str
    default_price_rupees: float
    currency: str
    hsn_sac_code: str | None = None
    is_active: bool


class CreateServiceRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    code: str = Field(..., min_length=2, max_length=50)
    category: str = Field(..., min_length=2, max_length=100)
    description: str | None = None
    pricing_type: str = "fixed"
    default_price_paise: int = Field(0, ge=0)
    currency: str = "INR"
    hsn_sac_code: str | None = "998314"


class UpdateServiceRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    pricing_type: str | None = None
    default_price_paise: int | None = Field(None, ge=0)
    category: str | None = None
    hsn_sac_code: str | None = None
    is_active: bool | None = None


def _to_service_item(s: ServiceCatalogue) -> ServiceItem:
    return ServiceItem(
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


@router.get("", response_model=ApiResponse[list[ServiceItem]])
def list_services(
    category: str | None = None,
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db),
):
    """List configurable services in the catalogue."""
    query = db.query(ServiceCatalogue).filter(ServiceCatalogue.is_deleted.is_(False))

    if not include_inactive:
        query = query.filter(ServiceCatalogue.is_active.is_(True))

    if category:
        query = query.filter(ServiceCatalogue.category == category)

    services = query.order_by(ServiceCatalogue.category, ServiceCatalogue.name).all()
    items = [_to_service_item(s) for s in services]
    return ApiResponse(success=True, data=items)


@router.get("/{service_id}", response_model=ApiResponse[ServiceItem])
def get_service(
    service_id: str,
    db: Session = Depends(get_db),
):
    """Get single service details by id or unique code."""
    service = (
        db.query(ServiceCatalogue)
        .filter(
            (ServiceCatalogue.id == service_id) | (ServiceCatalogue.code == service_id),
            ServiceCatalogue.is_deleted.is_(False),
        )
        .first()
    )
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found.")

    return ApiResponse(success=True, data=_to_service_item(service))


@router.post("", response_model=ApiResponse[ServiceItem])
def create_service(
    payload: CreateServiceRequest,
    scope: AccessScope = Depends(require_permission("services.read")),
    db: Session = Depends(get_db),
):
    """Create a new service offering in the catalogue."""
    # Enforce unique code
    existing = db.query(ServiceCatalogue).filter_by(code=payload.code.strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Service with code '{payload.code}' already exists.",
        )

    service = ServiceCatalogue(
        name=payload.name.strip(),
        code=payload.code.strip().upper(),
        category=payload.category.strip().lower(),
        description=payload.description,
        pricing_type=payload.pricing_type,
        default_price_paise=payload.default_price_paise,
        currency=payload.currency,
        hsn_sac_code=payload.hsn_sac_code,
        is_active=True,
    )
    db.add(service)
    db.flush()

    log_audit_event(
        db=db,
        action="service.create",
        resource_type="service",
        resource_id=service.id,
        user=scope.user,
        new_values={"name": service.name, "code": service.code},
    )
    db.commit()
    db.refresh(service)

    return ApiResponse(
        success=True, data=_to_service_item(service), message="Service offering created."
    )


@router.patch("/{service_id}", response_model=ApiResponse[ServiceItem])
def update_service(
    service_id: str,
    payload: UpdateServiceRequest,
    scope: AccessScope = Depends(require_permission("services.read")),
    db: Session = Depends(get_db),
):
    """Update service attributes, pricing, or status."""
    service = db.query(ServiceCatalogue).filter_by(id=service_id, is_deleted=False).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found.")

    old_values = {
        "name": service.name,
        "default_price_paise": service.default_price_paise,
        "is_active": service.is_active,
    }

    if payload.name is not None:
        service.name = payload.name.strip()
    if payload.description is not None:
        service.description = payload.description
    if payload.pricing_type is not None:
        service.pricing_type = payload.pricing_type
    if payload.default_price_paise is not None:
        service.default_price_paise = payload.default_price_paise
    if payload.category is not None:
        service.category = payload.category.strip().lower()
    if payload.hsn_sac_code is not None:
        service.hsn_sac_code = payload.hsn_sac_code
    if payload.is_active is not None:
        service.is_active = payload.is_active

    log_audit_event(
        db=db,
        action="service.update",
        resource_type="service",
        resource_id=service.id,
        user=scope.user,
        old_values=old_values,
        new_values={"name": service.name, "is_active": service.is_active},
    )
    db.commit()
    db.refresh(service)

    return ApiResponse(success=True, data=_to_service_item(service), message="Service updated.")


@router.delete("/{service_id}", response_model=ApiResponse[bool])
def delete_service(
    service_id: str,
    scope: AccessScope = Depends(require_permission("services.read")),
    db: Session = Depends(get_db),
):
    """Soft delete service offering."""
    service = db.query(ServiceCatalogue).filter_by(id=service_id, is_deleted=False).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found.")

    service.is_deleted = True
    service.deleted_at = datetime.now(UTC)

    log_audit_event(
        db=db,
        action="service.delete",
        resource_type="service",
        resource_id=service.id,
        user=scope.user,
        old_values={"name": service.name, "code": service.code},
    )
    db.commit()

    return ApiResponse(success=True, data=True, message="Service offering archived.")
