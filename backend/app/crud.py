import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app import models, schemas
from app.auth import hash_password


# ─────────────────────────────── Users ───────────────────────────────────────

def get_user_count(db: Session) -> int:
    return db.query(models.User).count()


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(
    db: Session,
    data: schemas.UserRegister,
    is_admin: bool = False,
) -> models.User:
    user = models.User(
        email=data.email,
        name=data.name,
        password_hash=hash_password(data.password),
        is_admin=is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_user_from_join(
    db: Session,
    data: schemas.UserJoin,
) -> models.User:
    user = models.User(
        email=data.email,
        name=data.name,
        password_hash=hash_password(data.password),
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ─────────────────────────────── Invite Codes ────────────────────────────────

def create_invite_code(
    db: Session,
    created_by_id: int,
    expires_in_days: int = 7,
) -> models.InviteCode:
    code = secrets.token_urlsafe(16)
    invite = models.InviteCode(
        code=code,
        created_by=created_by_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=expires_in_days),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


def get_invite_code(db: Session, code: str) -> Optional[models.InviteCode]:
    return db.query(models.InviteCode).filter(models.InviteCode.code == code).first()


def get_invite_codes(db: Session) -> list[models.InviteCode]:
    return db.query(models.InviteCode).order_by(models.InviteCode.created_at.desc()).all()


def use_invite_code(db: Session, invite: models.InviteCode, user_id: int) -> models.InviteCode:
    invite.used_by = user_id
    db.commit()
    db.refresh(invite)
    return invite


def revoke_invite_code(db: Session, invite: models.InviteCode) -> None:
    db.delete(invite)
    db.commit()


# ─────────────────────────────── Beans ───────────────────────────────────────

def get_beans(db: Session) -> list[models.Bean]:
    return db.query(models.Bean).order_by(models.Bean.created_at.desc()).all()


def get_bean(db: Session, bean_id: int) -> Optional[models.Bean]:
    return db.query(models.Bean).filter(models.Bean.id == bean_id).first()


def create_bean(db: Session, data: schemas.BeanCreate) -> models.Bean:
    bean = models.Bean(**data.model_dump())
    db.add(bean)
    db.commit()
    db.refresh(bean)
    return bean


def update_bean(db: Session, bean: models.Bean, data: schemas.BeanUpdate) -> models.Bean:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(bean, field, value)
    db.commit()
    db.refresh(bean)
    return bean


def delete_bean(db: Session, bean: models.Bean) -> None:
    db.delete(bean)
    db.commit()


# ─────────────────────────────── Grinders ────────────────────────────────────

def get_grinders(db: Session) -> list[models.Grinder]:
    return db.query(models.Grinder).order_by(models.Grinder.created_at.desc()).all()


def get_grinder(db: Session, grinder_id: int) -> Optional[models.Grinder]:
    return db.query(models.Grinder).filter(models.Grinder.id == grinder_id).first()


def create_grinder(db: Session, data: schemas.GrinderCreate) -> models.Grinder:
    grinder = models.Grinder(**data.model_dump())
    db.add(grinder)
    db.commit()
    db.refresh(grinder)
    return grinder


def update_grinder(db: Session, grinder: models.Grinder, data: schemas.GrinderUpdate) -> models.Grinder:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(grinder, field, value)
    db.commit()
    db.refresh(grinder)
    return grinder


def delete_grinder(db: Session, grinder: models.Grinder) -> None:
    db.delete(grinder)
    db.commit()


# ─────────────────────── Grinder Settings Profiles ───────────────────────────

def create_grinder_profile(
    db: Session, grinder_id: int, data: schemas.GrinderSettingsProfileCreate
) -> models.GrinderSettingsProfile:
    profile = models.GrinderSettingsProfile(grinder_id=grinder_id, **data.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def get_grinder_profile(db: Session, profile_id: int) -> Optional[models.GrinderSettingsProfile]:
    return db.query(models.GrinderSettingsProfile).filter(
        models.GrinderSettingsProfile.id == profile_id
    ).first()


def update_grinder_profile(
    db: Session,
    profile: models.GrinderSettingsProfile,
    data: schemas.GrinderSettingsProfileUpdate,
) -> models.GrinderSettingsProfile:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


def delete_grinder_profile(db: Session, profile: models.GrinderSettingsProfile) -> None:
    db.delete(profile)
    db.commit()


# ─────────────────────────────── Brew Methods ────────────────────────────────

def get_brew_methods(db: Session) -> list[models.BrewMethod]:
    return db.query(models.BrewMethod).order_by(models.BrewMethod.name).all()


def get_brew_method(db: Session, method_id: int) -> Optional[models.BrewMethod]:
    return db.query(models.BrewMethod).filter(models.BrewMethod.id == method_id).first()


def create_brew_method(db: Session, data: schemas.BrewMethodCreate) -> models.BrewMethod:
    method = models.BrewMethod(**data.model_dump())
    db.add(method)
    db.commit()
    db.refresh(method)
    return method


def update_brew_method(
    db: Session, method: models.BrewMethod, data: schemas.BrewMethodUpdate
) -> models.BrewMethod:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(method, field, value)
    db.commit()
    db.refresh(method)
    return method


def delete_brew_method(db: Session, method: models.BrewMethod) -> None:
    db.delete(method)
    db.commit()


# ─────────────────────────────── Brew Logs ───────────────────────────────────

def get_brew_logs(db: Session, skip: int = 0, limit: int = 50) -> list[models.BrewLog]:
    return (
        db.query(models.BrewLog)
        .order_by(models.BrewLog.brew_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_brew_log(db: Session, log_id: int) -> Optional[models.BrewLog]:
    return db.query(models.BrewLog).filter(models.BrewLog.id == log_id).first()


def create_brew_log(
    db: Session, user_id: int, data: schemas.BrewLogCreate
) -> models.BrewLog:
    log_data = data.model_dump()
    log = models.BrewLog(user_id=user_id, **log_data)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def update_brew_log(
    db: Session, log: models.BrewLog, data: schemas.BrewLogUpdate
) -> models.BrewLog:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(log, field, value)
    db.commit()
    db.refresh(log)
    return log


def delete_brew_log(db: Session, log: models.BrewLog) -> None:
    db.delete(log)
    db.commit()


# ─────────────────────────────── Analytics ───────────────────────────────────

def get_brew_stats(db: Session) -> dict:
    """Return aggregate stats for the analytics dashboard."""
    from sqlalchemy import func

    total_brews = db.query(func.count(models.BrewLog.id)).scalar() or 0
    avg_rating = db.query(func.avg(models.BrewLog.rating)).scalar()
    total_coffee_g = db.query(func.sum(models.BrewLog.coffee_amount)).scalar() or 0

    # Most used bean
    top_bean = (
        db.query(models.Bean.name, func.count(models.BrewLog.id).label("count"))
        .join(models.BrewLog, models.Bean.id == models.BrewLog.bean_id)
        .group_by(models.Bean.name)
        .order_by(func.count(models.BrewLog.id).desc())
        .first()
    )

    # Most used method
    top_method = (
        db.query(models.BrewMethod.name, func.count(models.BrewLog.id).label("count"))
        .join(models.BrewLog, models.BrewMethod.id == models.BrewLog.method_id)
        .group_by(models.BrewMethod.name)
        .order_by(func.count(models.BrewLog.id).desc())
        .first()
    )

    return {
        "total_brews": total_brews,
        "avg_rating": round(float(avg_rating), 2) if avg_rating else None,
        "total_coffee_grams": round(float(total_coffee_g), 1),
        "top_bean": top_bean.name if top_bean else None,
        "top_method": top_method.name if top_method else None,
    }
