"""
Authentication module with JWT and password security.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

import models
import schemas
from db import get_db
from config import settings, security_logger

# Initialize password context
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using pbkdf2_sha256."""
    return pwd_context.hash(password)


def create_access_token(
        data: dict, expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.

    Args:
        data: Payload data to encode
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (
            expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire})

    try:
        encoded_jwt = jwt.encode(
            to_encode,
            settings.secret_key,
            algorithm=settings.algorithm
        )
        return encoded_jwt
    except Exception as e:
        security_logger.error(f"Failed to create access token: {e}")
        raise


def get_user_by_username(
        db: Session, username: str
) -> Optional[models.User]:
    """Get user by username from database."""
    return db.query(models.User).filter(
        models.User.username == username
    ).first()


def authenticate_user(
        db: Session, username: str, password: str
) -> Optional[models.User]:
    """
    Authenticate user with username and password.

    Args:
        db: Database session
        username: User's username
        password: User's plain password

    Returns:
        User object if authentication successful, None otherwise
    """
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_current_user(
        db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> models.User:
    """
    Get current authenticated user from JWT token.

    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        username: str = payload.get("sub")

        if username is None:
            security_logger.warning("Token missing 'sub' claim")
            raise credentials_exception

    except JWTError as e:
        security_logger.warning(f"Invalid JWT token: {e}")
        raise credentials_exception
    except Exception as e:
        security_logger.error(f"Unexpected error validating token: {e}")
        raise credentials_exception

    user = get_user_by_username(db, username=username)
    if user is None:
        security_logger.warning(f"User {username} not found")
        raise credentials_exception

    return user


def get_current_active_user(
        current_user: models.User = Depends(get_current_user),
) -> models.User:
    """Get current active user (check if not deactivated)."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


def create_user(db: Session, user_in: schemas.UserCreate) -> models.User:
    """
    Create new user in database.

    Args:
        db: Database session
        user_in: User creation schema with username and password

    Returns:
        Created user object
    """
    hashed_password = get_password_hash(user_in.password)
    user = models.User(
        username=user_in.username,
        hashed_password=hashed_password
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    security_logger.info(f"New user created: {user.username}")
    return user