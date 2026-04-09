"""
Chat input validation functions.
"""

from fastapi import HTTPException, status


def validate_chat_participant(participant_username: str, current_username: str) -> None:
    """
    Validate that user is not creating chat with themselves.

    Args:
        participant_username: Participant username
        current_username: Current user username

    Raises:
        HTTPException: If trying to chat with self
    """
    if participant_username == current_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create chat with yourself",
        )
