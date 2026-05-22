from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import crud, schemas, models
from app.dependencies import get_db, get_current_user

router = APIRouter()


@router.get("/", response_model=list[schemas.BeanOut])
def list_beans(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    """List all beans. Accessible to all authenticated users."""
    return crud.get_beans(db)


@router.post("/", response_model=schemas.BeanOut, status_code=status.HTTP_201_CREATED)
def create_bean(
    data: schemas.BeanCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    """Create a new bean entry."""
    return crud.create_bean(db, data)


@router.get("/{bean_id}", response_model=schemas.BeanOut)
def get_bean(
    bean_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    """Get a single bean by ID."""
    bean = crud.get_bean(db, bean_id)
    if not bean:
        raise HTTPException(status_code=404, detail="Bean not found")
    return bean


@router.patch("/{bean_id}", response_model=schemas.BeanOut)
def update_bean(
    bean_id: int,
    data: schemas.BeanUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    """Update a bean's fields (partial update)."""
    bean = crud.get_bean(db, bean_id)
    if not bean:
        raise HTTPException(status_code=404, detail="Bean not found")
    return crud.update_bean(db, bean, data)


@router.delete("/{bean_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bean(
    bean_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    """Delete a bean."""
    bean = crud.get_bean(db, bean_id)
    if not bean:
        raise HTTPException(status_code=404, detail="Bean not found")
    crud.delete_bean(db, bean)
