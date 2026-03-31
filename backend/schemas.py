from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChatBase(BaseModel):
    title: Optional[str] = None


class ChatCreate(ChatBase):
    participant_username: str


class ChatRead(ChatBase):
    id: int
    is_private: bool
    created_at: datetime
    unread_count: int = 0
    other_online: bool = False

    class Config:
        from_attributes = True


class MessageBase(BaseModel):
    content: str


class MessageCreate(MessageBase):
    pass


class MessageRead(MessageBase):
    id: int
    chat_id: int
    sender_id: int
    sender_username: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatWithMessages(ChatRead):
    messages: List[MessageRead] = []
