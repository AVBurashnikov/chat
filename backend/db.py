"""
Database configuration and session management.
"""

import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool

from config import settings, app_logger

# Create SQLAlchemy engine with connection pooling
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True,  # Check connection health before use
    echo=settings.debug,  # Log SQL statements in debug mode
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def run_sqlite_migrations():
    """
    Run runtime migrations for SQLite.
    Adds missing columns if they don't exist.
    """
    try:
        with engine.begin() as conn:
            # Check if last_read_at column exists
            columns = conn.execute(
                text("PRAGMA table_info(chat_users)")
            ).fetchall()
            column_names = {row[1] for row in columns}

            if "last_read_at" not in column_names:
                conn.execute(
                    text(
                        "ALTER TABLE chat_users ADD COLUMN last_read_at DATETIME"
                    )
                )
                app_logger.info(
                    "Added last_read_at column to chat_users table"
                )
    except Exception as e:
        app_logger.error(f"Error running migrations: {e}")
        raise


def get_db():
    """
    Get database session dependency for FastAPI.
    Ensures session is properly closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Health check function
def check_db_connection() -> bool:
    """Check if database connection is working."""
    try:
        with engine.begin() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        app_logger.error(f"Database connection failed: {e}")
        return False