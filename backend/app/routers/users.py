from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import crud, schemas, models
from app.auth import verify_password
from app.dependencies import get_db, get_current_user, require_admin

router = APIRouter()


# ─────────────────────────────── Own profile (any user) ──────────────────────

@router.get("/me", response_model=schemas.UserOut)
def get_own_profile(current_user: models.User = Depends(get_current_user)):
    """Return the current user's profile."""
    return current_user


@router.patch("/me", response_model=schemas.UserOut)
def update_own_profile(
    data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Update own name or email."""
    if data.email and data.email != current_user.email:
        if crud.get_user_by_email(db, data.email):
            raise HTTPException(status_code=400, detail="Email already in use")
    return crud.update_user(db, current_user, data)


@router.patch("/me/password", response_model=schemas.UserOut)
def change_own_password(
    data: schemas.OwnPasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Change own password — requires current password for verification."""
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    return crud.change_user_password(db, current_user, data.new_password)


# ─────────────────────────────── User management (admin) ─────────────────────

@router.get("/", response_model=list[schemas.UserWithBrewCount])
def list_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """List all users with their brew count. Admin only."""
    users = crud.get_all_users(db)
    result = []
    for user in users:
        brew_count = crud.get_user_brew_count(db, user.id)
        result.append(schemas.UserWithBrewCount(
            id=user.id,
            email=user.email,
            name=user.name,
            is_admin=user.is_admin,
            created_at=user.created_at,
            brew_count=brew_count,
        ))
    return result


@router.patch("/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """Edit a user's name or email. Admin only."""
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.email and data.email != user.email:
        if crud.get_user_by_email(db, data.email):
            raise HTTPException(status_code=400, detail="Email already in use")
    return crud.update_user(db, user, data)


@router.patch("/{user_id}/password", response_model=schemas.UserOut)
def admin_change_password(
    user_id: int,
    data: schemas.AdminPasswordChange,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """Set any user's password without needing the current one. Admin only."""
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.change_user_password(db, user, data.new_password)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """
    Delete a user and their brew logs. Admin only.
    Cannot delete yourself or other admins.
    """
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account",
        )
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete an admin account",
        )
    crud.delete_user(db, user)
