from fastapi import APIRouter, HTTPException
from app.schemas import (
    SessionMessagesResponse,
    SessionListResponse,
    SessionSummary,
    DeleteSessionResponse,
    VisualizationSaveRequest,
    VisualizationResponse,
)
from app.services.session_service import (
    get_session_messages_for_api,
    get_all_sessions,
    delete_session,
    save_visualization,
    get_visualization,
    delete_visualization,
)

router = APIRouter(tags=["sessions"])


@router.get("/sessions", response_model=SessionListResponse)
def list_sessions() -> SessionListResponse:
    """
    Returns list of all active/past chat sessions with metadata, ordered by updated_at DESC.
    """
    sessions_data = get_all_sessions()
    return SessionListResponse(
        sessions=[SessionSummary(**item) for item in sessions_data]
    )


@router.get("/sessions/{session_id}/messages", response_model=SessionMessagesResponse)
def get_session_messages(session_id: str) -> SessionMessagesResponse:
    """
    Returns conversation history oldest first.
    Unknown session returns HTTP 404: {"detail": "session not found"}.
    System prompt is not included in this history.
    """
    messages = get_session_messages_for_api(session_id)
    if messages is None:
        raise HTTPException(status_code=404, detail="session not found")

    return SessionMessagesResponse(
        session_id=session_id,
        messages=messages,
    )


@router.delete("/sessions/{session_id}", response_model=DeleteSessionResponse)
def remove_session(session_id: str) -> DeleteSessionResponse:
    """
    Deletes a session, its messages, and any persisted visualization.
    """
    delete_session(session_id)
    return DeleteSessionResponse(status="deleted", session_id=session_id)


@router.get("/sessions/{session_id}/visualization", response_model=VisualizationResponse)
def get_session_viz(session_id: str) -> VisualizationResponse:
    """
    Retrieves the persisted structured visualization JSON for a session.
    """
    viz = get_visualization(session_id)
    if not viz:
        raise HTTPException(status_code=404, detail="visualization not found")
    return VisualizationResponse(**viz)


@router.delete("/sessions/{session_id}/visualization")
def clear_session_viz(session_id: str):
    """
    Clears any persisted visualization for a session.
    """
    delete_visualization(session_id)
    return {"status": "cleared", "session_id": session_id}


@router.post("/sessions/{session_id}/visualization", response_model=VisualizationResponse)
def save_session_viz(session_id: str, req: VisualizationSaveRequest) -> VisualizationResponse:
    """
    Saves or updates the structured visualization JSON for a session.
    """
    save_visualization(session_id, req.type, req.data)
    viz = get_visualization(session_id)
    if not viz:
        raise HTTPException(status_code=500, detail="failed to save visualization")
    return VisualizationResponse(**viz)
