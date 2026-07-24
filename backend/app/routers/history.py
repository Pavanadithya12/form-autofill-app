from typing import List
from fastapi import APIRouter
from app.database import get_extraction_history

router = APIRouter(prefix="/history", tags=["History"])

@router.get("", response_model=List[dict])
async def fetch_history(limit: int = 20):
    return await get_extraction_history(limit=limit)
