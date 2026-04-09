"""
Message endpoints - send and list messages in chats.
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import auth as auth_utils
import models
import schemas
from db import get_db
from routers.chats.utils import check_chat_membership
from routers.messages.utils import (
    mark_messages_read,
    broadcast_read_statuses,
    build_message_read_response,
)

router = APIRouter(prefix="/chats", tags=["messages"])
logger = logging.getLogger(__name__)


@router.get("/{chat_id}/messages", response_model=List[schemas.MessageRead])
async def list_messages(
        chat_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(
            auth_utils.get_current_active_user
        ),
):
    """
    Get all messages in a chat and mark them as read.

    Args:
        chat_id: Chat ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of messages in the chat

    Raises:
        HTTPException: If not a participant
    """
    # Check membership
    membership = check_chat_membership(db, chat_id, current_user.id)

    # Mark messages as read
    unread_messages = await mark_messages_read(
        db, chat_id, current_user.id, membership
    )

    # Broadcast read statuses
    if unread_messages:
        await broadcast_read_statuses(chat_id, unread_messages)

    # Get messages
    messages = (
        db.query(models.Message, models.User.username)
        .join(models.User, models.User.id == models.Message.sender_id)
        .filter(models.Message.chat_id == chat_id)
        .order_by(models.Message.created_at.asc())
        .all()
    )

    return build_message_read_response(messages)


@router.post("/{chat_id}/messages", response_model=schemas.MessageRead)
async def send_message(
        chat_id: int,
        message_in: schemas.MessageCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(
            auth_utils.get_current_active_user
        ),
):
    """
    Send a message in a chat (via REST API).

    Args:
        chat_id: Chat ID
        message_in: Message content
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created message object

    Raises:
        HTTPException: If not a participant
    """
    import html

    # Check membership
    check_chat_membership(db, chat_id, current_user.id)

    # Sanitize content
    content = html.escape(message_in.content)

    # Create message
    message = models.Message(
        chat_id=chat_id,
        sender_id=current_user.id,
        content=content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    logger.info(f"Message {message.id} created in chat {chat_id}")

    return schemas.MessageRead(
        id=message.id,
        chat_id=message.chat_id,
        sender_id=message.sender_id,
        sender_username=current_user.username,
        content=message.content,
        created_at=message.created_at,
        delivered_at=message.delivered_at,
        read_at=message.read_at,
    )
