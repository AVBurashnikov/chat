"""
Authentication endpoints.
"""

import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

import auth as auth_utils
import models
import schemas
from db import get_db
from config import settings, security_logger

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

logger = logging.getLogger(__name__)


def validate_username(username: str) -> None:
    """
    Validate username format and length.

    Args:
        username: Username to validate

    Raises:
        HTTPException: If validation fails
    """
    if len(username) < 3 or len(username) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be 3-50 characters"
        )

    # Check for allowed characters (alphanumeric, underscore, hyphen)
    if not all(c.isalnum() or c in "_-" for c in username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username can only contain alphanumeric characters, underscore, and hyphen"
        )


def validate_password(password: str) -> None:
    """
    Validate password strength.

    Args:
        password: Password to validate

    Raises:
        HTTPException: If validation fails
    """
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )

    if len(password) > 128:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be less than 128 characters"
        )

    # Check for password complexity
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)

    if not (has_upper and has_lower and has_digit):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain uppercase, lowercase, and digits"
        )


@router.post("/register", response_model=schemas.UserRead)
async def register(
        user_in: schemas.UserCreate,
        db: Session = Depends(get_db)
):
    """
    Register a new user.

    Args:
        user_in: User registration data
        db: Database session

    Returns:
        Created user object

    Raises:
        HTTPException: If username already taken or validation fails
    """
    # Validate input
    validate_username(user_in.username)
    validate_password(user_in.password)

    # Check if user already exists
    existing = auth_utils.get_user_by_username(db, user_in.username)
    if existing:
        security_logger.warning(
            f"Registration attempt with existing username: {user_in.username}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # Create user
    user = auth_utils.create_user(db, user_in)
    security_logger.info(f"New user registered: {user.username}")

    return user


@router.post("/login", response_model=schemas.Token)
@limiter.limit(f"{settings.login_rate_limit}")
async def login(
        request: Request,
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db),
):
    """
    Authenticate user and return JWT token.

    Args:
        request: HTTP request object
        form_data: Username and password
        db: Database session

    Returns:
        JWT token

    Raises:
        HTTPException: If authentication fails
    """
    user = auth_utils.authenticate_user(
        db, form_data.username, form_data.password
    )

    if not user:
        security_logger.warning(
            f"Failed login attempt for user: {form_data.username} "
            f"from IP: {request.client.host}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(
        minutes=settings.access_token_expire_minutes
    )
    access_token = auth_utils.create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )

    security_logger.info(
        f"Successful login for user: {user.username} "
        f"from IP: {request.client.host}"
    )

    return schemas.Token(access_token=access_token)


@router.get("/me", response_model=schemas.UserRead)
async def read_me(
        current_user: models.User = Depends(
            auth_utils.get_current_active_user
        ),
):
    """
    Get current authenticated user info.

    Args:
        current_user: Current user from JWT

    Returns:
        User object
    """
    return current_user