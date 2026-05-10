from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# User Preference Models
class UserPreferenceBase(BaseModel):
    category: str
    subcategories: List[str]
    weight: float = 1.0

class UserPreferenceCreate(UserPreferenceBase):
    pass

class UserPreferenceSchema(UserPreferenceBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# User Profile Models
class UserBase(BaseModel):
    username: str
    email: EmailStr
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UserUpdate(BaseModel):
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

class UserSchema(UserBase):
    id: int
    last_seen: datetime
    created_at: datetime
    preferences: List[UserPreferenceSchema] = []

    class Config:
        from_attributes = True

# Match result
class MatchResult(BaseModel):
    user: UserSchema
    match_percentage: float
    shared_interests: List[str]

# Chat Models
class MessageBase(BaseModel):
    content: str
    message_type: str = "text"

class MessageCreate(MessageBase):
    receiver_id: int

class MessageSchema(MessageBase):
    id: int
    sender_id: int
    receiver_id: int
    timestamp: datetime
    read: bool

    class Config:
        from_attributes = True

class ConversationSchema(BaseModel):
    friend: UserSchema
    last_message: Optional[MessageSchema] = None
    unread_count: int = 0
