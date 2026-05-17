from backend.database import SessionLocal, engine, Base, User, UserPreference, Friendship
from backend.auth import get_password_hash

def seed_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(User).count() > 0:
        print("Database already seeded.")
        db.close()
        return

    print("Seeding users...")
    users_data = [
        {"username": "alex", "email": "alex@example.com", "lat": 40.7128, "lon": -74.0060, "bio": "Love gaming and pizza", "avatar_url": "https://i.pravatar.cc/150?u=alex"},
        {"username": "sarah", "email": "sarah@example.com", "lat": 40.7130, "lon": -74.0065, "bio": "Coffee addict, bookworm", "avatar_url": "https://i.pravatar.cc/150?u=sarah"},
        {"username": "mike", "email": "mike@example.com", "lat": 40.7125, "lon": -74.0050, "bio": "Tech enthusiast", "avatar_url": "https://i.pravatar.cc/150?u=mike"},
        {"username": "emma", "email": "emma@example.com", "lat": 40.7140, "lon": -74.0070, "bio": "Foodie and traveler", "avatar_url": "https://i.pravatar.cc/150?u=emma"},
    ]
    
    db_users = []
    for u in users_data:
        user = User(
            username=u["username"],
            email=u["email"],
            hashed_password=get_password_hash("password123"), # Default password
            bio=u["bio"],
            avatar_url=u["avatar_url"],
            latitude=u["lat"],
            longitude=u["lon"],
            is_verified=True,
        )
        db.add(user)
        db_users.append(user)
        
    db.commit()
    
    print("Seeding preferences...")
    # Refresh to get IDs
    for u in db_users:
        db.refresh(u)
        
    prefs = [
        # Alex: Gaming, Food
        UserPreference(user_id=db_users[0].id, category="Gaming", subcategories=["video_games", "arcade"], weight=1.5),
        UserPreference(user_id=db_users[0].id, category="Food & Dining", subcategories=["pizza", "fast_food"], weight=1.0),
        # Sarah: Reading, Coffee
        UserPreference(user_id=db_users[1].id, category="Reading & Books", subcategories=["library", "books"], weight=1.2),
        UserPreference(user_id=db_users[1].id, category="Food & Dining", subcategories=["cafe", "coffee"], weight=1.5),
        # Mike: Tech, Gaming
        UserPreference(user_id=db_users[2].id, category="Tech & Coding", subcategories=["hackerspace", "cafe"], weight=2.0),
        UserPreference(user_id=db_users[2].id, category="Gaming", subcategories=["video_games", "pc"], weight=1.0),
        # Emma: Food, Travel
        UserPreference(user_id=db_users[3].id, category="Food & Dining", subcategories=["restaurant", "fine_dining", "cafe"], weight=1.8),
        UserPreference(user_id=db_users[3].id, category="Travel & Adventure", subcategories=["park", "attraction"], weight=1.5),
    ]
    
    for p in prefs:
        db.add(p)
        
    db.commit()
    print("Seeding complete! Default password for all accounts is 'password123'")
    db.close()

if __name__ == "__main__":
    seed_db()
