"""
Message helper functions for common database operations.
"""

from datetime import datetime
from typing import List

from sqlalchemy import exists
from sqlalchemy.orm import Session

import models
import schemas
from routers.ws import manager

DELETED_MESSAGE_TEXT = "Сообщение удалено"
UNAVAILABLE_MESSAGE_TEXT = "Сообщение недоступно"


def visible_messages_query(
    db: Session,
    chat_id: int,
    user_id: int,
):
    return (
        db.query(models.Message)
        .filter(
            models.Message.chat_id == chat_id,
            ~exists().where(
                models.MessageHidden.message_id == models.Message.id,
                models.MessageHidden.user_id == user_id,
            ),
        )
    )


def build_reply_payload(
    reply_message: models.Message | None,
    current_user_id: int,
) -> schemas.MessageReply | None:
    if not reply_message:
        return None

    is_hidden_for_user = any(
        hidden.user_id == current_user_id for hidden in reply_message.hidden_for_users
    )
    if is_hidden_for_user:
        return schemas.MessageReply(
            id=reply_message.id,
            content=UNAVAILABLE_MESSAGE_TEXT,
            sender_username=None,
        )

    content = (
        DELETED_MESSAGE_TEXT if reply_message.is_deleted else reply_message.content
    )

    return schemas.MessageReply(
        id=reply_message.id,
        content=content,
        sender_username=reply_message.sender.username if reply_message.sender else None,
    )


def build_message_response(
    message: models.Message,
    username: str,
    current_user_id: int,
) -> schemas.MessageRead:
    content = DELETED_MESSAGE_TEXT if message.is_deleted else message.content
    if message.is_deleted:
        reply_payload = None
    else:
        reply_payload = build_reply_payload(message.reply_to_message, current_user_id)

    return schemas.MessageRead(
        id=message.id,
        chat_id=message.chat_id,
        sender_id=message.sender_id,
        sender_username=username,
        content=content,
        reply_to=message.reply_to,
        reply_to_message=reply_payload,
        created_at=message.created_at,
        edited_at=message.edited_at,
        deleted_at=message.deleted_at,
        delivered_at=message.delivered_at,
        read_at=message.read_at,
        file_url=None if message.is_deleted else message.file_url,
        file_name=None if message.is_deleted else message.file_name,
        file_type=None if message.is_deleted else message.file_type,
        file_size=None if message.is_deleted else message.file_size,
        is_edited=message.edited_at is not None,
        is_deleted=message.is_deleted,
    )


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
        visible_messages_query(db, chat_id, user_id)
        .filter(
            models.Message.sender_id != user_id,
            models.Message.read_at.is_(None),
            models.Message.is_deleted.is_(False),
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
    current_user_id: int,
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
        result.append(build_message_response(message, username, current_user_id))

    return result
