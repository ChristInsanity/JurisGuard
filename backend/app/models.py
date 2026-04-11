from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    encoder = "encoder"
    reviewer = "reviewer"
    attorney = "attorney"
    readonly = "readonly"


class CaseNature(str, enum.Enum):
    criminal = "criminal"
    civil = "civil"
    labor = "labor"
    administrative = "administrative"
    appealed = "appealed"


class CaseStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    terminated = "terminated"
    archived = "archived"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.encoder)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    mfa_secret = mapped_column(String(64), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Client(Base):
    """PAO Interview Sheet II + inventory demographics."""

    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(512), index=True)
    age = mapped_column(Integer, nullable=True)
    sex = mapped_column(String(32), nullable=True)
    civil_status = mapped_column(String(64), nullable=True)
    address = mapped_column(Text, nullable=True)
    contact_number = mapped_column(String(128), nullable=True)
    email = mapped_column(String(255), nullable=True)
    religion = mapped_column(String(128), nullable=True)
    educational_attainment = mapped_column(String(128), nullable=True)
    citizenship = mapped_column(String(128), nullable=True)
    language_dialect = mapped_column(String(128), nullable=True)
    monthly_income = mapped_column(String(64), nullable=True)
    detained: Mapped[bool] = mapped_column(Boolean, default=False)
    detained_since = mapped_column(Date, nullable=True)
    place_of_detention = mapped_column(String(255), nullable=True)
    date_of_confinement_or_arrest = mapped_column(Date, nullable=True)
    flag_senior: Mapped[bool] = mapped_column(Boolean, default=False)
    flag_cicl: Mapped[bool] = mapped_column(Boolean, default=False)
    flag_female: Mapped[bool] = mapped_column(Boolean, default=False)
    flag_urban: Mapped[bool] = mapped_column(Boolean, default=False)
    flag_rural: Mapped[bool] = mapped_column(Boolean, default=False)
    flag_drugs: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LegalCase(Base):
    """Central archive row aligned with year-end inventory + termination tracking."""

    __tablename__ = "legal_cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    control_number: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    party_represented = mapped_column(String(128), nullable=True)
    title_of_case = mapped_column(Text, nullable=True)
    court_body = mapped_column(String(255), nullable=True)
    case_number = mapped_column(String(128), nullable=True)
    cause_of_action = mapped_column(Text, nullable=True)
    nature = mapped_column(Enum(CaseNature), nullable=True)
    status: Mapped[CaseStatus] = mapped_column(Enum(CaseStatus), default=CaseStatus.pending)
    last_action_taken = mapped_column(Text, nullable=True)
    cause_of_termination = mapped_column(Text, nullable=True)
    date_of_termination = mapped_column(Date, nullable=True)
    case_received_date = mapped_column(Date, nullable=True)
    adverse_party_name = mapped_column(String(512), nullable=True)
    adverse_party_address = mapped_column(Text, nullable=True)
    facts_of_case = mapped_column(Text, nullable=True)
    pending_in_court = mapped_column(Boolean, nullable=True)
    court_where_pending = mapped_column(String(255), nullable=True)
    region = mapped_column(String(128), nullable=True)
    district_office = mapped_column(String(255), nullable=True)
    assigned_attorney = mapped_column(String(255), nullable=True)
    interviewer = mapped_column(String(255), nullable=True)
    intake_date = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    client_id = mapped_column(ForeignKey("clients.id"), nullable=True)
    client = relationship("Client", backref="cases")


class CaseDocument(Base):
    """Scanned intake docs: OCR raw + extracted fields pending verification."""

    __tablename__ = "case_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id = mapped_column(ForeignKey("legal_cases.id"), nullable=True)
    doc_type: Mapped[str] = mapped_column(String(64))
    original_filename: Mapped[str] = mapped_column(String(512))
    storage_path: Mapped[str] = mapped_column(String(1024))
    ocr_raw_text = mapped_column(Text, nullable=True)
    extracted_json = mapped_column(Text, nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_by_user_id = mapped_column(ForeignKey("users.id"), nullable=True)
    verified_at = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(64))
    entity_type: Mapped[str] = mapped_column(String(64))
    entity_id = mapped_column(String(64), nullable=True)
    detail = mapped_column(Text, nullable=True)
    prev_hash = mapped_column(String(128), nullable=True)
    entry_hash: Mapped[str] = mapped_column(String(128))
    ip_address = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
