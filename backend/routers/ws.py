"""
WebSocket implementation for real-time messaging.
"""

import asyncio
import html
import logging
from typing import Dict, List

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from jose import JWTError
from pydantic import BaseModel, validator, constr
from sqlalchemy.orm import Session

import auth as auth_utils
import models
from db import get_db
from config import security_logger

router = APIRouter(prefix="/ws", tags=["ws"])
logger = logging.getLogger(__name__)

# Track online users
ONLINE_USERS: set[int] = set()


# Message validation schema
class WSMessage(BaseModel):
    """WebSocket message schema."""

    content: constr(min_length=1, max_length=5000)  # type: ignore

    @validator('content')
    def content_must_not_be_blank(cls, v):
        """Validate content is not empty."""
        if not v.strip():
            raise ValueError('Content cannot be empty')
        return v.strip()


class ConnectionManager:
    """Manage WebSocket connections."""

    def __init__(self) -> None:
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, chat_id: int, websocket: WebSocket) -> None:
        """
        Accept new WebSocket connection.

        Args:
            chat_id: Chat ID for the connection
            websocket: WebSocket connection
        """
        await websocket.accept()
        self.active_connections.setdefault(chat_id, []).append(websocket)
        logger.debug(f"Connection added to chat {chat_id}")

    def disconnect(self, chat_id: int, websocket: WebSocket) -> None:
        """
        Remove WebSocket connection.

        Args:
            chat_id: Chat ID
            websocket: WebSocket connection to remove
        """
        if chat_id in self.active_connections:
            try:
                self.active_connections[chat_id].remove(websocket)
                if not self.active_connections[chat_id]:
                    del self.active_connections[chat_id]
                logger.debug(f"Connection removed from chat {chat_id}")
            except ValueError:
                logger.warning(f"Connection not found in chat {chat_id}")

    async def broadcast(self, chat_id: int, message: dict) -> None:
        """
        Broadcast message to all connections in a chat.

        Args:
            chat_id: Chat ID
            message: Message to broadcast
        """
        connections = self.active_connections.get(chat_id, [])
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message: {e}")

    async def send_personal(
            self, chat_id: int, websocket: WebSocket, message: dict
    ) -> None:
        """
        Send message to specific connection.

        Args:
            chat_id: Chat ID
            websocket: Specific connection
            message: Message to send
        """
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")


manager = ConnectionManager()


@router.websocket("/chats/{chat_id}")
async def websocket_chat(
        websocket: WebSocket,
        chat_id: int,
        db: Session = Depends(get_db),
):
    """
    WebSocket endpoint for real-time chat.

    Args:
        websocket: WebSocket connection
        chat_id: Chat ID
        db: Database session
    """
    # Get token from query parameters
    token = websocket.query_params.get("token")
    if not token:
        security_logger.warning(
            f"WebSocket connection rejected: missing token "
            f"from {websocket.client.host}"
        )
        await websocket.close(code=4401, reason="Missing token")
        return

    # Authenticate user
    try:
        user = auth_utils.get_current_user(db=db, token=token)
    except JWTError as e:
        security_logger.warning(
            f"WebSocket authentication failed: invalid token "
            f"from {websocket.client.host}"
        )
        await websocket.close(code=4401, reason="Invalid token")
        return
    except Exception as e:
        logger.error(f"Unexpected error in WebSocket auth: {e}")
        await websocket.close(code=4500, reason="Internal error")
        return

    # Check chat membership
    membership = (
        db.query(models.ChatUser)
        .filter(
            models.ChatUser.chat_id == chat_id,
            models.ChatUser.user_id == user.id,
        )
        .first()
    )

    if not membership:
        security_logger.warning(
            f"WebSocket access denied: user {user.username} "
            f"not member of chat {chat_id}"
        )
        await websocket.close(code=4403, reason="Not a chat member")
        return

    # Add user to online users
    ONLINE_USERS.add(user.id)
    await manager.connect(chat_id, websocket)

    logger.info(f"User {user.username} connected to chat {chat_id}")

    # Setup heartbeat task
    async def send_heartbeat():
        """Send periodic heartbeat to keep connection alive."""
        while True:
            try:
                await asyncio.sleep(30)
                await manager.send_personal(
                    chat_id,
                    websocket,
                    {"type": "ping"}
                )
            except Exception:
                break

    heartbeat_task = asyncio.create_task(send_heartbeat())

    try:
        while True:
            # Receive message from client
            try:
                data = await websocket.receive_json()
            except Exception as e:
                logger.error(f"Error receiving JSON: {e}")
                break

            # Handle ping/pong
            if data.get("type") == "pong":
                continue

            # Validate message
            try:
                message_input = WSMessage(**data)
                content = message_input.content
            except ValueError as e:
                await manager.send_personal(
                    chat_id,
                    websocket,
                    {"type": "error", "message": str(e)}
                )
                continue

            # Sanitize content
            content = html.escape(content)

            # Create message in database
            try:
                message = models.Message(
                    chat_id=chat_id,
                    sender_id=user.id,
                    content=content,
                )
                db.add(message)
                db.commit()
                db.refresh(message)
            except Exception as e:
                logger.error(f"Error saving message: {e}")
                await manager.send_personal(
                    chat_id,
                    websocket,
                    {"type": "error", "message": "Failed to save message"}
                )
                continue

            # Broadcast message to all clients
            payload = {
                "type": "message",
                "id": message.id,
                "chat_id": message.chat_id,
                "sender_id": message.sender_id,
                "sender_username": user.username,
                "content": message.content,
                "created_at": message.created_at.isoformat(),
            }

            await manager.broadcast(chat_id, payload)

    except WebSocketDisconnect:
        logger.info(f"User {user.username} disconnected from chat {chat_id}")
        manager.disconnect(chat_id, websocket)

        # Check if user still has connections in other chats
        still_online = any(
            any(
                True
                for connections in manager.active_connections.values()
            )
            for user_id in ONLINE_USERS
            if user_id == user.id
        )

        if not still_online:
            ONLINE_USERS.discard(user.id)

    except Exception as e:
        logger.error(f"Unexpected error in WebSocket: {e}")
        manager.disconnect(chat_id, websocket)
        ONLINE_USERS.discard(user.id)

    finally:
        heartbeat_task.cancel()
        try:
            await websocket.close()
        except Exception:
            pass