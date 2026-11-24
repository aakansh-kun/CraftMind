from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from app.schemas import ChatRequest, ChatResponse
from app.services.session_service import get_history_for_llm, save_turn
from app.services.llm_service import execute_chat_turn, DEFAULT_SYSTEM_PROMPT

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def post_chat(
    req: ChatRequest,
    x_simulate_failure: Optional[str] = Header(None, alias="X-Simulate-Failure"),
) -> ChatResponse:
    """
    Handles user chat message with multi-turn history, failover, failure simulation,
    and LiteLLM caching.
    Failed requests (422, 503) are never saved to conversation history.
    """
    # 1. Load previous conversation history from SQLite
    history = get_history_for_llm(req.session_id)

    # 2. Determine system prompt (override if provided in request)
    system_prompt = req.system_prompt if req.system_prompt else DEFAULT_SYSTEM_PROMPT

    # 3. Construct the complete LLM message list:
    #    [system prompt] + [previous user/assistant messages] + [new user message]
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": req.message})

    # 4. Send the resulting conversation to LiteLLM with failover & caching
    reply, metadata = await execute_chat_turn(
        messages=messages,
        simulate_header=x_simulate_failure,
    )

    # 5. Save the new user message and assistant response + metadata only on success
    save_turn(
        session_id=req.session_id,
        user_content=req.message,
        assistant_reply=reply,
        assistant_metadata=metadata.model_dump(),
        mode=req.mode or "BUILD",
    )

    return ChatResponse(
        session_id=req.session_id,
        reply=reply,
        metadata=metadata,
    )
