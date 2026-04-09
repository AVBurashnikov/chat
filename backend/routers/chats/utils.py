"""
Chat helper functions for common database operations.
"""

from typing import Optional, List

from sqlalchemy import func
from sqlalchemy.orm import Session

import models
import schemas
from routers.ws import ONLINE_USERS


def get_other_participant(
    db: Session,
    chat_id: int,
    current_user_id: int,
) -> Optional[models.User]:
    """
    Get the other participant in a private chat.

    Args:
        db: Database session
        chat_id: Chat ID
        current_user_id: Current user ID

    Returns:
        User object or None if not found
    """
    return (
        db.query(models.User)
        .join(
            models.ChatUser,
            models.ChatUser.user_id == models.User.id
        )
        .filter(
            models.ChatUser.chat_id == chat_id,
            models.User.id != current_user_id,
        )
        .first()
    )


def get_chat_title_and_online_status(
    db: Session,
    chat: models.Chat,
    current_user_id: int,
) -> tuple[str, bool]:
    """
    Get chat title and online status for the other participant.

    Args:
        db: Database session
        chat: Chat object
        current_user_id: Current user ID

    Returns:
        Tuple of (title, is_other_online)
    """
    other_online = False
    if chat.is_private:
        other = get_other_participant(db, chat.id, current_user_id)
        other_online = bool(other and other.id in ONLINE_USERS)
        title = other.username if other else f"Chat {chat.id}"
    else:
        title = chat.title or f"Chat {chat.id}"

    return title, other_online


def get_unread_count(
    db: Session,
    chat_id: int,
    current_user_id: int,
    last_read: Optional,
) -> int:
    """
    Get count of unread messages in a chat.

    Args:
        db: Database session
        chat_id: Chat ID
        current_user_id: Current user ID
        last_read: Last read timestamp (or None)

    Returns:
        Count of unread messages
    """
    unread_q = db.query(func.count(models.Message.id)).filter(
        models.Message.chat_id == chat_id,
        models.Message.sender_id != current_user_id,
    )

    if last_read is not None:
        unread_q = unread_q.filter(
            models.Message.created_at > last_read
        )

    return unread_q.scalar() or 0


def build_chat_read_response(
    db: Session,
    chat: models.Chat,
    current_user_id: int,
    last_read,
) -> schemas.ChatRead:
    """
    Build ChatRead schema from chat object.

    Args:
        db: Database session
        chat: Chat object
        current_user_id: Current user ID
        last_read: Last read timestamp

    Returns:
        ChatRead schema
    """
    unread_count = get_unread_count(db, chat.id, current_user_id, last_read)
    title, other_online = get_chat_title_and_online_status(db, chat, current_user_id)

    return schemas.ChatRead(
        id=chat.id,
        title=title,
        is_private=chat.is_private,
        created_at=chat.created_at,
        unread_count=unread_count,
        other_online=other_online
    )


def find_existing_chat(
    db: Session,
    user_id_1: int,
    user_id_2: int,
) -> Optional[models.Chat]:
    """
    Find existing private chat between two users.

    Args:
        db: Database session
        user_id_1: First user ID
        user_id_2: Second user ID

    Returns:
        Chat object or None
    """
    return (
        db.query(models.Chat)
        .join(models.ChatUser)
        .filter(
            models.ChatUser.user_id.in_([user_id_1, user_id_2])
        )
        .group_by(models.Chat.id)
        .having(func.count(models.ChatUser.user_id) == 2)
        .first()
    )


def check_chat_membership(
    db: Session,
    chat_id: int,
    user_id: int,
) -> models.ChatUser:
    """
    Check if user is member of chat. Raises 403 if not.

    Args:
        db: Database session
        chat_id: Chat ID
        user_id: User ID

    Returns:
        ChatUser membership record

    Raises:
        HTTPException: If not a member
    """
    from fastapi import HTTPException, status

    membership = (
        db.query(models.ChatUser)
        .filter(
            models.ChatUser.chat_id == chat_id,
            models.ChatUser.user_id == user_id,
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant of this chat",
        )

    return membership
