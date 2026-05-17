import os
import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.database import get_db, User, UserPreference
from backend.models import UserCreate, UserSchema, Token, UserPreferenceCreate, OTPRequest, OTPVerify, UserProfileUpdate
from backend.auth import get_password_hash, verify_password, create_access_token, get_current_user
from backend.config import settings
from backend.services.email_otp import create_and_send_otp, verify_otp as verify_otp_code

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


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
        is_verified=False,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Send OTP
    create_and_send_otp(user_in.email, db)

    return db_user


@router.post("/auth/verify-otp")
def verify_otp_endpoint(otp_data: OTPVerify, db: Session = Depends(get_db)):
    success = verify_otp_code(otp_data.email, otp_data.code, db)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code.")
    
    # Mark user as verified
    user = db.query(User).filter(User.email == otp_data.email).first()
    if user:
        user.is_verified = True
        db.commit()
    
    return {"message": "Email verified successfully!"}


@router.post("/auth/resend-otp")
def resend_otp(otp_req: OTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == otp_req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email.")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified.")
    
    create_and_send_otp(otp_req.email, db)
    return {"message": "OTP resent successfully."}


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


@router.put("/users/me/profile", response_model=UserSchema)
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_data.bio is not None:
        current_user.bio = profile_data.bio
    if profile_data.avatar_url is not None:
        current_user.avatar_url = profile_data.avatar_url
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone
    if profile_data.location_city is not None:
        current_user.location_city = profile_data.location_city
    if profile_data.is_private is not None:
        current_user.is_private = profile_data.is_private
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/users/me/upload-photo", response_model=UserSchema)
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, and GIF images are allowed.")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Save file
    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)
    
    # Update user photos list
    photo_url = f"/uploads/{filename}"
    photos = current_user.photos or []
    photos.append(photo_url)
    current_user.photos = photos
    
    # If no avatar set, use first photo
    if not current_user.avatar_url:
        current_user.avatar_url = photo_url
    
    db.commit()
    db.refresh(current_user)
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
