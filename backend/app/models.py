from datetime import datetime, timezone
from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text
)
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    brew_logs = relationship("BrewLog", back_populates="user")
    invite_codes_created = relationship(
        "InviteCode", foreign_keys="InviteCode.created_by", back_populates="creator"
    )
    invite_codes_used = relationship(
        "InviteCode", foreign_keys="InviteCode.used_by", back_populates="used_by_user"
    )


class Bean(Base):
    __tablename__ = "beans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    roaster = Column(String, nullable=True)
    origin = Column(String, nullable=True)
    roast_date = Column(DateTime(timezone=True), nullable=True)
    purchase_date = Column(DateTime(timezone=True), nullable=True)
    purchase_cost = Column(Float, nullable=True)
    quantity_grams = Column(Float, default=0.0, nullable=False)
    quantity_purchased_grams = Column(Float, nullable=True)
    rating = Column(Integer, nullable=True)  # 1–5
    notes = Column(Text, nullable=True)
    is_available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    brew_logs = relationship("BrewLog", back_populates="bean")
    grinder_profiles = relationship("GrinderProfile", back_populates="bean")


class Grinder(Base):
    __tablename__ = "grinders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    model = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    profiles = relationship("GrinderProfile", back_populates="grinder", cascade="all, delete-orphan")
    brew_logs = relationship("BrewLog", back_populates="grinder")


class GrinderProfile(Base):
    """
    Best-setting recipe for a specific grinder + bean + method combination.
    bean_id and method_id are both optional — a profile can be general
    (no bean/method), bean-specific, method-specific, or fully specific.
    """
    __tablename__ = "grinder_profiles"

    id = Column(Integer, primary_key=True, index=True)
    grinder_id = Column(Integer, ForeignKey("grinders.id"), nullable=False)
    bean_id = Column(Integer, ForeignKey("beans.id"), nullable=True)
    method_id = Column(Integer, ForeignKey("brew_methods.id"), nullable=True)
    setting = Column(String, nullable=False)          # dial position, click count, etc.
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    grinder = relationship("Grinder", back_populates="profiles")
    bean = relationship("Bean", back_populates="grinder_profiles")
    method = relationship("BrewMethod", back_populates="grinder_profiles")


class BrewMethod(Base):
    __tablename__ = "brew_methods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)  # e.g. "pour-over", "espresso", "immersion"
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    brew_logs = relationship("BrewLog", back_populates="method")
    grinder_profiles = relationship("GrinderProfile", back_populates="method")


class BrewLog(Base):
    __tablename__ = "brew_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bean_id = Column(Integer, ForeignKey("beans.id"), nullable=False)
    grinder_id = Column(Integer, ForeignKey("grinders.id"), nullable=True)
    method_id = Column(Integer, ForeignKey("brew_methods.id"), nullable=False)

    water_temperature = Column(Float, nullable=True)   # Celsius
    grind_size = Column(String, nullable=True)         # descriptive: "fine", "medium", "coarse"
    grinder_setting = Column(String, nullable=True)    # numeric or text grinder dial value
    brew_time = Column(Integer, nullable=True)         # seconds
    water_amount = Column(Float, nullable=True)        # grams
    coffee_amount = Column(Float, nullable=True)       # grams
    rating = Column(Integer, nullable=True)            # 1–5
    notes = Column(Text, nullable=True)
    brew_date = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="brew_logs")
    bean = relationship("Bean", back_populates="brew_logs")
    grinder = relationship("Grinder", back_populates="brew_logs")
    method = relationship("BrewMethod", back_populates="brew_logs")


class InviteCode(Base):
    __tablename__ = "invite_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    used_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    creator = relationship("User", foreign_keys=[created_by], back_populates="invite_codes_created")
    used_by_user = relationship("User", foreign_keys=[used_by], back_populates="invite_codes_used")


class InstanceSettings(Base):
    """Single-row table holding household-wide preferences."""
    __tablename__ = "instance_settings"

    id = Column(Integer, primary_key=True, default=1)
    show_costs = Column(Boolean, default=True, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
