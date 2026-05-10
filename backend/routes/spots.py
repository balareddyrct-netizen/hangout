from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.database import get_db, User, UserPreference
from backend.auth import get_current_user
from backend.services.recommendations import fetch_spots_from_overpass

router = APIRouter()

@router.get("/spots/recommend")
async def recommend_spots(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    radius: int = Query(5000, description="Radius in meters"),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Get user preferences to filter spots
    user_prefs = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).all()
    categories = [p.category for p in user_prefs]
    
    # Fetch spots
    spots = await fetch_spots_from_overpass(lat, lon, radius, categories)
    
    return spots
