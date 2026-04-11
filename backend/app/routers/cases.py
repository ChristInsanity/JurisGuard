from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.audit import append_audit
from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import LegalCase, User, UserRole
from app.schemas import LegalCaseCreate, LegalCaseOut

router = APIRouter(prefix="/cases", tags=["cases"])


def client_ip(request: Request) -> str | None:
    if request.client:
        return request.client.host
    return None


@router.get("/", response_model=list[LegalCaseOut])
def list_cases(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = db.query(LegalCase).order_by(LegalCase.id.desc()).limit(500).all()
    return rows


@router.post("/", response_model=LegalCaseOut)
def create_case(
    body: LegalCaseCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.encoder, UserRole.attorney, UserRole.admin)),
):
    if db.query(LegalCase).filter(LegalCase.control_number == body.control_number).first():
        raise HTTPException(status_code=400, detail="Control number already exists")
    row = LegalCase(**body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    append_audit(
        db,
        user_id=user.id,
        action="case.create",
        entity_type="legal_case",
        entity_id=str(row.id),
        detail=body.control_number,
        ip_address=client_ip(request),
    )
    return row


@router.get("/{case_id}", response_model=LegalCaseOut)
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    row = db.query(LegalCase).filter(LegalCase.id == case_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Case not found")
    return row
