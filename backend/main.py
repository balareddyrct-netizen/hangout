import uvicorn
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.config import settings
from backend.database import engine, Base

# Import all models to ensure they are registered with SQLAlchemy
from backend.database import User, UserPreference, Friendship, Message

# Create database tables
Base.metadata.create_all(bind=engine)

# Import routes
from backend.routes import users, friends, chat, video, location, spots
# We will import other routes as we build them

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
app.include_router(chat.router, tags=["chat"]) # Websockets might not need the /api prefix
app.include_router(video.router, tags=["video"])

@app.get("/api")
def read_root():
    return {"message": "Welcome to Hangout API"}

# --- Static File Serving for Production ---
# This serves the built React frontend from the 'frontend/dist' directory.
frontend_build_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.exists(frontend_build_dir):
    # Mount the static assets (js, css, images)
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_build_dir, "assets")), name="assets")
    
    # Serve index.html for the root
    @app.get("/")
    async def serve_frontend_root():
        return FileResponse(os.path.join(frontend_build_dir, "index.html"))
        
    # Fallback catch-all for React Router SPA (matches any path not matched by API routes)
    # Important: this must be added LAST
    @app.api_route("/{path_name:path}", methods=["GET"])
    async def catch_all(path_name: str):
        # We don't want to catch /api or /ws calls if they were somehow missed
        if path_name.startswith("api/") or path_name.startswith("ws/"):
            return {"detail": "Not Found"}
        index_file = os.path.join(frontend_build_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"detail": "Frontend build not found"}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
