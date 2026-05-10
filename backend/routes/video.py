from typing import Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json

router = APIRouter()

class SignalingManager:
    def __init__(self):
        # Maps user_id to WebSocket connection
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_signal(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(json.dumps(message))

signal_manager = SignalingManager()

@router.websocket("/ws/video/{user_id}")
async def websocket_video_endpoint(websocket: WebSocket, user_id: int):
    await signal_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            signal_data = json.loads(data)
            
            target_id = signal_data.get("target_id")
            
            # Forward the signaling message (offer, answer, ice-candidate)
            if target_id:
                # Attach the sender's id
                signal_data["sender_id"] = user_id
                await signal_manager.send_signal(signal_data, target_id)
                
    except WebSocketDisconnect:
        signal_manager.disconnect(user_id)
        # Notify others that this user disconnected (simplified for now)
