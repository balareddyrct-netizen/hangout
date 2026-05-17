from typing import Dict, List, Set
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
        # Broadcast online status to all connected users
        await self.broadcast_status(user_id, True)

    async def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        # Broadcast offline status
        await self.broadcast_status(user_id, False)

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(json.dumps(message))

    async def broadcast_status(self, user_id: int, is_online: bool):
        """Broadcast a user's online/offline status to all connected users."""
        status_msg = {
            "type": "status",
            "user_id": user_id,
            "is_online": is_online
        }
        for uid, ws in self.active_connections.items():
            if uid != user_id:
                try:
                    await ws.send_text(json.dumps(status_msg))
                except:
                    pass

    def get_online_user_ids(self) -> List[int]:
        return list(self.active_connections.keys())

manager = ConnectionManager()


@router.get("/api/chat/online")
def get_online_users():
    """Return list of currently online user IDs."""
    return {"online_users": manager.get_online_user_ids()}


@router.websocket("/ws/chat/{user_id}")
async def websocket_chat_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            msg_type = message_data.get("type", "chat")

            if msg_type == "typing_start" or msg_type == "typing_stop":
                # Forward typing indicator to the other user
                receiver_id = message_data.get("receiver_id")
                await manager.send_personal_message({
                    "type": msg_type,
                    "sender_id": user_id,
                }, receiver_id)
                continue

            if msg_type == "read_receipt":
                # Mark messages as read and notify sender
                sender_id = message_data.get("sender_id")
                db.query(Message).filter(
                    Message.sender_id == sender_id,
                    Message.receiver_id == user_id,
                    Message.read == False
                ).update({"read": True})
                db.commit()
                await manager.send_personal_message({
                    "type": "read_receipt",
                    "reader_id": user_id,
                }, sender_id)
                continue

            # Regular chat message
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
        await manager.disconnect(user_id)

@router.get("/chat/history/{friend_id}", response_model=List[MessageSchema])
def get_chat_history(friend_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    messages = db.query(Message).filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == friend_id)) |
        ((Message.sender_id == friend_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.timestamp).all()
    
    return messages
