"""
WebSocket message status broadcast functions.
"""

from datetime import datetime
from typing import Optional

from routers.ws.manager import ConnectionManager


async def broadcast_delivery_status(
    manager: ConnectionManager,
    chat_id: int,
    message_id: int,
    delivered_at: datetime,
) -> None:
    """
    Broadcast message delivery status to all clients in chat.

    Args:
        manager: Connection manager instance
        chat_id: Chat ID
        message_id: Message ID
        delivered_at: Delivery timestamp
    """
    await manager.broadcast(
        chat_id,
        {
            "type": "message_status",
            "id": message_id,
            "delivered_at": delivered_at.isoformat(),
            "read_at": None,
        }
    )


async def broadcast_read_status(
    manager: ConnectionManager,
    chat_id: int,
    message_id: int,
    delivered_at: Optional[datetime],
    read_at: datetime,
) -> None:
    """
    Broadcast message read status to all clients in chat.

    Args:
        manager: Connection manager instance
        chat_id: Chat ID
        message_id: Message ID
        delivered_at: Delivery timestamp (may be None)
        read_at: Read timestamp
    """
    await manager.broadcast(
        chat_id,
        {
            "type": "message_status",
            "id": message_id,
            "delivered_at": delivered_at.isoformat() if delivered_at else None,
            "read_at": read_at.isoformat(),
        }
    )


async def broadcast_multiple_read_statuses(
    manager: ConnectionManager,
    chat_id: int,
    messages: list,
) -> None:
    """
    Broadcast read status for multiple messages.

    Args:
        manager: Connection manager instance
        chat_id: Chat ID
        messages: List of message objects with id, delivered_at, read_at
    """
    for message in messages:
        await broadcast_read_status(
            manager,
            chat_id,
            message.id,
            message.delivered_at,
            message.read_at,
        )
