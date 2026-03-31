from typing import Dict, List

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

import auth as auth_utils
import models
from db import get_db


ONLINE_USERS: set[int] = set()

router = APIRouter(prefix="/ws", tags=["ws"])


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, chat_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(chat_id, []).append(websocket)

    def disconnect(self, chat_id: int, websocket: WebSocket) -> None:
        if chat_id in self.active_connections:
            self.active_connections[chat_id].remove(websocket)
            if not self.active_connections[chat_id]:
                del self.active_connections[chat_id]

    async def broadcast(self, chat_id: int, message: dict) -> None:
        for connection in self.active_connections.get(chat_id, []):
            await connection.send_json(message)


manager = ConnectionManager()


@router.websocket("/chats/{chat_id}")
async def websocket_chat(
    websocket: WebSocket,
    chat_id: int,
    db: Session = Depends(get_db),
):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401)
        return

    try:
        # Direct call bypasses FastAPI's Depends injection.
        user = auth_utils.get_current_user(db=db, token=token)
    except Exception:
        await websocket.close(code=4401)
        return

    membership = (
        db.query(models.ChatUser)
        .filter(
            models.ChatUser.chat_id == chat_id,
            models.ChatUser.user_id == user.id,
        )
        .first()
    )
    if not membership:
        await websocket.close(code=4403)
        return

    ONLINE_USERS.add(user.id)

    await manager.connect(chat_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            content = data.get("content")
            if not content:
                continue

            message = models.Message(
                chat_id=chat_id,
                sender_id=user.id,
                content=content,
            )
            db.add(message)
            db.commit()
            db.refresh(message)

            payload = {
                "id": message.id,
                "chat_id": message.chat_id,
                "sender_id": message.sender_id,
                "sender_username": user.username,
                "content": message.content,
                "created_at": message.created_at.isoformat(),
            }
            await manager.broadcast(chat_id, payload)
    except WebSocketDisconnect:
        manager.disconnect(chat_id, websocket)

        still_online = any(
            any(w.headers.get("x-user-id") == str(user.id) for w in connections)
            for connections in manager.active_connections.values()
        )
        if not still_online:
            ONLINE_USERS.discard(user.id)
