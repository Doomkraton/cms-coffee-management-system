from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import crud, schemas, models
from app.dependencies import get_db, get_current_user

router = APIRouter()


@router.get("/", response_model=list[schemas.GrinderOut])
def list_grinders(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    return crud.get_grinders(db)


@router.post("/", response_model=schemas.GrinderOut, status_code=status.HTTP_201_CREATED)
def create_grinder(
    data: schemas.GrinderCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    return crud.create_grinder(db, data)


@router.get("/{grinder_id}", response_model=schemas.GrinderOut)
def get_grinder(
    grinder_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    grinder = crud.get_grinder(db, grinder_id)
    if not grinder:
        raise HTTPException(status_code=404, detail="Grinder not found")
    return grinder


@router.patch("/{grinder_id}", response_model=schemas.GrinderOut)
def update_grinder(
    grinder_id: int,
    data: schemas.GrinderUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    grinder = crud.get_grinder(db, grinder_id)
    if not grinder:
        raise HTTPException(status_code=404, detail="Grinder not found")
    return crud.update_grinder(db, grinder, data)


@router.delete("/{grinder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grinder(
    grinder_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    grinder = crud.get_grinder(db, grinder_id)
    if not grinder:
        raise HTTPException(status_code=404, detail="Grinder not found")
    crud.delete_grinder(db, grinder)


# ──────────────── Grinder Settings Profiles (nested) ─────────────────────────

@router.post("/{grinder_id}/profiles", response_model=schemas.GrinderSettingsProfileOut, status_code=status.HTTP_201_CREATED)
def create_profile(
    grinder_id: int,
    data: schemas.GrinderSettingsProfileCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    grinder = crud.get_grinder(db, grinder_id)
    if not grinder:
        raise HTTPException(status_code=404, detail="Grinder not found")
    return crud.create_grinder_profile(db, grinder_id, data)


@router.patch("/{grinder_id}/profiles/{profile_id}", response_model=schemas.GrinderSettingsProfileOut)
def update_profile(
    grinder_id: int,
    profile_id: int,
    data: schemas.GrinderSettingsProfileUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    profile = crud.get_grinder_profile(db, profile_id)
    if not profile or profile.grinder_id != grinder_id:
        raise HTTPException(status_code=404, detail="Profile not found")
    return crud.update_grinder_profile(db, profile, data)


@router.delete("/{grinder_id}/profiles/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(
    grinder_id: int,
    profile_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    profile = crud.get_grinder_profile(db, profile_id)
    if not profile or profile.grinder_id != grinder_id:
        raise HTTPException(status_code=404, detail="Profile not found")
    crud.delete_grinder_profile(db, profile)
