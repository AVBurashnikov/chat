"""
Pydantic schemas for request/response validation.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, constr


class UserBase(BaseModel):
    """Base user schema."""
    username: str


class UserCreate(UserBase):
    """User creation schema with validation."""

    username: constr(min_length=3, max_length=50)  # type: ignore
    password: constr(min_length=8, max_length=128)  # type: ignore


class UserRead(UserBase):
    """User read schema."""

    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"


class ChatBase(BaseModel):
    """Base chat schema."""

    title: Optional[str] = None


class ChatCreate(ChatBase):
    """Chat creation schema."""

    participant_username: constr(min_length=3, max_length=50)  # type: ignore


class ChatRead(ChatBase):
    """Chat read schema."""

    id: int
    is_private: bool
    created_at: datetime
    unread_count: int = Field(default=0, ge=0)
    other_online: bool = False
    muted: bool = False
    last_message_text: Optional[str] = None
    last_message_sender: Optional[str] = None
    last_message_time: Optional[datetime] = None

    class Config:
        from_attributes = True


class MessageBase(BaseModel):
    """Base message schema."""

    content: constr(min_length=1, max_length=5000)  # type: ignore


class MessageCreate(MessageBase):
    """Message creation schema."""
    pass


class MessageRead(MessageBase):
    """Message read schema."""

    id: int
    chat_id: int
    sender_id: int
    sender_username: str
    created_at: datetime
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChatWithMessages(ChatRead):
    """Chat with messages schema."""

    messages: List[MessageRead] = []