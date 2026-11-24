from typing import Optional, List, Literal, Any, Dict
from pydantic import BaseModel, Field, field_validator


class HealthResponse(BaseModel):
    status: str = "ok"
    keys_configured: int = 2
    cache_enabled: bool = True


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=128)
    message: str = Field(...)
    system_prompt: Optional[str] = None
    mode: Optional[str] = "BUILD"

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        trimmed = v.strip() if isinstance(v, str) else ""
        if len(trimmed) < 1 or len(trimmed) > 4000:
            raise ValueError("message must be between 1 and 4000 characters")
        return trimmed


class ChatResponseMetadata(BaseModel):
    resolution_source: Literal["LIVE_INFERENCE", "LLM_CACHE"]
    model: str
    latency_ms: int
    input_tokens: int
    output_tokens: int
    key_id: Optional[str] = None
    fallback_attempts: int = 0


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    metadata: ChatResponseMetadata


class SessionMessageItem(BaseModel):
    role: str
    content: str
    metadata: Optional[Dict[str, Any]] = None


class SessionMessagesResponse(BaseModel):
    session_id: str
    messages: List[SessionMessageItem]


class SessionSummary(BaseModel):
    id: str
    title: str
    mode: str = "BUILD"
    created_at: str
    updated_at: str


class SessionListResponse(BaseModel):
    sessions: List[SessionSummary]


class VisualizationSaveRequest(BaseModel):
    type: str = "BUILD"
    data: Dict[str, Any]


class VisualizationResponse(BaseModel):
    session_id: str
    type: str
    data: Dict[str, Any]
    updated_at: str


class DeleteSessionResponse(BaseModel):
    status: str = "deleted"
    session_id: str
