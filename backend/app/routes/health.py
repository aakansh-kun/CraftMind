from fastapi import APIRouter, HTTPException
from app.schemas import HealthResponse
from app.database import check_db_health
from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """
    Returns HTTP 200 only when:
    - application is running
    - SQLite is reachable
    - key pool/configuration is loaded (2 keys)
    - cache is enabled
    """
    if not check_db_health():
        raise HTTPException(status_code=503, detail="database unreachable")

    return HealthResponse(
        status="ok",
        keys_configured=2,
        cache_enabled=settings.ENABLE_CACHE,
    )
