"""
Message endpoints - send and list messages in chats.
"""

import logging
import shutil
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, Response, status, UploadFile
from sqlalchemy import exists
from sqlalchemy.orm import Session, joinedload

import auth as auth_utils
import models
import schemas
from db import get_db
from routers.chats.utils import check_chat_membership
from routers.messages.utils import (
    build_message_response,
    mark_messages_read,
    broadcast_read_statuses,
    build_message_read_response,
)
from routers.ws import manager
from routers.ws.handlers import notify_chat_participants

router = APIRouter(prefix="/api/chats", tags=["messages"])
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
        .options(
            joinedload(models.Message.reply_to_message).joinedload(models.Message.sender),
            joinedload(models.Message.hidden_for_users),
        )
        .join(models.User, models.User.id == models.Message.sender_id)
        .filter(models.Message.chat_id == chat_id)
        .filter(
            ~exists().where(
                models.MessageHidden.message_id == models.Message.id,
                models.MessageHidden.user_id == current_user.id,
            )
        )
        .order_by(models.Message.created_at.asc())
        .all()
    )

    return build_message_read_response(messages, current_user.id)


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
        reply_to=message_in.reply_to,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    logger.info(f"Message {message.id} created in chat {chat_id}")

    await notify_chat_participants(
        db,
        chat_id,
        current_user.id,
        {
            "type": "new_message",
            "chat_id": message.chat_id,
            "message_id": message.id,
            "sender_id": current_user.id,
            "sender_username": current_user.username,
            "preview": message.content,
            "created_at": message.created_at.isoformat(),
        },
    )

    return schemas.MessageRead(
        id=message.id,
        chat_id=message.chat_id,
        sender_id=message.sender_id,
        sender_username=current_user.username,
        content=message.content,
        created_at=message.created_at,
        edited_at=message.edited_at,
        deleted_at=message.deleted_at,
        delivered_at=message.delivered_at,
        read_at=message.read_at,
        file_url=message.file_url,
        file_name=message.file_name,
        file_type=message.file_type,
        file_size=message.file_size,
        is_edited=False,
        is_deleted=False,
    )


def save_uploaded_file(upload_file: UploadFile) -> str:
    """
    Save uploaded file to uploads directory and return relative path.

    Args:
        upload_file: FastAPI UploadFile object

    Returns:
        Relative path to saved file
    """
    # Create uploads directory if it doesn't exist
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(exist_ok=True)

    # Generate unique filename
    import uuid
    file_extension = Path(upload_file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = uploads_dir / unique_filename

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return f"/uploads/{unique_filename}"


@router.post("/{chat_id}/messages/upload", response_model=schemas.MessageRead)
async def upload_file_message(
        chat_id: int,
        file: UploadFile = File(...),
        content: str = "",
        reply_to: int | None = None,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(
            auth_utils.get_current_active_user
        ),
):
    """
    Upload a file and create a message with it.

    Args:
        chat_id: Chat ID
        file: Uploaded file
        content: Optional message content
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created message object

    Raises:
        HTTPException: If not a participant or invalid file
    """
    import html

    # Check membership
    check_chat_membership(db, chat_id, current_user.id)

    # Validate reply message
    if reply_to:
        replied = (
            db.query(models.Message)
            .filter(
                models.Message.id == reply_to,
                models.Message.chat_id == chat_id
            )
            .first()
        )
        if not replied:
            raise HTTPException(
                status_code=400,
                detail="Invalid reply message"
            )

    # Validate file size (max 10MB)
    if file.size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 10MB."
        )

    # Validate file type
    allowed_types = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file.content_type} not allowed. Allowed types: {', '.join(allowed_types)}"
        )

    # Save file
    file_url = save_uploaded_file(file)

    # Sanitize content
    sanitized_content = html.escape(content) if content else file.filename

    # Create message
    message = models.Message(
        chat_id=chat_id,
        sender_id=current_user.id,
        content=sanitized_content,
        reply_to=reply_to,
        file_url=file_url,
        file_name=file.filename,
        file_type=file.content_type,
        file_size=file.size,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    logger.info(f"File message {message.id} created in chat {chat_id}")

    await notify_chat_participants(
        db,
        chat_id,
        current_user.id,
        {
            "type": "new_message",
            "chat_id": message.chat_id,
            "message_id": message.id,
            "sender_id": current_user.id,
            "sender_username": current_user.username,
            "preview": message.content,
            "created_at": message.created_at.isoformat(),
        },
    )

    return schemas.MessageRead(
        id=message.id,
        chat_id=message.chat_id,
        sender_id=message.sender_id,
        sender_username=current_user.username,
        content=message.content,
        created_at=message.created_at,
        edited_at=message.edited_at,
        deleted_at=message.deleted_at,
        delivered_at=message.delivered_at,
        read_at=message.read_at,
        file_url=message.file_url,
        file_name=message.file_name,
        file_type=message.file_type,
        file_size=message.file_size,
        is_edited=False,
        is_deleted=False,
    )


def get_chat_message_or_404(
    db: Session,
    chat_id: int,
    message_id: int,
) -> models.Message:
    message = (
        db.query(models.Message)
        .options(
            joinedload(models.Message.sender),
            joinedload(models.Message.reply_to_message).joinedload(models.Message.sender),
            joinedload(models.Message.reply_to_message).joinedload(models.Message.hidden_for_users),
            joinedload(models.Message.hidden_for_users),
        )
        .filter(
            models.Message.id == message_id,
            models.Message.chat_id == chat_id,
        )
        .first()
    )
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )
    return message


