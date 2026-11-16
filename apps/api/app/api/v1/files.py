"""File asset management and storage API with MIME validation and scoped RBAC."""

import contextlib
import os
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    Response,
    UploadFile,
    status,
)
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.audit import log_audit_event
from app.core.database import get_db
from app.core.storage import get_storage_service
from app.db.models.auth import User
from app.db.models.common import FileAsset
from app.db.models.crm import ClientContact, Contract, Proposal
from app.db.models.finance import Invoice
from app.db.models.projects import Deliverable, Project
from app.db.models.support import SupportTicket

router = APIRouter(prefix="/files", tags=["Files & Storage"])

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
    "application/zip",
    "application/x-zip-compressed",
}

DANGEROUS_EXTENSIONS = {
    ".exe",
    ".bat",
    ".cmd",
    ".sh",
    ".php",
    ".py",
    ".pl",
    ".cgi",
    ".jar",
    ".war",
    ".msi",
    ".dll",
    ".so",
    ".dylib",
    ".vbs",
    ".ps1",
    ".com",
    ".scr",
    ".pif",
}

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


class FileAssetResponse(BaseModel):
    id: str
    original_filename: str
    mime_type: str
    size_bytes: int
    uploaded_by_id: str
    entity_type: str | None = None
    entity_id: str | None = None
    version: int = 1
    url: str | None = None


def check_file_access(db: Session, file_asset: FileAsset, user: User) -> bool:
    """Verify scoped permissions for file asset. Internal staff have full visibility;

    portal users can only access assets attached to their own company or uploaded by them.
    """
    # Internal agency staff
    if user.is_super_admin or user.user_type != "client":
        return True

    # User uploaded the file directly
    if file_asset.uploaded_by_id == user.id:
        return True

    contact = db.query(ClientContact).filter_by(user_id=user.id).first()
    client_id = contact.client_id if contact else getattr(user, "client_id", None)
    if not client_id:
        return False

    # Scoped checking based on entity
    if not file_asset.entity_type or not file_asset.entity_id:
        return False

    etype = file_asset.entity_type.lower()
    eid = file_asset.entity_id

    if etype == "client":
        return eid == client_id

    if etype == "project":
        project = db.get(Project, eid)
        return project is not None and project.client_id == client_id

    if etype == "deliverable":
        deliverable = db.get(Deliverable, eid)
        if deliverable and deliverable.project_id:
            project = db.get(Project, deliverable.project_id)
            return project is not None and project.client_id == client_id
        return False

    if etype in ("support", "ticket", "support_ticket"):
        ticket = db.get(SupportTicket, eid)
        return ticket is not None and ticket.client_id == client_id

    if etype == "invoice":
        invoice = db.get(Invoice, eid)
        return invoice is not None and invoice.client_id == client_id

    if etype in ("contract", "agreement"):
        contract = db.get(Contract, eid)
        return contract is not None and contract.client_id == client_id

    if etype == "proposal":
        proposal = db.get(Proposal, eid)
        if proposal and proposal.lead_id:
            return False  # Leads belong to agency sales pipeline
        return False

    return False


