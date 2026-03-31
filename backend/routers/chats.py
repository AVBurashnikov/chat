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


@router.get("/", response_model=List[schemas.ChatRead])
def list_chats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user),
):
    chats = (
        db.query(models.Chat)
        .join(models.ChatUser)
        .filter(models.ChatUser.user_id == current_user.id)
        .all()
    )

    result: List[schemas.ChatRead] = []
    for chat in chats:

        cu = (
          db.query(models.ChatUser)
          .filter(
              models.ChatUser.chat_id == chat.id,
              models.ChatUser.user_id == current_user.id,
          )
          .first()
        )
        last_read = cu.last_read_at if cu else None
        unread_q = db.query(func.count(models.Message.id)).filter(
          models.Message.chat_id == chat.id,
          models.Message.sender_id != current_user.id,
        )
        if last_read is not None:
          unread_q = unread_q.filter(models.Message.created_at > last_read)
        unread_count = unread_q.scalar() or 0
        # Для приватных чатов всегда показываем username собеседника,
        # чтобы у каждого участника был "свой" заголовок.
        other_online = False
        if chat.is_private:
            other = (
                db.query(models.User)
                .join(models.ChatUser, models.ChatUser.user_id == models.User.id)
                .filter(
                    models.ChatUser.chat_id == chat.id,
                    models.User.id != current_user.id,
                )
                .first()
            )
            other_online = bool(other and (other.id in ONLINE_USERS))
            
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
def create_chat(
    chat_in: schemas.ChatCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user),
):
    if chat_in.participant_username == current_user.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create chat with yourself",
        )

    participant = (
        db.query(models.User)
        .filter(models.User.username == chat_in.participant_username)
        .first()
    )
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found",
        )

    chat = models.Chat(title=None, is_private=True)
    db.add(chat)
    db.flush()

    db.add_all(
        [
            models.ChatUser(chat_id=chat.id, user_id=current_user.id),
            models.ChatUser(chat_id=chat.id, user_id=participant.id),
        ]
    )
    db.commit()
    db.refresh(chat)
    return chat


@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user),
):
    # Убедимся, что пользователь участник чата
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

    chat = db.query(models.Chat).get(chat_id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )

    db.delete(chat)
    db.commit()


@router.get("/{chat_id}/messages", response_model=List[schemas.MessageRead])
def list_messages(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user),
):
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
def send_message(
    chat_id: int,
    message_in: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user),
):
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

    message = models.Message(
        chat_id=chat_id,
        sender_id=current_user.id,
        content=message_in.content,
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
def mark_chat_read(
  chat_id: int,
  db: Session = Depends(get_db),
  current_user: models.User = Depends(auth_utils.get_current_active_user),
):
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
  cu.last_read_at = datetime.utcnow()
  db.add(cu)
  db.commit()