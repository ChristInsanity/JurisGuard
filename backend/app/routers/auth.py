from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import auth as auth_mod
from app.audit import append_audit
from app.database import get_db
from app.models import User as UserModel
from app.schemas import Token, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserOut)
def me(current: UserModel = Depends(auth_mod.get_current_user)):
    return current


@router.post("/token", response_model=Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(UserModel).filter(UserModel.email == form.username).first()
    if not user or not auth_mod.verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    append_audit(db, user_id=user.id, action="login", entity_type="user", entity_id=str(user.id))
    token = auth_mod.create_access_token(user.email, user.role)
    return Token(access_token=token)


@router.post("/register", response_model=UserOut)
def register(
    body: UserCreate,
    db: Session = Depends(get_db),
):
    if db.query(UserModel).filter(UserModel.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = UserModel(
        email=body.email,
        full_name=body.full_name,
        hashed_password=auth_mod.hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    append_audit(db, user_id=user.id, action="register", entity_type="user", entity_id=str(user.id))
    return user
