from sqlalchemy.orm import Session, joinedload

from app.models import ApprovalStatus, User


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).options(joinedload(User.details)).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).options(joinedload(User.details)).filter(User.user_id == user_id).first()


def list_users(
    db: Session,
    *,
    approval_status: ApprovalStatus | None = None,
    limit: int = 500,
) -> list[User]:
    query = db.query(User).options(joinedload(User.details)).order_by(User.created_at.desc())
    if approval_status:
        query = query.filter(User.approval_status == approval_status)
    return query.limit(limit).all()
