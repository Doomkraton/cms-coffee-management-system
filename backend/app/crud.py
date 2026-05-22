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


def get_all_users(db: Session) -> list[models.User]:
    return db.query(models.User).order_by(models.User.created_at).all()


def update_user(db: Session, user: models.User, data: schemas.UserUpdate) -> models.User:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def change_user_password(db: Session, user: models.User, new_password: str) -> models.User:
    user.password_hash = hash_password(new_password)
    db.commit()
    db.refresh(user)
    return user


def get_user_brew_count(db: Session, user_id: int) -> int:
    return db.query(models.BrewLog).filter(models.BrewLog.user_id == user_id).count()


def delete_user(db: Session, user: models.User) -> None:
    """
    Delete a user and everything they own:
      - Their brew logs
      - Invite codes they created
    Invite codes they *used* are kept (used_by set to null manually).
    """
    # Nullify used_by on invite codes they redeemed
    db.query(models.InviteCode).filter(
        models.InviteCode.used_by == user.id
    ).update({"used_by": None})

    # Delete invite codes they created
    db.query(models.InviteCode).filter(
        models.InviteCode.created_by == user.id
    ).delete()

    # Delete their brew logs
    db.query(models.BrewLog).filter(
        models.BrewLog.user_id == user.id
    ).delete()

    db.delete(user)
    db.commit()


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


# ─────────────────────────── Grinder Profiles ───────────────────────────────

def create_grinder_profile(
    db: Session, grinder_id: int, data: schemas.GrinderProfileCreate
) -> models.GrinderProfile:
    profile = models.GrinderProfile(grinder_id=grinder_id, **data.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def get_grinder_profile(db: Session, profile_id: int) -> Optional[models.GrinderProfile]:
    return db.query(models.GrinderProfile).filter(
        models.GrinderProfile.id == profile_id
    ).first()


def delete_grinder_profile(db: Session, profile: models.GrinderProfile) -> None:
    db.delete(profile)
    db.commit()


def suggest_grinder_profile(
    db: Session,
    grinder_id: int,
    bean_id: Optional[int],
    method_id: Optional[int],
) -> Optional[models.GrinderProfile]:
    """
    Return the best-matching profile for a given grinder + bean + method,
    ranked by specificity:
      4 — exact match (bean + method)
      3 — bean match only
      2 — method match only
      1 — general (no bean, no method)
      0 — no match
    """
    profiles = (
        db.query(models.GrinderProfile)
        .filter(models.GrinderProfile.grinder_id == grinder_id)
        .all()
    )
    if not profiles:
        return None

    def score(p: models.GrinderProfile) -> int:
        bean_match = p.bean_id == bean_id if bean_id else p.bean_id is None
        method_match = p.method_id == method_id if method_id else p.method_id is None

        if p.bean_id == bean_id and p.method_id == method_id:
            return 4  # exact
        if p.bean_id == bean_id and p.method_id is None:
            return 3  # bean-specific, any method
        if p.method_id == method_id and p.bean_id is None:
            return 2  # method-specific, any bean
        if p.bean_id is None and p.method_id is None:
            return 1  # general fallback
        return 0  # for a different bean/method combination

    best = max(profiles, key=score)
    return best if score(best) > 0 else None


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


def _adjust_bean_stock(db: Session, bean_id: int, delta_grams: float) -> None:
    """Add delta_grams to bean.quantity_grams (negative to subtract)."""
    bean = db.query(models.Bean).filter(models.Bean.id == bean_id).first()
    if not bean:
        return
    bean.quantity_grams = max(0.0, bean.quantity_grams + delta_grams)
    if bean.quantity_grams == 0.0:
        bean.is_available = False
    db.commit()


def create_brew_log(
    db: Session, user_id: int, data: schemas.BrewLogCreate
) -> models.BrewLog:
    log = models.BrewLog(user_id=user_id, **data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)

    # Subtract used coffee from bean stock
    if log.coffee_amount:
        _adjust_bean_stock(db, log.bean_id, -log.coffee_amount)

    db.refresh(log)
    return log


def update_brew_log(
    db: Session, log: models.BrewLog, data: schemas.BrewLogUpdate
) -> models.BrewLog:
    old_coffee = log.coffee_amount
    old_bean_id = log.bean_id

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(log, field, value)
    db.commit()
    db.refresh(log)

    # Adjust stock if coffee_amount or bean changed
    new_coffee = log.coffee_amount
    new_bean_id = log.bean_id

    if old_bean_id == new_bean_id:
        # Same bean — adjust the difference
        diff = (old_coffee or 0.0) - (new_coffee or 0.0)
        if diff != 0:
            _adjust_bean_stock(db, new_bean_id, diff)
    else:
        # Bean changed — return stock to old bean, deduct from new bean
        if old_coffee:
            _adjust_bean_stock(db, old_bean_id, old_coffee)
        if new_coffee:
            _adjust_bean_stock(db, new_bean_id, -new_coffee)

    db.refresh(log)
    return log


def delete_brew_log(db: Session, log: models.BrewLog) -> None:
    # Return coffee to bean stock before deleting
    if log.coffee_amount:
        _adjust_bean_stock(db, log.bean_id, log.coffee_amount)
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

    # Total spent — only when quantity_purchased_grams is explicitly set.
    # We must NOT fall back to quantity_grams because that field decreases
    # with every brew, which would silently inflate cost-per-gram over time.
    total_spent_raw = (
        db.query(
            func.sum(
                models.BrewLog.coffee_amount
                * models.Bean.purchase_cost
                / func.nullif(models.Bean.quantity_purchased_grams, 0)
            )
        )
        .join(models.Bean, models.BrewLog.bean_id == models.Bean.id)
        .filter(
            models.BrewLog.coffee_amount.isnot(None),
            models.Bean.purchase_cost.isnot(None),
            models.Bean.quantity_purchased_grams.isnot(None),
            models.Bean.quantity_purchased_grams > 0,
        )
        .scalar()
    )

    # Brews with calculable cost — must match the same filters as total_spent
    costed_brews = (
        db.query(func.count(models.BrewLog.id))
        .join(models.Bean, models.BrewLog.bean_id == models.Bean.id)
        .filter(
            models.BrewLog.coffee_amount.isnot(None),
            models.Bean.purchase_cost.isnot(None),
            models.Bean.quantity_purchased_grams.isnot(None),
            models.Bean.quantity_purchased_grams > 0,
        )
        .scalar()
        or 0
    )

    total_spent = round(float(total_spent_raw), 2) if total_spent_raw else None
    avg_cost = (
        round(total_spent / costed_brews, 2)
        if total_spent and costed_brews > 0
        else None
    )

    return {
        "total_brews": total_brews,
        "avg_rating": round(float(avg_rating), 2) if avg_rating else None,
        "total_coffee_grams": round(float(total_coffee_g), 1),
        "top_bean": top_bean.name if top_bean else None,
        "top_method": top_method.name if top_method else None,
        "total_spent": total_spent,
        "avg_cost_per_brew": avg_cost,
        "costed_brews": costed_brews,
    }


# ─────────────────────────────── Instance Settings ───────────────────────────

def get_instance_settings(db: Session) -> models.InstanceSettings:
    """Get the singleton settings row, creating it with defaults if missing."""
    settings = db.query(models.InstanceSettings).first()
    if not settings:
        settings = models.InstanceSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def update_instance_settings(
    db: Session,
    data: "schemas.InstanceSettingsUpdate",
) -> models.InstanceSettings:
    settings = get_instance_settings(db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return settings
