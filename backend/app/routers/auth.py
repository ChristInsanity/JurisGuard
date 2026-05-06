from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import auth as auth_mod
from app.audit import append_audit
from app.database import get_db
from app.models import User as UserModel
from app.schemas import RegisterResponse, Token, UserCreate, UserOut
from app.services import users as user_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserOut)
def me(current: UserModel = Depends(auth_mod.get_current_user)):
    return user_service.user_to_auth_out(current)


@router.post("/token", response_model=Token)
def login(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = user_service.authenticate_user(db, email=form.username, password=form.password)
    append_audit(
        db,
        user_id=user.user_id,
        action="login",
        module="auth",
        entity_type="user",
        entity_id=str(user.user_id),
        ip_address=request.client.host if request.client else None,
    )
    token = auth_mod.create_access_token(user)
    return Token(access_token=token)


@router.post("/register", response_model=RegisterResponse)
def register(
    body: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    user = user_service.create_registered_user(db, body)
    append_audit(
        db,
        user_id=user.user_id,
        action="register",
        module="auth",
        entity_type="user",
        entity_id=str(user.user_id),
        ip_address=request.client.host if request.client else None,
    )
    return RegisterResponse(message="Registration submitted for approval.")
