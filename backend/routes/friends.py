from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db, User, Friendship
from backend.models import UserSchema, MatchResult
from backend.auth import get_current_user
from backend.services.matching import find_matches

router = APIRouter()

@router.get("/friends/discover", response_model=List[MatchResult])
def discover_friends(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    matches = find_matches(db, current_user)
    return matches

@router.get("/friends", response_model=List[UserSchema])
def get_friends(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Friends are users where a friendship exists and is accepted
    friendships = db.query(Friendship).filter(
        (Friendship.user_id == current_user.id) | (Friendship.friend_id == current_user.id),
        Friendship.status == "accepted"
    ).all()
    
    friend_ids = [f.friend_id if f.user_id == current_user.id else f.user_id for f in friendships]
    friends = db.query(User).filter(User.id.in_(friend_ids)).all()
    return friends

@router.post("/friends/request/{target_user_id}")
def send_friend_request(target_user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if target_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send request to yourself")
        
    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if request already exists
    existing = db.query(Friendship).filter(
        ((Friendship.user_id == current_user.id) & (Friendship.friend_id == target_user_id)) |
        ((Friendship.user_id == target_user_id) & (Friendship.friend_id == current_user.id))
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Friendship or request already exists")
        
    friendship = Friendship(user_id=current_user.id, friend_id=target_user_id, status="pending")
    db.add(friendship)
    db.commit()
    return {"message": "Friend request sent"}

@router.get("/friends/requests")
def get_friend_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    requests = db.query(Friendship).filter(
        Friendship.friend_id == current_user.id,
        Friendship.status == "pending"
    ).all()
    
    result = []
    for req in requests:
        user = db.query(User).filter(User.id == req.user_id).first()
        result.append({
            "request_id": req.id,
            "user": user
        })
    return result

@router.put("/friends/request/{request_id}")
def respond_friend_request(request_id: int, action: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if action not in ["accept", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    req = db.query(Friendship).filter(Friendship.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.friend_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your request")
        
    if action == "accept":
        req.status = "accepted"
    else:
        db.delete(req)
        
    db.commit()
    return {"message": f"Request {action}ed"}
