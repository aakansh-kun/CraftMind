import json
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.database import get_db_connection


def derive_title(message: str) -> str:
    """
    Deterministically generates a concise, readable title (2-6 words) from the first user message.
    Does NOT invoke any LLM API calls.
    Examples:
    'how to build iron farm' -> 'Iron Farm Build'
    'give me steps to build a medieval castle' -> 'Medieval Castle'
    'how do i make a 2x2 piston door' -> '2×2 Piston Door'
    'what should i take to fight the ender dragon' -> 'Ender Dragon Preparation'
    'help me create a custom sword mod' -> 'Custom Sword Mod'
    """
    if not message:
        return "New CraftMind Chat"

    clean = message.strip()
    lower = clean.lower()

    # Exact common phrases and entities
    if "ender dragon" in lower:
        return "Ender Dragon Preparation"
    if "iron farm" in lower or "iron golem farm" in lower:
        return "Iron Farm Build"
    if "piston door" in lower:
        if "2x2" in lower or "2*2" in lower or "2 by 2" in lower:
            return "2×2 Piston Door"
        return "Piston Door Build"
    if "sword mod" in lower or "custom sword" in lower:
        return "Custom Sword Mod"
    if "medieval castle" in lower:
        return "Medieval Castle"
    if "creeper farm" in lower:
        return "Creeper Farm"
    if "mob farm" in lower or "mob trap" in lower:
        return "Mob Farm Build"
    if "starter house" in lower:
        return "Starter House Build"
    if "tree farm" in lower:
        return "Tree Farm Build"

    # Strip conversational prefixes
    patterns = [
        r"^(can you\s+)?(please\s+)?(how\s+to\s+(build|make|craft|design|create))\s+(a|an|the)?\s*",
        r"^(can you\s+)?(please\s+)?(how\s+do\s+i\s+(build|make|craft|design|create))\s+(a|an|the)?\s*",
        r"^(give\s+me\s+)?(steps\s+(to|for)\s+(build|make|craft|design|create))\s+(a|an|the)?\s*",
        r"^(give\s+me\s+)?(steps\s+(to|for))\s+(a|an|the)?\s*",
        r"^(help\s+me\s+)(build|make|craft|design|create)\s+(a|an|the)?\s*",
        r"^(tell\s+me\s+how\s+to\s+)(build|make|craft|design|create)\s+(a|an|the)?\s*",
        r"^(what\s+is\s+the\s+best\s+way\s+to\s+)(build|make|craft|design|create)\s+(a|an|the)?\s*",
        r"^(what\s+should\s+i\s+(take|bring|prepare)\s+(to|for)\s+)?(fight|beat)?\s*(the)?\s*",
        r"^(guide\s+(to|for)\s+(building|making)?)\s+(a|an|the)?\s*",
        r"^(how\s+to\s+)",
        r"^(how\s+do\s+i\s+)",
    ]
    result = clean
    for pat in patterns:
        sub = re.sub(pat, "", result, flags=re.IGNORECASE).strip()
        if sub and len(sub) > 2:
            result = sub
            break

    # Strip trailing punctuation
    result = re.sub(r"[?!.,:;]+$", "", result).strip()

    words = [w for w in result.split() if w]
    if not words:
        return "New CraftMind Chat"

    # Limit to at most 5 words
    if len(words) > 5:
        words = words[:5]

    title = " ".join(word.capitalize() for word in words)
    title = re.sub(r"\b2x2\b", "2×2", title, flags=re.IGNORECASE)

    if len(title) > 40:
        title = title[:40].rstrip()

    return title if title else "New CraftMind Chat"


def get_history_for_llm(session_id: str) -> List[Dict[str, str]]:
    """
    Retrieves previous user and assistant messages for a session to construct LLM context.
    Returns oldest first.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT role, content
            FROM messages
            WHERE session_id = ?
            ORDER BY id ASC;
            """,
            (session_id,),
        )
        rows = cursor.fetchall()
        return [{"role": row["role"], "content": row["content"]} for row in rows]


