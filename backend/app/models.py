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
    user = "user"


class ApprovalStatus(str, enum.Enum):
    pending = "pending"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"
    suspended = "suspended"


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
    """Authentication record only. Profile data lives in user_details."""

    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.user)
    approval_status: Mapped[ApprovalStatus] = mapped_column(
        Enum(ApprovalStatus), default=ApprovalStatus.pending
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_at = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at = mapped_column(DateTime(timezone=True), nullable=True)

    details = relationship("UserDetails", back_populates="user", uselist=False, cascade="all, delete-orphan")

    @property
    def id(self) -> int:
        return self.user_id

    @property
    def full_name(self) -> str:
        return self.details.full_name if self.details else ""

    @property
    def hashed_password(self) -> str:
        return self.password_hash


class UserDetails(Base):
    """One-to-one profile record for approved users and applicant review."""

    __tablename__ = "user_details"

    details_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), unique=True, index=True)
    first_name = mapped_column(String(128), nullable=True)
    middle_name = mapped_column(String(128), nullable=True)
    last_name = mapped_column(String(128), nullable=True)
    suffix = mapped_column(String(32), nullable=True)
    mobile_number = mapped_column(String(64), nullable=True)
    address = mapped_column(Text, nullable=True)
    sex = mapped_column(String(32), nullable=True)
    birth_date = mapped_column(Date, nullable=True)
    profile_picture_path = mapped_column(String(1024), nullable=True)
    profile_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="details")

    @property
    def full_name(self) -> str:
        return " ".join(
            part
            for part in [self.first_name, self.middle_name, self.last_name, self.suffix]
            if part
        )


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
    created_by_user_id = mapped_column(ForeignKey("users.user_id"), nullable=True)
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
    created_by_user_id = mapped_column(ForeignKey("users.user_id"), nullable=True)
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
    created_by_user_id = mapped_column(ForeignKey("users.user_id"), nullable=True)
    verified_by_user_id = mapped_column(ForeignKey("users.user_id"), nullable=True)
    verified_at = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id = mapped_column(ForeignKey("users.user_id"), nullable=True)
    action: Mapped[str] = mapped_column(String(64))
    module: Mapped[str] = mapped_column(String(64), default="system")
    entity_type: Mapped[str] = mapped_column(String(64))
    entity_id = mapped_column(String(64), nullable=True)
    metadata_json = mapped_column(Text, nullable=True)
    ip_address = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    @property
    def id(self) -> int:
        return self.audit_id
