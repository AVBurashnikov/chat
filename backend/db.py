"""
Database configuration and session management.
"""

import logging
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool

from config import settings, app_logger

def _is_sqlite_url(url: str) -> bool:
    return url.startswith("sqlite:")

# Create SQLAlchemy engine with connection pooling
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if _is_sqlite_url(settings.database_url) else {},
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


def run_runtime_migrations():
    """
    Run runtime migrations.
    Adds missing columns if they don't exist.
    """
    inspector = inspect(engine)
    try:
        if inspector.has_table("chat_users"):
            columns = [col["name"] for col in inspector.get_columns("chat_users")]
            if "last_read_at" not in columns:
                with engine.begin() as conn:
                    conn.execute(
                        text("ALTER TABLE chat_users ADD COLUMN last_read_at TIMESTAMP")
                    )
                app_logger.info("Added last_read_at column to chat_users table")
            if "muted" not in columns:
                with engine.begin() as conn:
                    conn.execute(
                        text("ALTER TABLE chat_users ADD COLUMN muted BOOLEAN DEFAULT FALSE")
                    )
                app_logger.info("Added muted column to chat_users table")
            if "archived" not in columns:
                with engine.begin() as conn:
                    conn.execute(
                        text("ALTER TABLE chat_users ADD COLUMN archived BOOLEAN DEFAULT FALSE")
                    )
                app_logger.info("Added archived column to chat_users table")

        if inspector.has_table("messages"):
            columns = [col["name"] for col in inspector.get_columns("messages")]
            with engine.begin() as conn:
                if "delivered_at" not in columns:
                    conn.execute(
                        text("ALTER TABLE messages ADD COLUMN delivered_at TIMESTAMP")
                    )
                    app_logger.info("Added delivered_at column to messages table")
                if "read_at" not in columns:
                    conn.execute(
                        text("ALTER TABLE messages ADD COLUMN read_at TIMESTAMP")
                    )
                    app_logger.info("Added read_at column to messages table")
                if "file_url" not in columns:
                    conn.execute(
                        text("ALTER TABLE messages ADD COLUMN file_url VARCHAR(500)")
                    )
                    app_logger.info("Added file_url column to messages table")
                if "file_name" not in columns:
                    conn.execute(
                        text("ALTER TABLE messages ADD COLUMN file_name VARCHAR(255)")
                    )
                    app_logger.info("Added file_name column to messages table")
                if "file_type" not in columns:
                    conn.execute(
                        text("ALTER TABLE messages ADD COLUMN file_type VARCHAR(100)")
                    )
                    app_logger.info("Added file_type column to messages table")
                if "file_size" not in columns:
                    conn.execute(
                        text("ALTER TABLE messages ADD COLUMN file_size INTEGER")
                    )
                    app_logger.info("Added file_size column to messages table")
                if "reply_to" not in columns:
                    conn.execute(
                        text("ALTER TABLE messages ADD COLUMN reply_to INTEGER")
                    )
                    app_logger.info("Added reply_to column to messages table")    
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