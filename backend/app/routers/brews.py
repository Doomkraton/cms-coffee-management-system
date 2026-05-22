from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app import crud, schemas, models
from app.dependencies import get_db, get_current_user

router = APIRouter()


@router.get("/", response_model=list[schemas.BrewLogOut])
def list_brews(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    """List brew logs, newest first. Supports pagination via skip/limit."""
    return crud.get_brew_logs(db, skip=skip, limit=limit)


@router.post("/", response_model=schemas.BrewLogOut, status_code=status.HTTP_201_CREATED)
def create_brew(
    data: schemas.BrewLogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Log a new brew. The authenticated user is recorded as the brewer."""
    # Validate that referenced entities exist
    if not crud.get_bean(db, data.bean_id):
        raise HTTPException(status_code=404, detail="Bean not found")
    if not crud.get_brew_method(db, data.method_id):
        raise HTTPException(status_code=404, detail="Brew method not found")
    if data.grinder_id and not crud.get_grinder(db, data.grinder_id):
        raise HTTPException(status_code=404, detail="Grinder not found")

    return crud.create_brew_log(db, current_user.id, data)


@router.get("/stats", response_model=dict)
def brew_stats(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    """Return aggregate brew statistics for the analytics dashboard."""
    return crud.get_brew_stats(db)


@router.get("/{log_id}", response_model=schemas.BrewLogOut)
def get_brew(
    log_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    log = crud.get_brew_log(db, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Brew log not found")
    return log


@router.patch("/{log_id}", response_model=schemas.BrewLogOut)
def update_brew(
    log_id: int,
    data: schemas.BrewLogUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Update a brew log. Only the original brewer or an admin can edit.
    """
    log = crud.get_brew_log(db, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Brew log not found")
    if log.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="You can only edit your own brew logs")
    return crud.update_brew_log(db, log, data)


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brew(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Delete a brew log. Only the original brewer or an admin can delete.
    """
    log = crud.get_brew_log(db, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Brew log not found")
    if log.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="You can only delete your own brew logs")
    crud.delete_brew_log(db, log)
