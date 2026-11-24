from unittest.mock import AsyncMock, MagicMock
from app.services.session_service import save_turn


def test_unknown_session_returns_404(client):
    """
    Test GET /sessions/{session_id}/messages returns HTTP 404 for nonexistent session.
    """
    response = client.get("/sessions/nonexistent-session-id/messages")
    assert response.status_code == 404
    assert response.json() == {"detail": "session not found"}


def test_conversation_history_ordering(client):
    """
    Test GET /sessions/{session_id}/messages returns messages oldest first.
    """
    session_id = "s-order-test"
    save_turn(session_id, "First user message", "First assistant reply", {"resolution_source": "LIVE_INFERENCE", "input_tokens": 10, "output_tokens": 5})
    save_turn(session_id, "Second user message", "Second assistant reply", {"resolution_source": "LIVE_INFERENCE", "input_tokens": 20, "output_tokens": 8})

    response = client.get(f"/sessions/{session_id}/messages")
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == session_id
    messages = data["messages"]
    assert len(messages) == 4

    assert messages[0]["role"] == "user"
    assert messages[0]["content"] == "First user message"

    assert messages[1]["role"] == "assistant"
    assert messages[1]["content"] == "First assistant reply"
    assert messages[1]["metadata"]["input_tokens"] == 10

    assert messages[2]["role"] == "user"
    assert messages[2]["content"] == "Second user message"

    assert messages[3]["role"] == "assistant"
    assert messages[3]["content"] == "Second assistant reply"


def test_sqlite_session_separation(client):
    """
    Test that SQLite separates history strictly by session_id.
    """
    session_a = "session-aaa"
    session_b = "session-bbb"

    save_turn(session_a, "Message in A", "Reply in A", {})
    save_turn(session_b, "Message in B", "Reply in B", {})

    res_a = client.get(f"/sessions/{session_a}/messages").json()
    res_b = client.get(f"/sessions/{session_b}/messages").json()

    assert len(res_a["messages"]) == 2
    assert res_a["messages"][0]["content"] == "Message in A"

    assert len(res_b["messages"]) == 2
    assert res_b["messages"][0]["content"] == "Message in B"


def test_deterministic_title_generation():
    """
    Test deterministic title derivation from user queries without LLM calls.
    """
    from app.services.session_service import derive_title

    assert derive_title("how to build iron farm") == "Iron Farm Build"
    assert derive_title("give me steps to build a medieval castle") == "Medieval Castle"
    assert derive_title("how do i make a 2x2 piston door") == "2×2 Piston Door"
    assert derive_title("what should i take to fight the ender dragon") == "Ender Dragon Preparation"
    assert derive_title("help me create a custom sword mod") == "Custom Sword Mod"
    assert derive_title("   ") == "New CraftMind Chat"


def test_session_listing_and_deletion(client):
    """
    Test GET /sessions and DELETE /sessions/{session_id}.
    """
    session_id = "session-list-test"
    save_turn(
        session_id,
        "how to build iron farm",
        "Here are the steps for the iron farm",
        {"resolution_source": "LIVE_INFERENCE", "input_tokens": 10, "output_tokens": 5},
        mode="BUILD",
    )

    # 1. Verify session appears in session list with derived title and mode
    res = client.get("/sessions")
    assert res.status_code == 200
    sessions = res.json()["sessions"]
    matching = [s for s in sessions if s["id"] == session_id]
    assert len(matching) == 1
    assert matching[0]["title"] == "Iron Farm Build"
    assert matching[0]["mode"] == "BUILD"

    # 2. Test saving and retrieving visualization
    viz_payload = {
        "type": "BUILD",
        "data": {
            "title": "Iron Farm",
            "dimensions": {"width": 5, "length": 5, "height": 4},
            "blocks": [{"x": 0, "y": 0, "z": 0, "type": "stone_bricks", "step": 1}]
        }
    }
    save_res = client.post(f"/sessions/{session_id}/visualization", json=viz_payload)
    assert save_res.status_code == 200
    assert save_res.json()["session_id"] == session_id

    get_viz_res = client.get(f"/sessions/{session_id}/visualization")
    assert get_viz_res.status_code == 200
    assert get_viz_res.json()["data"]["title"] == "Iron Farm"

    # 3. Delete session
    del_res = client.delete(f"/sessions/{session_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"

    # 4. Verify messages are gone (returns 404)
    assert client.get(f"/sessions/{session_id}/messages").status_code == 404
    # 5. Verify visualization is gone (returns 404)
    assert client.get(f"/sessions/{session_id}/visualization").status_code == 404
