from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth import hash_password, verify_password
from app.models import ApprovalStatus, User, UserDetails, UserRole
from app.repositories import users as user_repo
from app.schemas import AdminUserDetails, AdminUserListItem, UserCreate, UserOut, UserProfileOut


LOGIN_STATUS_MESSAGES = {
    ApprovalStatus.pending: "Account waiting for approval.",
    ApprovalStatus.under_review: "Application under review.",
    ApprovalStatus.rejected: "Application rejected.",
    ApprovalStatus.suspended: "Account suspended.",
}


def split_full_name(full_name: str | None) -> tuple[str | None, str | None]:
    if not full_name:
        return None, None
    parts = [part for part in full_name.strip().split(" ") if part]
    if not parts:
        return None, None
    if len(parts) == 1:
        return parts[0], None
    return " ".join(parts[:-1]), parts[-1]


def create_registered_user(db: Session, body: UserCreate) -> User:
    if user_repo.get_user_by_email(db, str(body.email)):
        raise HTTPException(status_code=400, detail="Email already registered")

    first_name = body.first_name
    last_name = body.last_name
    if body.full_name and not (first_name or last_name):
        first_name, last_name = split_full_name(body.full_name)

    user = User(
        email=str(body.email),
        password_hash=hash_password(body.password),
        role=UserRole.user,
        approval_status=ApprovalStatus.pending,
        is_active=True,
    )
    user.details = UserDetails(
        first_name=first_name,
        middle_name=body.middle_name,
        last_name=last_name,
        suffix=body.suffix,
        mobile_number=body.mobile_number,
        address=body.address,
        sex=body.sex,
        birth_date=body.birth_date,
        profile_completed=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, *, email: str, password: str) -> User:
    user = user_repo.get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.is_active and user.approval_status != ApprovalStatus.suspended:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended.")

    if user.approval_status != ApprovalStatus.approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=LOGIN_STATUS_MESSAGES[user.approval_status],
        )

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user


def update_approval_status(db: Session, *, user: User, approval_status: ApprovalStatus) -> User:
    user.approval_status = approval_status
    user.is_active = approval_status != ApprovalStatus.suspended
    db.commit()
    db.refresh(user)
    return user


def user_to_profile_out(details: UserDetails | None) -> UserProfileOut:
    if not details:
        return UserProfileOut(full_name="", profile_completed=False)
    return UserProfileOut(
        full_name=details.full_name,
        first_name=details.first_name,
        middle_name=details.middle_name,
        last_name=details.last_name,
        suffix=details.suffix,
        mobile_number=details.mobile_number,
        address=details.address,
        sex=details.sex,
        birth_date=details.birth_date,
        profile_picture_path=details.profile_picture_path,
        profile_completed=details.profile_completed,
    )


def user_to_auth_out(user: User) -> UserOut:
    profile = user_to_profile_out(user.details)
    return UserOut(
        user_id=user.user_id,
        email=user.email,
        role=user.role,
        approval_status=user.approval_status,
        full_name=profile.full_name,
        profile_picture_path=profile.profile_picture_path,
        profile_completed=profile.profile_completed,
    )


def user_to_admin_list_item(user: User) -> AdminUserListItem:
    auth = user_to_auth_out(user)
    return AdminUserListItem(
        user_id=auth.user_id,
        email=auth.email,
        role=auth.role,
        approval_status=auth.approval_status,
        is_active=user.is_active,
        full_name=auth.full_name,
        profile_picture_path=auth.profile_picture_path,
        profile_completed=auth.profile_completed,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
    )


def user_to_admin_details(user: User) -> AdminUserDetails:
    item = user_to_admin_list_item(user)
    return AdminUserDetails(**item.model_dump(), profile=user_to_profile_out(user.details))
