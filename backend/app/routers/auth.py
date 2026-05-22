from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import crud, schemas
from app.auth import verify_password, create_access_token
from app.dependencies import get_db, get_current_user, require_admin
from app import models

router = APIRouter()


@router.get("/status", response_model=schemas.InstanceStatus)
def instance_status(db: Session = Depends(get_db)):
    """
    Check if the instance has been claimed.
    Frontend uses this to decide whether to show Register or Join.
    """
    has_users = crud.get_user_count(db) > 0
    return schemas.InstanceStatus(
        has_users=has_users,
        registration_open=not has_users,
    )


@router.post("/register", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: schemas.UserRegister, db: Session = Depends(get_db)):
    """
    Register the first user (admin). Disabled once any user exists.
    """
    if crud.get_user_count(db) > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This instance has already been claimed. Use /join with an invite code.",
        )

    if crud.get_user_by_email(db, data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = crud.create_user(db, data, is_admin=True)
    token = create_access_token(user.id)
    return schemas.TokenResponse(access_token=token, user=schemas.UserOut.model_validate(user))


@router.post("/join", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def join(data: schemas.UserJoin, db: Session = Depends(get_db)):
    """
    Join an existing instance using a valid invite code.
    """
    if crud.get_user_count(db) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No users exist yet. Use /register to claim this instance first.",
        )

    if crud.get_user_by_email(db, data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    invite = crud.get_invite_code(db, data.invite_code)
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invite code",
        )
    if invite.used_by is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite code has already been used",
        )
    if invite.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite code has expired",
        )

    user = crud.create_user_from_join(db, data)
    crud.use_invite_code(db, invite, user.id)
    token = create_access_token(user.id)
    return schemas.TokenResponse(access_token=token, user=schemas.UserOut.model_validate(user))


@router.post("/login", response_model=schemas.TokenResponse)
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate and return a JWT token.
    """
    user = crud.get_user_by_email(db, data.email)
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = create_access_token(user.id)
    return schemas.TokenResponse(access_token=token, user=schemas.UserOut.model_validate(user))


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


# ─────────────────────────────── Invite Codes (Admin) ────────────────────────

@router.post("/invite-codes", response_model=schemas.InviteCodeOut, status_code=status.HTTP_201_CREATED)
def create_invite_code(
    data: schemas.InviteCodeCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """Generate a new single-use invite code. Admin only."""
    invite = crud.create_invite_code(db, admin.id, data.expires_in_days)
    return invite


@router.get("/invite-codes", response_model=list[schemas.InviteCodeOut])
def list_invite_codes(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """List all invite codes. Admin only."""
    return crud.get_invite_codes(db)


@router.delete("/invite-codes/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_invite_code(
    invite_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """Revoke (delete) an invite code. Admin only."""
    invite = db.query(models.InviteCode).filter(models.InviteCode.id == invite_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite code not found")
    crud.revoke_invite_code(db, invite)
