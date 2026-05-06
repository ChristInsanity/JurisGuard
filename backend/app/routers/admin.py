from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.audit import append_audit
from app.auth import require_roles
from app.database import get_db
from app.models import ApprovalStatus, User, UserRole
from app.repositories import users as user_repo
from app.schemas import AdminUserDetails, AdminUserListItem, ApprovalUpdate
from app.services import users as user_service

router = APIRouter(prefix="/admin", tags=["admin"])


def client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


@router.get("/verification", response_model=list[AdminUserListItem])
def list_applicants(
    approval_status: ApprovalStatus | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin)),
):
    rows = user_repo.list_users(db, approval_status=approval_status, role=UserRole.user)
    return [user_service.user_to_admin_list_item(row) for row in rows]


@router.get("/users/{user_id}", response_model=AdminUserDetails)
def get_applicant(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin)),
):
    row = user_repo.get_user_by_id(db, user_id)
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return user_service.user_to_admin_details(row)


@router.patch("/users/{user_id}/approval", response_model=AdminUserDetails)
def update_applicant_approval(
    user_id: int,
    body: ApprovalUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.admin)),
):
    row = user_repo.get_user_by_id(db, user_id)
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    if row.user_id == admin.user_id and body.approval_status != ApprovalStatus.approved:
        raise HTTPException(status_code=400, detail="Admin cannot restrict their own account")

    updated = user_service.update_approval_status(
        db,
        user=row,
        approval_status=body.approval_status,
    )
    append_audit(
        db,
        user_id=admin.user_id,
        action=f"user.{body.approval_status.value}",
        module="admin",
        entity_type="user",
        entity_id=str(updated.user_id),
        metadata={"approval_status": body.approval_status.value},
        ip_address=client_ip(request),
    )
    return user_service.user_to_admin_details(updated)
