"""
WebSocket connection manager for real-time messaging.
"""

import logging
from typing import Dict, List, Set, Tuple

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manage WebSocket connections by chat."""

    def __init__(self) -> None:
        """Initialize empty connections dictionary."""
        self.active_connections: Dict[int, List[Tuple[WebSocket, int]]] = {}

    async def connect(self, chat_id: int, websocket: WebSocket, user_id: int) -> None:
        """
        Accept and store new WebSocket connection.

        Args:
            chat_id: Chat ID for the connection
            websocket: WebSocket connection
            user_id: Connected user ID
        """
        await websocket.accept()
        self.active_connections.setdefault(chat_id, []).append((websocket, user_id))
        logger.debug(f"Connection added to chat {chat_id} for user {user_id}")

    def disconnect(self, chat_id: int, websocket: WebSocket) -> None:
        """
        Remove WebSocket connection from active list.

        Args:
            chat_id: Chat ID
            websocket: WebSocket connection to remove
        """
        if chat_id in self.active_connections:
            try:
                self.active_connections[chat_id] = [
                    (conn, uid) for conn, uid in self.active_connections[chat_id]
                    if conn != websocket
                ]
                if not self.active_connections[chat_id]:
                    del self.active_connections[chat_id]
                logger.debug(f"Connection removed from chat {chat_id}")
            except ValueError:
                logger.warning(f"Connection not found in chat {chat_id}")

    async def broadcast(self, chat_id: int, message: dict) -> None:
        """
        Broadcast message to all connections in a chat.

        Args:
            chat_id: Chat ID
            message: Message to broadcast
        """
        connections = self.active_connections.get(chat_id, [])
        for connection, _ in connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message: {e}")

    async def send_personal(
            self, chat_id: int, websocket: WebSocket, message: dict
    ) -> None:
        """
        Send message to specific connection.

        Args:
            chat_id: Chat ID
            websocket: Specific connection
            message: Message to send
        """
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")

    def has_other_connections(self, chat_id: int, user_id: int) -> bool:
        """
        Check if there are other users connected to the chat.

        Args:
            chat_id: Chat ID
            user_id: User ID to check against

        Returns:
            True if there are other connections
        """
        return any(
            uid != user_id
            for _, uid in self.active_connections.get(chat_id, [])
        )


class UserConnectionManager:
    """Manage WebSocket connections by user."""

    def __init__(self) -> None:
        """Initialize empty user connections dictionary."""
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        """Accept and store new user-scoped WebSocket connection."""
        await websocket.accept()
        self.active_connections.setdefault(user_id, set()).add(websocket)
        logger.debug(f"Notification connection added for user {user_id}")

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        """Remove WebSocket connection from user-scoped active list."""
        connections = self.active_connections.get(user_id)
        if not connections:
            return

        connections.discard(websocket)
        if not connections:
            del self.active_connections[user_id]
        logger.debug(f"Notification connection removed for user {user_id}")

    async def send_to_user(self, user_id: int, message: dict) -> None:
        """Send a JSON payload to all active connections of a user."""
        connections = list(self.active_connections.get(user_id, set()))
        stale_connections: List[WebSocket] = []

        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception as error:
                logger.error(
                    f"Error sending notification to user {user_id}: {error}"
                )
                stale_connections.append(connection)

        for connection in stale_connections:
            self.disconnect(user_id, connection)

    def is_user_online(self, user_id: int) -> bool:
        """Check whether user has active notification websocket connections."""
        return bool(self.active_connections.get(user_id))


notification_manager = UserConnectionManager()
