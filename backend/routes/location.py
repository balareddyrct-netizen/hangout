from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db, User, Friendship
from backend.models import UserSchema, LocationUpdate
from backend.auth import get_current_user
from datetime import datetime

router = APIRouter()

@router.put("/location/update")
def update_location(loc_update: LocationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.latitude = loc_update.latitude
    current_user.longitude = loc_update.longitude
    current_user.last_seen = datetime.utcnow()
    db.commit()
    return {"message": "Location updated"}

@router.get("/location/friends", response_model=List[UserSchema])
def get_friends_locations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get accepted friends
    friendships = db.query(Friendship).filter(
        (Friendship.user_id == current_user.id) | (Friendship.friend_id == current_user.id),
        Friendship.status == "accepted"
    ).all()
    
    friend_ids = [f.friend_id if f.user_id == current_user.id else f.user_id for f in friendships]
    
    # Return friends with valid coordinates (exclude private profiles)
    friends = db.query(User).filter(
        User.id.in_(friend_ids),
        User.latitude.isnot(None),
        User.longitude.isnot(None),
        User.is_private == False
    ).all()
    
    return friends