def get_session_messages_for_api(session_id: str) -> Optional[List[Dict[str, Any]]]:
    """
    Retrieves full message history formatted for GET /sessions/{session_id}/messages.
    Returns None if the session does not exist (0 messages).
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT role, content, metadata
            FROM messages
            WHERE session_id = ?
            ORDER BY id ASC;
            """,
            (session_id,),
        )
        rows = cursor.fetchall()
        if not rows:
            return None

        result = []
        for row in rows:
            meta = None
            if row["metadata"]:
                try:
                    meta = json.loads(row["metadata"])
                except Exception:
                    meta = None
            result.append({
                "role": row["role"],
                "content": row["content"],
                "metadata": meta
            })
        return result


def save_turn(
    session_id: str,
    user_content: str,
    assistant_reply: str,
    assistant_metadata: Dict[str, Any],
    mode: str = "BUILD",
) -> None:
    """
    Saves the user message and assistant reply with its metadata in an atomic transaction,
    and creates or updates session metadata with deterministic title.
    """
    now = datetime.now(timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Check if session exists in sessions table
        cursor.execute("SELECT id, title FROM sessions WHERE id = ?;", (session_id,))
        existing_session = cursor.fetchone()

        if not existing_session:
            title = derive_title(user_content)
            cursor.execute(
                """
                INSERT INTO sessions (id, title, mode, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?);
                """,
                (session_id, title, mode or "BUILD", now, now),
            )
        else:
            cursor.execute(
                """
                UPDATE sessions
                SET updated_at = ?, mode = COALESCE(?, mode)
                WHERE id = ?;
                """,
                (now, mode, session_id),
            )

        # Save user message
        cursor.execute(
            """
            INSERT INTO messages (session_id, role, content, metadata, created_at)
            VALUES (?, ?, ?, ?, ?);
            """,
            (session_id, "user", user_content, None, now),
        )
        # Save assistant message
        cursor.execute(
            """
            INSERT INTO messages (session_id, role, content, metadata, created_at)
            VALUES (?, ?, ?, ?, ?);
            """,
            (
                session_id,
                "assistant",
                assistant_reply,
                json.dumps(assistant_metadata),
                now,
            ),
        )
        conn.commit()


def get_all_sessions() -> List[Dict[str, Any]]:
    """
    Returns list of all sessions ordered by updated_at DESC.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, title, mode, created_at, updated_at
            FROM sessions
            ORDER BY updated_at DESC;
            """
        )
        rows = cursor.fetchall()
        return [
            {
                "id": row["id"],
                "title": row["title"],
                "mode": row["mode"] or "BUILD",
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }
            for row in rows
        ]


def delete_session(session_id: str) -> bool:
    """
    Deletes session metadata, messages, and visualization data atomically.
    Returns True if session existed and was deleted, False otherwise.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM messages WHERE session_id = ?;", (session_id,))
        cursor.execute("DELETE FROM visualizations WHERE session_id = ?;", (session_id,))
        cursor.execute("DELETE FROM sessions WHERE id = ?;", (session_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
        return deleted


def save_visualization(session_id: str, viz_type: str, viz_data: Dict[str, Any]) -> None:
    """
    Persists structured visualization data for a session.
    """
    now = datetime.now(timezone.utc).isoformat()
    raw_data = json.dumps(viz_data)
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO visualizations (session_id, type, data, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(session_id) DO UPDATE SET
                type = excluded.type,
                data = excluded.data,
                updated_at = excluded.updated_at;
            """,
            (session_id, viz_type, raw_data, now, now),
        )
        conn.commit()


def get_visualization(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves stored visualization for a session.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT session_id, type, data, updated_at
            FROM visualizations
            WHERE session_id = ?;
            """,
            (session_id,),
        )
        row = cursor.fetchone()
        if not row:
            return None
        return {
            "session_id": row["session_id"],
            "type": row["type"],
            "data": json.loads(row["data"]),
            "updated_at": row["updated_at"],
        }
