"""
WebSocket message handlers for different message types.
"""

import html
import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

import models
from routers.ws.manager import ConnectionManager, notification_manager
from routers.ws.status import broadcast_read_status, broadcast_multiple_read_statuses

logger = logging.getLogger(__name__)
DELETED_MESSAGE_TEXT = "Сообщение удалено"


async def notify_chat_participants(
    db: Session,
    chat_id: int,
    sender_id: int,
    payload: dict,
) -> None:
    """
    Send notification payload to all chat participants except the sender.

    Args:
        db: Database session
        chat_id: Chat ID
        sender_id: Sender user ID
        payload: Notification payload
    """
    recipient_ids = (
        db.query(models.ChatUser.user_id)
        .filter(
            models.ChatUser.chat_id == chat_id,
            models.ChatUser.user_id != sender_id,
        )
        .all()
    )

    for (recipient_id,) in recipient_ids:
        await notification_manager.send_to_user(recipient_id, payload)


async def handle_read_receipt(
    manager: ConnectionManager,
    chat_id: int,
    user_id: int,
    membership: models.ChatUser,
    db: Session,
) -> None:
    """
    Handle read receipt from client - mark messages as read.

    Args:
        manager: Connection manager
        chat_id: Chat ID
        user_id: Current user ID
        membership: ChatUser membership record
        db: Database session
    """
    try:
        read_at = datetime.utcnow()
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

        membership.last_read_at = read_at
        db.add(membership)
        db.commit()

        # Broadcast status updates
        await broadcast_multiple_read_statuses(
            manager,
            chat_id,
            unread_messages,
        )
    except Exception as e:
        logger.error(f"Error updating read state: {e}")
        raise


async def handle_new_message(
    manager: ConnectionManager,
    chat_id: int,
    user_id: int,
    username: str,
    content: str,
    db: Session,
    reply_to: int | None = None,
) -> Optional[dict]:
    """
    Handle new message - save to DB and prepare broadcast payload.

    Args:
        manager: Connection manager
        chat_id: Chat ID
        user_id: Sender user ID
        username: Sender username
        content: Message content
        db: Database session

    Returns:
        Broadcast payload dict or None if error

    Raises:
        Exception: If database operations fail
    """
    try:
        # Sanitize content
        safe_content = html.escape(content)

        reply_message = None

        if reply_to:
            reply_message = (
                db.query(models.Message)
                .join(models.User, models.User.id == models.Message.sender_id)
                .filter(
                    models.Message.id == reply_to,
                    models.Message.chat_id == chat_id
                )
                .first()
            )

        # Check if message should be marked as delivered
        delivered = manager.has_other_connections(chat_id, user_id)

        # Create message in database
        message = models.Message(
            chat_id=chat_id,
            sender_id=user_id,
            content=safe_content,
            delivered_at=datetime.utcnow() if delivered else None,
            reply_to=reply_to,
        )
        db.add(message)
        db.commit()
        db.refresh(message)

        reply_payload = None

        if message.reply_to:
            reply_msg = (
                db.query(models.Message)
                .filter(models.Message.id == message.reply_to)
                .first()
            )

            if reply_msg:
                reply_payload = {
                    "id": reply_msg.id,
                    "content": DELETED_MESSAGE_TEXT if reply_msg.is_deleted else reply_msg.content,
                    "sender_username": reply_msg.sender.username,
                }

        # Prepare broadcast payload
        payload = {
            "type": "message",
            "id": message.id,
            "chat_id": message.chat_id,
            "sender_id": message.sender_id,
            "sender_username": username,
            "content": message.content,
            "created_at": message.created_at.isoformat(),
            "edited_at": None,
            "deleted_at": None,
            "delivered_at": message.delivered_at.isoformat() if message.delivered_at else None,
            "read_at": message.read_at.isoformat() if message.read_at else None,
            "reply_to": message.reply_to,
            "reply_to_message": reply_payload,
            "is_edited": False,
            "is_deleted": False,
        }

        await notify_chat_participants(
            db,
            chat_id,
            user_id,
            {
                "type": "new_message",
                "chat_id": message.chat_id,
                "message_id": message.id,
                "sender_id": message.sender_id,
                "sender_username": username,
                "preview": message.content,
                "created_at": message.created_at.isoformat(),
            },
        )

        return payload

    except Exception as e:
        logger.error(f"Error saving message: {e}")
        raise


async def mark_pending_messages_delivered(
    manager: ConnectionManager,
    chat_id: int,
    user_id: int,
    db: Session,
) -> None:
    """
    Mark pending messages as delivered when user connects.

    Args:
        manager: Connection manager
        chat_id: Chat ID
        user_id: Current user ID
        db: Database session
    """
    try:
        pending_messages = (
            db.query(models.Message)
            .filter(
                models.Message.chat_id == chat_id,
                models.Message.sender_id != user_id,
                models.Message.delivered_at.is_(None),
            )
            .all()
        )

        if pending_messages:
            delivered_at = datetime.utcnow()
            for message in pending_messages:
                message.delivered_at = delivered_at
            db.commit()

            # Broadcast delivery status
            await broadcast_multiple_read_statuses(
                manager,
                chat_id,
                pending_messages,
            )

    except Exception as e:
        logger.error(f"Error marking pending messages as delivered: {e}")
        raise
