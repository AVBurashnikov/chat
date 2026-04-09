"""
Chat management endpoints - create, list, delete chats.
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import auth as auth_utils
import models
import schemas
from db import get_db
from routers.chats.validators import validate_chat_participant
from routers.chats.utils import (
    build_chat_read_response,
    find_existing_chat,
    check_chat_membership,
    get_other_participant,
)

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
        .filter(
            models.ChatUser.user_id == current_user.id,
            models.ChatUser.archived.is_(False),
        )
        .all()
    )

    result: List[schemas.ChatRead] = []
    for chat in chats:
        # Get membership record for current user
        cu = (
            db.query(models.ChatUser)
            .filter(
                models.ChatUser.chat_id == chat.id,
                models.ChatUser.user_id == current_user.id,
            )
            .first()
        )

        last_read = cu.last_read_at if cu else None

        # Build response
        chat_read = build_chat_read_response(
            db, chat, current_user.id, cu, last_read
        )
        result.append(chat_read)

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
    validate_chat_participant(chat_in.participant_username, current_user.username)

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
    existing_chat = find_existing_chat(
        db, current_user.id, participant.id
    )

    if existing_chat:
        existing_membership = (
            db.query(models.ChatUser)
            .filter(
                models.ChatUser.chat_id == existing_chat.id,
                models.ChatUser.user_id == current_user.id,
            )
            .first()
        )
        if existing_membership and existing_membership.archived:
            existing_membership.archived = False
            db.add(existing_membership)
            db.commit()
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
    check_chat_membership(db, chat_id, current_user.id)

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


@router.post("/{chat_id}/mute", response_model=schemas.ChatRead)
async def toggle_chat_mute(
        chat_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(
            auth_utils.get_current_active_user
        ),
):
    """
    Toggle mute state for a chat.

    Args:
        chat_id: Chat ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated chat object with mute state
    """
    membership = check_chat_membership(db, chat_id, current_user.id)
    membership.muted = not membership.muted
    db.add(membership)
    db.commit()

    chat = db.query(models.Chat).get(chat_id)
    return build_chat_read_response(
        db, chat, current_user.id, membership, membership.last_read_at
    )


@router.post("/{chat_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
async def archive_chat(
        chat_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(
            auth_utils.get_current_active_user
        ),
):
    """
    Archive a chat for the current user.

    Args:
        chat_id: Chat ID
        db: Database session
        current_user: Current authenticated user
    """
    membership = check_chat_membership(db, chat_id, current_user.id)
    membership.archived = True
    db.add(membership)
    db.commit()


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
    from datetime import datetime

    # Get chat user record
    cu = check_chat_membership(db, chat_id, current_user.id)

    # Update last read timestamp
    cu.last_read_at = datetime.utcnow()
    db.add(cu)
    db.commit()
