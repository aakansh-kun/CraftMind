from dataclasses import dataclass
from typing import Optional


@dataclass
class Message:
    id: Optional[int]
    session_id: str
    role: str
    content: str
    metadata: Optional[str]
    created_at: str
