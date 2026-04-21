import json
import os
from sqlalchemy import create_engine, Column, String, Text, DateTime, Integer
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timezone

# SQLite by default — swap this for Postgres on AWS:
# postgresql://user:password@rds-endpoint:5432/dbname
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./chat.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False)  # "user" or "model"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_db():
    Base.metadata.create_all(bind=engine)


def get_history(session_id: str) -> list[dict]:
    """Return chat history for a session as a list of Gemini-format dicts."""
    with SessionLocal() as db:
        messages = (
            db.query(Message)
            .filter(Message.session_id == session_id)
            .order_by(Message.id)
            .all()
        )
        return [{"role": m.role, "parts": [{"text": m.content}]} for m in messages]


def save_message(session_id: str, role: str, content: str):
    """Persist a single message to the database."""
    with SessionLocal() as db:
        db.add(Message(session_id=session_id, role=role, content=content))
        db.commit()


def clear_history(session_id: str):
    """Delete all messages for a session."""
    with SessionLocal() as db:
        db.query(Message).filter(Message.session_id == session_id).delete()
        db.commit()


def get_sessions() -> list[dict]:
    """Return all sessions with their first user message as a preview."""
    with SessionLocal() as db:
        # Get the first user message per session, ordered by earliest first
        rows = (
            db.query(
                Message.session_id,
                Message.content,
                Message.created_at,
            )
            .filter(Message.role == "user")
            .order_by(Message.id)
            .all()
        )
        # Keep only the first message per session, preserving insertion order
        seen = {}
        for row in rows:
            if row.session_id not in seen:
                seen[row.session_id] = {
                    "session_id": row.session_id,
                    "preview": row.content[:60] + ("…" if len(row.content) > 60 else ""),
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                }
        # Newest sessions first
        return list(reversed(list(seen.values())))
