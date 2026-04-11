from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.audit import append_audit
from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import Client, User, UserRole
from app.schemas import ClientCreate, ClientOut

router = APIRouter(prefix="/clients", tags=["clients"])


def client_ip(request: Request) -> str | None:
    if request.client:
        return request.client.host
    return None


@router.get("/", response_model=list[ClientOut])
def list_clients(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Client).order_by(Client.id.desc()).limit(500).all()


@router.post("/", response_model=ClientOut)
def create_client(
    body: ClientCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.encoder, UserRole.attorney, UserRole.admin)),
):
    row = Client(**body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    append_audit(
        db,
        user_id=user.id,
        action="client.create",
        entity_type="client",
        entity_id=str(row.id),
        ip_address=client_ip(request),
    )
    return row
