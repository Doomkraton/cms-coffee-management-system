from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import crud, schemas, models
from app.dependencies import get_db, get_current_user, require_admin

router = APIRouter()

SUPPORTED_CURRENCIES = {
    "USD", "EUR", "GBP", "CZK", "PLN", "CHF",
    "SEK", "NOK", "DKK", "JPY", "AUD", "CAD",
    "HUF", "RON", "BGN",
}


@router.get("/", response_model=schemas.InstanceSettingsOut)
def get_settings(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    """Return the current instance settings. Any authenticated user can read."""
    return crud.get_instance_settings(db)


@router.patch("/", response_model=schemas.InstanceSettingsOut)
def update_settings(
    data: schemas.InstanceSettingsUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """Update instance settings. Admin only."""
    from fastapi import HTTPException
    if data.currency and data.currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported currency '{data.currency}'. "
                   f"Supported: {sorted(SUPPORTED_CURRENCIES)}",
        )
    return crud.update_instance_settings(db, data)