def remove_uploaded_file(file_url: str | None) -> None:
    if not file_url:
        return

    filename = Path(file_url).name
    file_path = Path("uploads") / filename
    if file_path.exists():
        file_path.unlink()


@router.patch("/{chat_id}/messages/{message_id}", response_model=schemas.MessageRead)
async def update_message(
        chat_id: int,
        message_id: int,
        message_in: schemas.MessageUpdate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(
            auth_utils.get_current_active_user
        ),
):
    check_chat_membership(db, chat_id, current_user.id)
    message = get_chat_message_or_404(db, chat_id, message_id)

    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can edit only your own messages",
        )

    if message.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deleted message cannot be edited",
        )

    content = message_in.content.strip()
    if not content and not message.file_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty",
        )

    import html

    message.content = html.escape(content)
    message.edited_at = datetime.utcnow()
    db.add(message)
    db.commit()
    db.refresh(message)

    response = build_message_response(message, current_user.username, current_user.id)
    await manager.broadcast(
        chat_id,
        {
            "type": "message_updated",
            **response.model_dump(mode="json"),
        },
    )
    await notify_chat_participants(
        db,
        chat_id,
        current_user.id,
        {
            "type": "message_updated",
            "chat_id": chat_id,
            "message_id": message.id,
            "preview": response.content,
        },
    )

    return response


@router.delete("/{chat_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
        chat_id: int,
        message_id: int,
        delete_in: schemas.MessageDeleteRequest,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(
            auth_utils.get_current_active_user
        ),
):
    check_chat_membership(db, chat_id, current_user.id)
    message = get_chat_message_or_404(db, chat_id, message_id)

    if delete_in.delete_for_everyone:
        if message.sender_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can delete for everyone only your own messages",
            )

        if not message.is_deleted:
            remove_uploaded_file(message.file_url)
            message.content = ""
            message.file_url = None
            message.file_name = None
            message.file_type = None
            message.file_size = None
            message.deleted_at = datetime.utcnow()
            message.is_deleted = True
            message.edited_at = None
            db.add(message)
            db.commit()

        await manager.broadcast(
            chat_id,
            {
                "type": "message_deleted",
                "chat_id": chat_id,
                "message_id": message.id,
                "delete_for_everyone": True,
            },
        )
        await notify_chat_participants(
            db,
            chat_id,
            current_user.id,
            {
                "type": "message_deleted",
                "chat_id": chat_id,
                "message_id": message.id,
                "delete_for_everyone": True,
            },
        )
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    hidden = (
        db.query(models.MessageHidden)
        .filter(
            models.MessageHidden.message_id == message.id,
            models.MessageHidden.user_id == current_user.id,
        )
        .first()
    )
    if not hidden:
        db.add(
            models.MessageHidden(
                message_id=message.id,
                user_id=current_user.id,
            )
        )
        db.commit()

    await manager.broadcast(
        chat_id,
        {
            "type": "message_deleted",
            "chat_id": chat_id,
            "message_id": message.id,
            "delete_for_everyone": False,
            "user_id": current_user.id,
        },
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
