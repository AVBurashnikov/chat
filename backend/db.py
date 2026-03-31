from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./chat.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def run_sqlite_migrations():
    # Simple runtime migration for local SQLite development.
    with engine.begin() as conn:
        columns = conn.execute(text("PRAGMA table_info(chat_users)")).fetchall()
        column_names = {row[1] for row in columns}
        if "last_read_at" not in column_names:
            conn.execute(text("ALTER TABLE chat_users ADD COLUMN last_read_at DATETIME"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
