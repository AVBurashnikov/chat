"""
WebSocket endpoints for real-time messaging and notifications.
"""

import asyncio
import logging

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from jose import JWTError
from pydantic import BaseModel, validator, constr
from sqlalchemy.orm import Session

import auth as auth_utils
import models
from db import get_db
from config import security_logger
from routers.ws.manager import ConnectionManager, notification_manager
from routers.ws.handlers import (
    handle_read_receipt,
    handle_new_message,
    mark_pending_messages_delivered,
)

router = APIRouter(prefix="/ws", tags=["ws"])
logger = logging.getLogger(__name__)

# Track online users
ONLINE_USERS: set[int] = set()

# Global chat connection manager
manager = ConnectionManager()


def get_other_participant_for_presence(
        db: Session,
        chat_id: int,
        current_user_id: int,
):
    """Local helper to avoid circular import with routers.chats.utils."""
    return (
        db.query(models.User)
        .join(models.ChatUser, models.ChatUser.user_id == models.User.id)
        .filter(
            models.ChatUser.chat_id == chat_id,
            models.User.id != current_user_id,
        )
        .first()
    )


class WSMessage(BaseModel):
    """WebSocket message schema."""

    content: constr(min_length=1, max_length=5000)  # type: ignore
    reply_to: int | None = None

    @validator('content')
    def content_must_not_be_blank(cls, v):
        """Validate content is not empty."""
        if not v.strip():
            raise ValueError('Content cannot be empty')
        return v.strip()


class WSTyping(BaseModel):
    """WebSocket typing indicator schema."""

    type: str = "typing"
    is_typing: bool = True


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
    await manager.connect(chat_id, websocket, user.id)

    # Mark pending messages as delivered
    try:
        await mark_pending_messages_delivered(manager, chat_id, user.id, db)
    except Exception as e:
        logger.error(f"Error marking pending messages: {e}")

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

            # Handle read receipts from client
            if data.get("type") == "read":
                try:
                    await handle_read_receipt(manager, chat_id, user.id, membership, db)
                except Exception as e:
                    logger.error(f"Error handling read receipt: {e}")
                    await manager.send_personal(
                        chat_id,
                        websocket,
                        {"type": "error", "message": "Failed to update read status"}
                    )
                continue

            # Handle typing indicators from client
            if data.get("type") == "typing":
                try:
                    is_typing = bool(data.get("is_typing", True))
                    typing_payload = {
                        "type": "typing",
                        "user_id": user.id,
                        "username": user.username,
                        "chat_id": chat_id,
                        "is_typing": is_typing,
                    }
                    await notify_chat_participants(db, chat_id, user.id, typing_payload)
                except Exception as e:
                    logger.error(f"Error handling typing indicator: {e}")
                continue

            # Validate message
            try:
                message_input = WSMessage(**data)
                content = message_input.content
                reply_to = message_input.reply_to
            except ValueError as e:
                await manager.send_personal(
                    chat_id,
                    websocket,
                    {"type": "error", "message": str(e)}
                )
                continue

            # Handle new message
            try:
                payload = await handle_new_message(
                    manager,
                    chat_id,
                    user.id,
                    user.username,
                    content,
                    db,
                    reply_to=reply_to,
                )
                if payload:
                    await manager.broadcast(chat_id, payload)
            except Exception as e:
                logger.error(f"Error handling new message: {e}")
                await manager.send_personal(
                    chat_id,
                    websocket,
                    {"type": "error", "message": "Failed to save message"}
                )

    except WebSocketDisconnect:
        logger.info(f"User {user.username} disconnected from chat {chat_id}")
        manager.disconnect(chat_id, websocket)

        # Check if user still has connections in other chats
        still_online = any(
            uid == user.id
            for connections in manager.active_connections.values()
            for (_, uid) in connections
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


@router.websocket("/notifications")
async def websocket_notifications(
        websocket: WebSocket,
        db: Session = Depends(get_db),
):
    """
    WebSocket endpoint for user-scoped notifications.

    Args:
        websocket: WebSocket connection
        db: Database session
    """
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401, reason="Missing token")
        return

    try:
        user = auth_utils.get_current_user(db=db, token=token)
    except JWTError:
        await websocket.close(code=4401, reason="Invalid token")
        return
    except Exception as error:
        logger.error(f"Unexpected error in notifications auth: {error}")
        await websocket.close(code=4500, reason="Internal error")
        return

    await notification_manager.connect(user.id, websocket)
    logger.info(f"User {user.username} connected to notifications")

    # Notify user's chat participants that this user is online
    user_chats = (
        db.query(models.Chat)
        .join(models.ChatUser)
        .filter(
            models.ChatUser.user_id == user.id,
            models.Chat.is_private.is_(True),
            models.ChatUser.archived.is_(False),
        )
        .all()
    )

    for chat in user_chats:
        other = get_other_participant_for_presence(db, chat.id, user.id)
        if not other:
            continue
        await notification_manager.send_to_user(
            other.id,
            {
                "type": "presence",
                "chat_id": chat.id,
                "user_id": user.id,
                "is_online": True,
            },
        )

    async def send_heartbeat():
        """Send periodic heartbeat to keep notification connection alive."""
        while True:
            try:
                await asyncio.sleep(30)
                await websocket.send_json({"type": "ping"})
            except Exception:
                break

    heartbeat_task = asyncio.create_task(send_heartbeat())

    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "pong":
                continue
    except WebSocketDisconnect:
        logger.info(f"User {user.username} disconnected from notifications")
        notification_manager.disconnect(user.id, websocket)

        # If user has no remaining notifications connections, broadcast offline
        if not notification_manager.is_user_online(user.id):
            user_chats = (
                db.query(models.Chat)
                .join(models.ChatUser)
                .filter(
                    models.ChatUser.user_id == user.id,
                    models.Chat.is_private.is_(True),
                    models.ChatUser.archived.is_(False),
                )
                .all()
            )

            for chat in user_chats:
                other = get_other_participant_for_presence(db, chat.id, user.id)
                if not other:
                    continue
                await notification_manager.send_to_user(
                    other.id,
                    {
                        "type": "presence",
                        "chat_id": chat.id,
                        "user_id": user.id,
                        "is_online": False,
                    },
                )
    except Exception as error:
        logger.error(f"Unexpected error in notification WebSocket: {error}")
        notification_manager.disconnect(user.id, websocket)
        if not notification_manager.is_user_online(user.id):
            user_chats = (
                db.query(models.Chat)
                .join(models.ChatUser)
                .filter(
                    models.ChatUser.user_id == user.id,
                    models.Chat.is_private.is_(True),
                    models.ChatUser.archived.is_(False),
                )
                .all()
            )

            for chat in user_chats:
                other = get_other_participant_for_presence(db, chat.id, user.id)
                if not other:
                    continue
                await notification_manager.send_to_user(
                    other.id,
                    {
                        "type": "presence",
                        "chat_id": chat.id,
                        "user_id": user.id,
                        "is_online": False,
                    },
                )
    finally:
        heartbeat_task.cancel()
        try:
            await websocket.close()
        except Exception:
            pass
