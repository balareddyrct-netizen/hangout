from sqlalchemy.orm import Session
from backend.database import User, UserPreference
import math

def calculate_distance(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return None
    
    # Haversine formula
    R = 6371 # Earth radius in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def find_matches(db: Session, current_user: User):
    # Get current user's preferences
    user_prefs = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).all()
    if not user_prefs:
        return []

    user_pref_dict = {p.category: set(p.subcategories) for p in user_prefs}
    
    # Get other users (exclude private profiles)
    other_users = db.query(User).filter(User.id != current_user.id, User.is_private == False).all()
    
    matches = []
    
    for other in other_users:
        other_prefs = db.query(UserPreference).filter(UserPreference.user_id == other.id).all()
        if not other_prefs:
            continue
            
        other_pref_dict = {p.category: set(p.subcategories) for p in other_prefs}
        
        shared_interests = []
        score = 0
        total_possible = len(user_pref_dict) * 10 # arbitrary max per category
        
        for category, subcategories in user_pref_dict.items():
            if category in other_pref_dict:
                other_subcategories = other_pref_dict[category]
                overlap = subcategories.intersection(other_subcategories)
                if overlap:
                    score += len(overlap) * 5
                    shared_interests.extend(list(overlap))
                else:
                    score += 2 # Shared category but different subcategories
        
        # Calculate distance
        distance = calculate_distance(current_user.latitude, current_user.longitude, other.latitude, other.longitude)
        
        # Distance bonus (closer is better, max 20 points if within 5km)
        if distance is not None:
            if distance <= 5:
                score += 20
            elif distance <= 20:
                score += 10
            elif distance <= 50:
                score += 5
                
        match_percentage = min(100, int((score / (total_possible + 20)) * 100))
        
        if match_percentage > 10: # Only return somewhat relevant matches
            matches.append({
                "user": other,
                "match_percentage": match_percentage,
                "shared_interests": shared_interests
            })
            
    # Sort by highest match percentage
    matches.sort(key=lambda x: x["match_percentage"], reverse=True)
    return matches
