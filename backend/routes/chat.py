from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from backend.database import get_db, Message, User
from backend.auth import get_current_user
from backend.models import MessageSchema
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps user_id to WebSocket connection
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(json.dumps(message))

manager = ConnectionManager()

@router.websocket("/ws/chat/{user_id}")
async def websocket_chat_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    # Note: Real auth would pass token in query param or headers, but for simplicity
    # we assume the connection URL is correct.
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Save to db
            receiver_id = message_data.get("receiver_id")
            content = message_data.get("content")
            
            new_message = Message(
                sender_id=user_id,
                receiver_id=receiver_id,
                content=content
            )
            db.add(new_message)
            db.commit()
            db.refresh(new_message)
            
            # Send to receiver
            msg_dict = {
                "id": new_message.id,
                "sender_id": user_id,
                "receiver_id": receiver_id,
                "content": content,
                "timestamp": new_message.timestamp.isoformat(),
                "type": "chat"
            }
            await manager.send_personal_message(msg_dict, receiver_id)
            
            # Echo back to sender for confirmation
            await manager.send_personal_message(msg_dict, user_id)
            
    except WebSocketDisconnect:
        manager.disconnect(user_id)

@router.get("/chat/history/{friend_id}", response_model=List[MessageSchema])
def get_chat_history(friend_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    messages = db.query(Message).filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == friend_id)) |
        ((Message.sender_id == friend_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.timestamp).all()
    
    return messages