@router.post("/upload", response_model=dict[str, Any], status_code=status.HTTP_201_CREATED)
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    entity_type: str | None = Form(None),
    entity_id: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Upload a file asset with MIME validation, size limits, and storage persistence."""
    filename = file.filename or "upload.bin"
    ext = os.path.splitext(filename)[1].lower()

    if ext in DANGEROUS_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Files with extension '{ext}' are prohibited for security reasons.",
        )

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Disallowed MIME type '{content_type}'. Supported formats: Images (JPEG/PNG/WebP/SVG), Documents (PDF/Word/Excel/CSV/Text), Archives (ZIP).",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.",
        )

    # If entity scoping is provided for client user, verify ownership
    if (
        current_user.user_type == "client" or getattr(current_user, "client_id", None)
    ) and entity_type:
        dummy_asset = FileAsset(
            storage_key="temp",
            original_filename=filename,
            mime_type=content_type,
            size_bytes=len(content),
            uploaded_by_id=current_user.id,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        if not check_file_access(db, dummy_asset, current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot attach files to an entity outside your organization.",
            )

    storage = get_storage_service()
    storage_key = storage.save(content, filename, content_type)

    file_asset = FileAsset(
        storage_key=storage_key,
        original_filename=filename,
        mime_type=content_type,
        size_bytes=len(content),
        uploaded_by_id=current_user.id,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    db.add(file_asset)
    db.commit()
    db.refresh(file_asset)

    log_audit_event(
        db=db,
        action="upload",
        resource_type="file_asset",
        resource_id=file_asset.id,
        user=current_user,
        new_values={
            "filename": filename,
            "mime_type": content_type,
            "size_bytes": len(content),
            "storage_key": storage_key,
        },
        request=request,
    )

    access_url = storage.get_url(storage_key)

    return {
        "success": True,
        "data": {
            "id": file_asset.id,
            "storage_key": file_asset.storage_key,
            "original_filename": file_asset.original_filename,
            "mime_type": file_asset.mime_type,
            "size_bytes": file_asset.size_bytes,
            "uploaded_by_id": file_asset.uploaded_by_id,
            "entity_type": file_asset.entity_type,
            "entity_id": file_asset.entity_id,
            "version": file_asset.version,
            "url": access_url,
        },
    }


@router.get("/{file_id}", response_model=dict[str, Any])
def get_file_metadata(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Retrieve file asset metadata with access control validation."""
    file_asset = db.get(FileAsset, file_id)
    if not file_asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File asset '{file_id}' not found.",
        )

    if not check_file_access(db, file_asset, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this file asset.",
        )

    storage = get_storage_service()
    access_url = storage.get_url(file_asset.storage_key)

    return {
        "success": True,
        "data": {
            "id": file_asset.id,
            "storage_key": file_asset.storage_key,
            "original_filename": file_asset.original_filename,
            "mime_type": file_asset.mime_type,
            "size_bytes": file_asset.size_bytes,
            "uploaded_by_id": file_asset.uploaded_by_id,
            "entity_type": file_asset.entity_type,
            "entity_id": file_asset.entity_id,
            "version": file_asset.version,
            "url": access_url,
        },
    }


@router.get("/{file_id}/url", response_model=dict[str, Any])
def get_file_url(
    file_id: str,
    expires_in: int = 3600,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Retrieve signed or resolved access URL for file asset."""
    file_asset = db.get(FileAsset, file_id)
    if not file_asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File asset '{file_id}' not found.",
        )

    if not check_file_access(db, file_asset, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this file asset.",
        )

    storage = get_storage_service()
    access_url = storage.get_url(file_asset.storage_key, expires_in=expires_in)

    return {
        "success": True,
        "data": {
            "url": access_url,
            "storage_key": file_asset.storage_key,
            "original_filename": file_asset.original_filename,
            "mime_type": file_asset.mime_type,
            "expires_in": expires_in,
        },
    }


@router.get("/download/{storage_key}")
def download_file(
    storage_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """Download file content directly via streaming response."""
    file_asset = db.scalar(select(FileAsset).where(FileAsset.storage_key == storage_key))
    if not file_asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File asset not found.",
        )

    if not check_file_access(db, file_asset, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this file asset.",
        )

    storage = get_storage_service()
    try:
        data = storage.read(storage_key)
    except FileNotFoundError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Underlying file missing from storage.",
        ) from err

    return Response(
        content=data,
        media_type=file_asset.mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{file_asset.original_filename}"',
            "Content-Length": str(len(data)),
        },
    )


@router.delete("/{file_id}", response_model=dict[str, Any])
def delete_file(
    file_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Delete file asset from storage and database."""
    file_asset = db.get(FileAsset, file_id)
    if not file_asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File asset '{file_id}' not found.",
        )

    # Only super admin or owner can delete
    is_owner = file_asset.uploaded_by_id == current_user.id
    is_admin = current_user.is_super_admin or current_user.user_type != "client"
    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this file asset.",
        )

    storage = get_storage_service()
    with contextlib.suppress(Exception):
        storage.delete(file_asset.storage_key)

    log_audit_event(
        db=db,
        action="delete",
        resource_type="file_asset",
        resource_id=file_asset.id,
        user=current_user,
        old_values={
            "filename": file_asset.original_filename,
            "storage_key": file_asset.storage_key,
        },
        request=request,
    )

    db.delete(file_asset)
    db.commit()

    return {"success": True, "data": {"deleted": True, "id": file_id}}
