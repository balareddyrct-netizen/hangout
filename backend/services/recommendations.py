import httpx
from sqlalchemy.orm import Session
from backend.database import UserPreference

# Map categories to OpenStreetMap tags
CATEGORY_MAP = {
    "Food & Dining": ["restaurant", "cafe", "fast_food", "bar"],
    "Gaming": ["arcade", "video_games", "cybercafe"],
    "Sports & Fitness": ["sports_centre", "pitch", "swimming_pool", "gym"],
    "Movies & Entertainment": ["cinema", "theatre", "nightclub"],
    "Music": ["live_music", "karaoke"],
    "Travel & Adventure": ["theme_park", "attraction", "park"],
    "Art & Culture": ["museum", "gallery", "arts_centre"],
    "Tech & Coding": ["hackerspace", "cafe"],
    "Reading & Books": ["library", "books"],
    "Nightlife": ["pub", "bar", "nightclub"]
}

async def fetch_spots_from_overpass(lat: float, lon: float, radius: int = 5000, categories: list = None):
    # Using public Overpass API
    overpass_url = "http://overpass-api.de/api/interpreter"
    
    tags_to_search = []
    if categories:
        for cat in categories:
            tags = CATEGORY_MAP.get(cat, [])
            for tag in tags:
                tags_to_search.append(f'node["amenity"="{tag}"](around:{radius},{lat},{lon});')
                tags_to_search.append(f'node["leisure"="{tag}"](around:{radius},{lat},{lon});')
    
    # If no categories or mapping found, fallback to generic
    if not tags_to_search:
        tags_to_search = [f'node["amenity"~"restaurant|cafe|cinema|pub"](around:{radius},{lat},{lon});']

    query = f"""
    [out:json];
    (
      {''.join(tags_to_search)}
    );
    out center 20;
    """
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(overpass_url, data={"data": query}, timeout=10.0)
            data = response.json()
            
        spots = []
        for element in data.get("elements", []):
            if "tags" in element and "name" in element["tags"]:
                tags = element["tags"]
                spots.append({
                    "id": element["id"],
                    "name": tags["name"],
                    "lat": element["lat"],
                    "lng": element["lon"],
                    "category": tags.get("amenity") or tags.get("leisure") or "spot",
                    "rating": 4.5, # OSM doesn't typically have ratings, mock it
                    "address": tags.get("addr:street", "") + " " + tags.get("addr:housenumber", "")
                })
        return spots
    except Exception as e:
        print(f"Error fetching from Overpass API: {e}")
        # Return mock data if API fails
        return get_mock_spots(lat, lon)

def get_mock_spots(lat: float, lon: float):
    # Fallback mock data
    return [
        {
            "id": 1,
            "name": "Central Cafe & Roastery",
            "lat": lat + 0.01,
            "lng": lon + 0.01,
            "category": "cafe",
            "rating": 4.8,
            "address": "123 Main St"
        },
        {
            "id": 2,
            "name": "VR Gaming Arena",
            "lat": lat - 0.01,
            "lng": lon + 0.02,
            "category": "arcade",
            "rating": 4.6,
            "address": "456 Tech Blvd"
        },
        {
            "id": 3,
            "name": "Spicy Fusion Grill",
            "lat": lat + 0.02,
            "lng": lon - 0.01,
            "category": "restaurant",
            "rating": 4.2,
            "address": "789 Food Court"
        }
    ]
