"""
Chat endpoints with security validation.
"""

import logging
import html
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

import auth as auth_utils
import models
import schemas
from db import get_db
from routers.ws import ONLINE_USERS

router = APIRouter(prefix="/chats", tags=["chats"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[schemas.ChatRead])
async def list_chats(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(
            auth_utils.get_current_active_user
        ),
):
    """
    List all chats for the current user.

    Returns:
        List of user's chats with unread counts and online status
    """
    chats = (
        db.query(models.Chat)
        .join(models.ChatUser)
        .filter(models.ChatUser.user_id == current_user.id)
        .all()
    )

    result: List[schemas.ChatRead] = []
    for chat in chats:
        # Get chat user record for current user
        cu = (
            db.query(models.ChatUser)
            .filter(
                models.ChatUser.chat_id == chat.id,
                models.ChatUser.user_id == current_user.id,
            )
            .first()
        )

        last_read = cu.last_read_at if cu else None

        # Count unread messages
        unread_q = db.query(func.count(models.Message.id)).filter(
            models.Message.chat_id == chat.id,
            models.Message.sender_id != current_user.id,
        )

        if last_read is not None:
            unread_q = unread_q.filter(
                models.Message.created_at > last_read
            )

        unread_count = unread_q.scalar() or 0

        # Determine chat title and online status
        other_online = False
        if chat.is_private:
            other = (
                db.query(models.User)
                .join(
                    models.ChatUser,
                    models.ChatUser.user_id == models.User.id
                )
                .filter(
                    models.ChatUser.chat_id == chat.id,
                    models.User.id != current_user.id,
                )
                .first()
            )

            other_online = bool(
                other and (other.id in ONLINE_USERS)
            )
            title = other.username if other else f"Chat {chat.id}"
        else:
            title = chat.title or f"Chat {chat.id}"

        result.append(
            schemas.ChatRead(
                id=chat.id,
                title=title,
                is_private=chat.is_private,
                created_at=chat.created_at,
                unread_count=unread_count,
                other_online=other_online
            )
        )

    return result


@router.post("/", response_model=schemas.ChatRead)
async def create_chat(
        chat_in: schemas.ChatCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(
            auth_utils.get_current_active_user
        ),
):
    """
    Create a new private chat with another user.

    Args:
        chat_in: Chat creation data with participant username
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created chat object

    Raises:
        HTTPException: If validation fails or participant not found
    """
    # Validate: can't create chat with yourself
    if chat_in.participant_username == current_user.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create chat with yourself",
        )

    # Find participant
    participant = (
        db.query(models.User)
        .filter(
            models.User.username == chat_in.participant_username
        )
        .first()
    )

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found",
        )

    # Check if chat already exists
    existing_chat = (
        db.query(models.Chat)
        .join(models.ChatUser)
        .filter(
            models.ChatUser.user_id.in_([current_user.id, participant.id])
        )
        .group_by(models.Chat.id)
        .having(func.count(models.ChatUser.user_id) == 2)
        .first()
    )

    if existing_chat:
        return existing_chat

    # Create new chat
    chat = models.Chat(title=None, is_private=True)
    db.add(chat)
    db.flush()

    # Add participants
    db.add_all(
        [
            models.ChatUser(chat_id=chat.id, user_id=current_user.id),
            models.ChatUser(chat_id=chat.id, user_id=participant.id),
        ]
    )
    db.commit()
    db.refresh(chat)

    logger.info(
        f"Chat created between {current_user.username} "
        f"and {participant.username}"
    )

    return chat


@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
        chat_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(
            auth_utils.get_current_active_user
        ),
):
    """
    Delete a chat (only for participants).

    Args:
        chat_id: ID of chat to delete
        db: Database session
        current_user: Current authenticated user

    Raises:
        HTTPException: If not a participant or chat not found
    """
    # Check membership
    membership = (
        db.query(models.ChatUser)
        .filter(
            models.ChatUser.chat_id == chat_id,
            models.ChatUser.user_id == current_user.id,
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant of this chat",
        )

    # Get and delete chat
    chat = db.query(models.Chat).get(chat_id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )

    db.delete(chat)
    db.commit()

    logger.info(
        f"Chat {chat_id} deleted by user {current_user.username}"
    )


@router.get("/{chat_id}/messages", response_model=List[schemas.MessageRead])
async def list_messages(
        chat_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(
            auth_utils.get_current_active_user
        ),
):
    """
    Get all messages in a chat.

    Args:
        chat_id: Chat ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of messages

    Raises:
        HTTPException: If not a participant
    """
    # Check membership
    membership = (
        db.query(models.ChatUser)
        .filter(
            models.ChatUser.chat_id == chat_id,
            models.ChatUser.user_id == current_user.id,
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant of this chat",
        )

    # Get messages
    messages = (
        db.query(models.Message, models.User.username)
        .join(models.User, models.User.id == models.Message.sender_id)
        .filter(models.Message.chat_id == chat_id)
        .order_by(models.Message.created_at.asc())
        .all()
    )

    result: List[schemas.MessageRead] = []
    for message, username in messages:
        result.append(
            schemas.MessageRead(
                id=message.id,
                chat_id=message.chat_id,
                sender_id=message.sender_id,
                sender_username=username,
                content=message.content,
                created_at=message.created_at,
            )
        )

    return result


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
    Send a message in a chat.

    Args:
        chat_id: Chat ID
        message_in: Message content
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created message

    Raises:
        HTTPException: If not a participant
    """
    # Check membership
    membership = (
        db.query(models.ChatUser)
        .filter(
            models.ChatUser.chat_id == chat_id,
            models.ChatUser.user_id == current_user.id,
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant of this chat",
        )

    # Create message with XSS protection
    message = models.Message(
        chat_id=chat_id,
        sender_id=current_user.id,
        content=html.escape(message_in.content),  # Escape HTML
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return schemas.MessageRead(
        id=message.id,
        chat_id=message.chat_id,
        sender_id=message.sender_id,
        sender_username=current_user.username,
        content=message.content,
        created_at=message.created_at,
    )


@router.post("/{chat_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_chat_read(
        chat_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(
            auth_utils.get_current_active_user
        ),
):
    """
    Mark a chat as read.

    Args:
        chat_id: Chat ID
        db: Database session
        current_user: Current authenticated user

    Raises:
        HTTPException: If not a participant
    """
    # Get chat user record
    cu = (
        db.query(models.ChatUser)
        .filter(
            models.ChatUser.chat_id == chat_id,
            models.ChatUser.user_id == current_user.id,
        )
        .first()
    )

    if not cu:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant of this chat",
        )

    # Update last read timestamp
    cu.last_read_at = datetime.utcnow()
    db.add(cu)
    db.commit()