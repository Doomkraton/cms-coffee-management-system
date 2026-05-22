from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import crud, schemas, models
from app.dependencies import get_db, get_current_user

router = APIRouter()


@router.get("/", response_model=list[schemas.BrewMethodOut])
def list_methods(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    return crud.get_brew_methods(db)


@router.post("/", response_model=schemas.BrewMethodOut, status_code=status.HTTP_201_CREATED)
def create_method(
    data: schemas.BrewMethodCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    return crud.create_brew_method(db, data)


@router.get("/{method_id}", response_model=schemas.BrewMethodOut)
def get_method(
    method_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    method = crud.get_brew_method(db, method_id)
    if not method:
        raise HTTPException(status_code=404, detail="Brew method not found")
    return method


@router.patch("/{method_id}", response_model=schemas.BrewMethodOut)
def update_method(
    method_id: int,
    data: schemas.BrewMethodUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    method = crud.get_brew_method(db, method_id)
    if not method:
        raise HTTPException(status_code=404, detail="Brew method not found")
    return crud.update_brew_method(db, method, data)


@router.delete("/{method_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_method(
    method_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    method = crud.get_brew_method(db, method_id)
    if not method:
        raise HTTPException(status_code=404, detail="Brew method not found")
    crud.delete_brew_method(db, method)
