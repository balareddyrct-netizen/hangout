import uvicorn
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.config import settings
from backend.database import engine, Base

# Import all models to ensure they are registered with SQLAlchemy
from backend.database import User, UserPreference, Friendship, Message, OTPCode

# Create database tables
Base.metadata.create_all(bind=engine)

# Import routes
from backend.routes import users, friends, chat, video, location, spots

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix=settings.API_V1_STR, tags=["users"])
app.include_router(friends.router, prefix=settings.API_V1_STR, tags=["friends"])
app.include_router(location.router, prefix=settings.API_V1_STR, tags=["location"])
app.include_router(spots.router, prefix=settings.API_V1_STR, tags=["spots"])
app.include_router(chat.router, tags=["chat"])
app.include_router(video.router, tags=["video"])

@app.get("/api")
def read_root():
    return {"message": "Welcome to Hangout API"}

# --- Mount uploads directory for photo serving ---
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# --- Static File Serving for Production ---
frontend_build_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.exists(frontend_build_dir):
    # Mount the static assets (js, css, images)
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_build_dir, "assets")), name="assets")
    
    # Serve index.html for the root
    @app.get("/")
    async def serve_frontend_root():
        return FileResponse(os.path.join(frontend_build_dir, "index.html"))
        
    # Serve favicon and other public files
    @app.get("/favicon.svg")
    async def serve_favicon():
        fav_path = os.path.join(frontend_build_dir, "favicon.svg")
        if os.path.exists(fav_path):
            return FileResponse(fav_path)
        return {"detail": "Not Found"}
        
    # Fallback catch-all for React Router SPA
    @app.api_route("/{path_name:path}", methods=["GET"])
    async def catch_all(path_name: str):
        if path_name.startswith("api/") or path_name.startswith("ws/") or path_name.startswith("uploads/"):
            return {"detail": "Not Found"}
        index_file = os.path.join(frontend_build_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"detail": "Frontend build not found"}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
