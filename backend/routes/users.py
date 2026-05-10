from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.database import get_db, User, UserPreference
from backend.models import UserCreate, UserSchema, Token, UserPreferenceCreate
from backend.auth import get_password_hash, verify_password, create_access_token, get_current_user
from backend.config import settings

router = APIRouter()

@router.post("/auth/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(User).filter((User.username == user_in.username) | (User.email == user_in.email)).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username or email already exists in the system",
        )
    
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/auth/login", response_model=Token)
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=UserSchema)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/users/me/preferences", response_model=UserSchema)
def add_preference(
    pref_in: UserPreferenceCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Check if category already exists for user
    existing_pref = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id,
        UserPreference.category == pref_in.category
    ).first()
    
    if existing_pref:
        existing_pref.subcategories = pref_in.subcategories
        existing_pref.weight = pref_in.weight
    else:
        new_pref = UserPreference(
            user_id=current_user.id,
            category=pref_in.category,
            subcategories=pref_in.subcategories,
            weight=pref_in.weight
        )
        db.add(new_pref)
        
    db.commit()
    db.refresh(current_user)
    return current_user
