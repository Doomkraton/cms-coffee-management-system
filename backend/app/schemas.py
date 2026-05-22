from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator


# ─────────────────────────────── Auth ────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    name: str
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserJoin(BaseModel):
    email: EmailStr
    name: str
    password: str
    invite_code: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserUpdate(BaseModel):
    """Edit a user's name or email."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class OwnPasswordChange(BaseModel):
    """User changing their own password — must supply current password."""
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class AdminPasswordChange(BaseModel):
    """Admin setting any user's password — no current password required."""
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserWithBrewCount(BaseModel):
    """UserOut extended with brew_count for the members list."""
    id: int
    email: str
    name: str
    is_admin: bool
    created_at: datetime
    brew_count: int

    model_config = {"from_attributes": True}


# ─────────────────────────────── Invite Codes ────────────────────────────────

class InviteCodeCreate(BaseModel):
    expires_in_days: int = 7


class InviteCodeOut(BaseModel):
    id: int
    code: str
    created_at: datetime
    expires_at: datetime
    used_by: Optional[int]
    used_by_user: Optional[UserOut]

    model_config = {"from_attributes": True}


# ─────────────────────────────── Beans ───────────────────────────────────────

class BeanCreate(BaseModel):
    name: str
    roaster: Optional[str] = None
    origin: Optional[str] = None
    roast_date: Optional[datetime] = None
    purchase_date: Optional[datetime] = None
    purchase_cost: Optional[float] = None
    quantity_grams: float = 0.0
    quantity_purchased_grams: Optional[float] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    is_available: bool = True

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 5):
            raise ValueError("Rating must be between 1 and 5")
        return v


class BeanUpdate(BaseModel):
    name: Optional[str] = None
    roaster: Optional[str] = None
    origin: Optional[str] = None
    roast_date: Optional[datetime] = None
    purchase_date: Optional[datetime] = None
    purchase_cost: Optional[float] = None
    quantity_grams: Optional[float] = None
    quantity_purchased_grams: Optional[float] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    is_available: Optional[bool] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 5):
            raise ValueError("Rating must be between 1 and 5")
        return v


class BeanOut(BaseModel):
    id: int
    name: str
    roaster: Optional[str]
    origin: Optional[str]
    roast_date: Optional[datetime]
    purchase_date: Optional[datetime]
    purchase_cost: Optional[float]
    quantity_grams: float
    quantity_purchased_grams: Optional[float]
    rating: Optional[int]
    notes: Optional[str]
    is_available: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────────── Grinders ────────────────────────────────────

class GrinderSettingsProfileCreate(BaseModel):
    name: str
    setting: str
    description: Optional[str] = None


class GrinderSettingsProfileUpdate(BaseModel):
    name: Optional[str] = None
    setting: Optional[str] = None
    description: Optional[str] = None


class GrinderSettingsProfileOut(BaseModel):
    id: int
    grinder_id: int
    name: str
    setting: str
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class GrinderCreate(BaseModel):
    name: str
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    notes: Optional[str] = None


class GrinderUpdate(BaseModel):
    name: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    notes: Optional[str] = None


class GrinderOut(BaseModel):
    id: int
    name: str
    model: Optional[str]
    manufacturer: Optional[str]
    notes: Optional[str]
    created_at: datetime
    settings_profiles: list[GrinderSettingsProfileOut] = []

    model_config = {"from_attributes": True}


# ─────────────────────────────── Brew Methods ────────────────────────────────

class BrewMethodCreate(BaseModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = None


class BrewMethodUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None


class BrewMethodOut(BaseModel):
    id: int
    name: str
    category: Optional[str]
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────────── Brew Logs ───────────────────────────────────

class BrewLogCreate(BaseModel):
    bean_id: int
    method_id: int
    grinder_id: Optional[int] = None
    water_temperature: Optional[float] = None
    grind_size: Optional[str] = None
    grinder_setting: Optional[str] = None
    brew_time: Optional[int] = None
    water_amount: Optional[float] = None
    coffee_amount: Optional[float] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    brew_date: Optional[datetime] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 5):
            raise ValueError("Rating must be between 1 and 5")
        return v


class BrewLogUpdate(BaseModel):
    bean_id: Optional[int] = None
    method_id: Optional[int] = None
    grinder_id: Optional[int] = None
    water_temperature: Optional[float] = None
    grind_size: Optional[str] = None
    grinder_setting: Optional[str] = None
    brew_time: Optional[int] = None
    water_amount: Optional[float] = None
    coffee_amount: Optional[float] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    brew_date: Optional[datetime] = None


class BrewLogOut(BaseModel):
    id: int
    user_id: int
    bean_id: int
    method_id: int
    grinder_id: Optional[int]
    water_temperature: Optional[float]
    grind_size: Optional[str]
    grinder_setting: Optional[str]
    brew_time: Optional[int]
    water_amount: Optional[float]
    coffee_amount: Optional[float]
    rating: Optional[int]
    notes: Optional[str]
    brew_date: datetime
    created_at: datetime
    user: UserOut
    bean: BeanOut
    method: BrewMethodOut
    grinder: Optional[GrinderOut]

    model_config = {"from_attributes": True}


# ─────────────────────────────── Instance Status ─────────────────────────────

class InstanceStatus(BaseModel):
    has_users: bool
    registration_open: bool


# ─────────────────────────────── Instance Settings ───────────────────────────

class InstanceSettingsOut(BaseModel):
    show_costs: bool
    currency: str

    model_config = {"from_attributes": True}


class InstanceSettingsUpdate(BaseModel):
    show_costs: Optional[bool] = None
    currency: Optional[str] = None
