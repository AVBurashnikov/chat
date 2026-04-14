"""
Message helper functions for common database operations.
"""

from datetime import datetime
from typing import List

from sqlalchemy.orm import Session

import models
import schemas
from routers.ws import manager


async def mark_messages_read(
    db: Session,
    chat_id: int,
    user_id: int,
    membership: models.ChatUser,
) -> List[models.Message]:
    """
    Mark all unread incoming messages as read.

    Args:
        db: Database session
        chat_id: Chat ID
        user_id: Current user ID
        membership: ChatUser membership record

    Returns:
        List of messages that were marked as read
    """
    read_at = datetime.utcnow()
    membership.last_read_at = read_at
    db.add(membership)

    # Mark all incoming messages as delivered and read
    unread_messages = (
        db.query(models.Message)
        .filter(
            models.Message.chat_id == chat_id,
            models.Message.sender_id != user_id,
            models.Message.read_at.is_(None),
        )
        .all()
    )

    for message in unread_messages:
        message.read_at = read_at
        if message.delivered_at is None:
            message.delivered_at = read_at
        db.add(message)

    db.commit()

    return unread_messages


async def broadcast_read_statuses(
    chat_id: int,
    unread_messages: List[models.Message],
) -> None:
    """
    Broadcast read status for multiple messages via WebSocket.

    Args:
        chat_id: Chat ID
        unread_messages: List of messages that were marked as read
    """
    for message in unread_messages:
        await manager.broadcast_status(
            chat_id,
            {
                "type": "message_status",
                "id": message.id,
                "delivered_at": message.delivered_at.isoformat() if message.delivered_at else None,
                "read_at": message.read_at.isoformat() if message.read_at else None,
            }
        )


def build_message_read_response(
    messages_with_usernames: List,
) -> List[schemas.MessageRead]:
    """
    Convert message tuples with usernames to MessageRead schemas.

    Args:
        messages_with_usernames: List of (Message, username) tuples

    Returns:
        List of MessageRead schemas
    """
    result: List[schemas.MessageRead] = []
    for message, username in messages_with_usernames:
        result.append(
            schemas.MessageRead(
                id=message.id,
                chat_id=message.chat_id,
                sender_id=message.sender_id,
                sender_username=username,
                content=message.content,
                created_at=message.created_at,
                delivered_at=message.delivered_at,
                read_at=message.read_at,
                file_url=message.file_url,
                file_name=message.file_name,
                file_type=message.file_type,
                file_size=message.file_size,
            )
        )

    return result
