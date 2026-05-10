# Hangout 🤙

Hangout is a Python-based social application where users can discover like-minded people, chat, video call, find nearby hangout spots based on shared interests, and see friends on a live map.

## Features

- 🤝 **Smart Matching**: Finds people with similar interests and ranks them by match percentage.
- 💬 **Real-time Chat**: Lightning-fast messaging powered by WebSockets.
- 📹 **Video Calling**: Peer-to-peer WebRTC video calling.
- 📍 **Hangout Spots**: Discover nearby restaurants, arcades, and parks tailored to your specific tastes using OpenStreetMap data.
- 🗺️ **Snap Map**: See where your friends are in real-time on a beautiful dark-themed map.

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite, WebSockets
- **Frontend**: Vite, React, React Router, Leaflet.js
- **Styling**: Vanilla CSS with a premium dark-mode glassmorphism design.

## Setup & Installation

1. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Mac/Linux
   source venv/bin/activate
   ```

2. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   python run.py
   ```

The script will automatically install frontend NPM dependencies, create the database, seed it with demo users, and start both the backend and frontend servers.

- **Frontend**: http://localhost:5173
- **Backend API Docs**: http://localhost:8000/api/openapi.json

## Demo Accounts

The database is pre-seeded with several test accounts. The password for all of them is `password123`.
- `alex` (Gaming, Food)
- `sarah` (Reading, Coffee)
- `mike` (Tech, Gaming)
- `emma` (Food, Travel)
