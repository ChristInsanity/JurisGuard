from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field

from app.models import ApprovalStatus, CaseNature, CaseStatus, UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str | None = None
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    suffix: str | None = None
    mobile_number: str | None = None
    address: str | None = None
    sex: str | None = None
    birth_date: date | None = None
    password: str = Field(min_length=8)


class RegisterResponse(BaseModel):
    message: str


class UserProfileOut(BaseModel):
    full_name: str
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    suffix: str | None = None
    mobile_number: str | None = None
    address: str | None = None
    sex: str | None = None
    birth_date: date | None = None
    profile_picture_path: str | None = None
    profile_completed: bool


class UserOut(BaseModel):
    user_id: int
    email: str
    role: UserRole
    approval_status: ApprovalStatus
    full_name: str
    profile_picture_path: str | None = None
    profile_completed: bool

    model_config = {"from_attributes": True}


class AdminUserListItem(BaseModel):
    user_id: int
    email: EmailStr
    role: UserRole
    approval_status: ApprovalStatus
    is_active: bool
    full_name: str
    profile_picture_path: str | None = None
    profile_completed: bool
    created_at: datetime
    last_login_at: datetime | None = None


class AdminUserDetails(AdminUserListItem):
    profile: UserProfileOut


class ApprovalUpdate(BaseModel):
    approval_status: ApprovalStatus


class ClientBase(BaseModel):
    full_name: str
    age: int | None = None
    sex: str | None = None
    civil_status: str | None = None
    address: str | None = None
    contact_number: str | None = None
    email: str | None = None
    detained: bool = False
    place_of_detention: str | None = None
    flag_senior: bool = False
    flag_cicl: bool = False
    flag_female: bool = False
    flag_urban: bool = False
    flag_rural: bool = False
    flag_drugs: bool = False


class ClientCreate(ClientBase):
    pass


class ClientOut(ClientBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class LegalCaseBase(BaseModel):
    control_number: str
    party_represented: str | None = None
    title_of_case: str | None = None
    court_body: str | None = None
    case_number: str | None = None
    cause_of_action: str | None = None
    nature: CaseNature | None = None
    status: CaseStatus = CaseStatus.pending
    last_action_taken: str | None = None
    cause_of_termination: str | None = None
    date_of_termination: date | None = None
    case_received_date: date | None = None
    adverse_party_name: str | None = None
    facts_of_case: str | None = None
    region: str | None = None
    district_office: str | None = None
    assigned_attorney: str | None = None
    client_id: int | None = None


class LegalCaseCreate(LegalCaseBase):
    pass


class LegalCaseOut(LegalCaseBase):
    id: int
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class OCRResult(BaseModel):
    raw_text: str
    suggested_fields: dict = Field(default_factory=dict)
