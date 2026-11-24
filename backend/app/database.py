import sqlite3
import os
from pathlib import Path
from contextlib import contextmanager
from typing import Generator
from app.config import settings


def get_db_path() -> str:
    return settings.get_sqlite_path()


def init_db() -> None:
    """
    Automatically creates tables and indexes on startup if they don't exist:
    - messages: conversation messages
    - sessions: lightweight session metadata (title, mode, timestamps)
    - visualizations: structured visualization data (3D build models, simulation state)
    """
    db_path = get_db_path()
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                metadata TEXT,
                created_at TEXT NOT NULL
            );
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages (session_id);
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_messages_session_created ON messages (session_id, id ASC);
            """
        )

        # Lightweight sessions table for chat history
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                mode TEXT NOT NULL DEFAULT 'BUILD',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions (updated_at DESC);
            """
        )

        # Visualizations table for storing canonical BuildModel JSON
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS visualizations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE NOT NULL,
                type TEXT NOT NULL DEFAULT 'BUILD',
                data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_visualizations_session_id ON visualizations (session_id);
            """
        )

        # Backfill any existing message sessions into sessions table
        cursor.execute(
            """
            INSERT OR IGNORE INTO sessions (id, title, mode, created_at, updated_at)
            SELECT 
                session_id,
                'CraftMind Chat',
                'BUILD',
                MIN(created_at),
                MAX(created_at)
            FROM messages
            GROUP BY session_id;
            """
        )

        conn.commit()


@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """
    Context manager for database connections with Row factory enabled.
    """
    db_path = get_db_path()
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def check_db_health() -> bool:
    """
    Verifies that SQLite is reachable.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1;")
            result = cursor.fetchone()
            return result is not None and result[0] == 1
    except Exception:
        return False
