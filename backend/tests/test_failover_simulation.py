from unittest.mock import AsyncMock, MagicMock
from app.services.llm_service import parse_simulated_failures
from app.services.session_service import get_history_for_llm


def test_parse_simulated_failures():
    """
    Test header parser handles single, multiple, wildcard, and ignores invalid codes.
    """
    assert parse_simulated_failures("key_1=429") == {"key_1": 429}
    assert parse_simulated_failures("key_1=500") == {"key_1": 500}
    assert parse_simulated_failures("key_1=429,key_2=500") == {"key_1": 429, "key_2": 500}
    assert parse_simulated_failures("*=429") == {"*": 429}
    assert parse_simulated_failures("key_1=400,key_2=429") == {"key_2": 429}  # 400 is not eligible
    assert parse_simulated_failures("") == {}
    assert parse_simulated_failures(None) == {}


def test_key1_simulated_429_triggers_fallback_to_key2(client, monkeypatch):
    """
    Test X-Simulate-Failure: key_1=429 causes key_1 to fail, falls back to key_2, returns 200.
    """
    mock_resp = MagicMock()
    mock_resp.choices = [MagicMock(message=MagicMock(content="Redstone comparator checks container fullness."))]
    mock_resp.usage.prompt_tokens = 45
    mock_resp.usage.completion_tokens = 12
    mock_resp._hidden_params = {"cache_hit": False}

    mock_acompletion = AsyncMock(return_value=mock_resp)
    monkeypatch.setattr("litellm.acompletion", mock_acompletion)

    response = client.post(
        "/chat",
        json={"session_id": "s-fallback", "message": "How does a comparator work?"},
        headers={"X-Simulate-Failure": "key_1=429"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == "s-fallback"
    assert data["reply"] == "Redstone comparator checks container fullness."

    meta = data["metadata"]
    assert meta["resolution_source"] == "LIVE_INFERENCE"
    assert meta["key_id"] == "key_2"
    assert meta["fallback_attempts"] == 1
    assert meta["input_tokens"] == 45
    assert meta["output_tokens"] == 12
    assert isinstance(meta["latency_ms"], int)


def test_all_keys_simulated_failure_returns_503_and_no_history_saved(client, monkeypatch):
    """
    Test X-Simulate-Failure: *=429 causes all keys to fail, returns HTTP 503 {"detail": "all providers unavailable"},
    and verifies NOTHING is saved to SQLite history.
    """
    mock_acompletion = AsyncMock(side_effect=Exception("Should not be called"))
    monkeypatch.setattr("litellm.acompletion", mock_acompletion)

    session_id = "s-failed-req"
    response = client.post(
        "/chat",
        json={"session_id": session_id, "message": "Will this save if it fails?"},
        headers={"X-Simulate-Failure": "*=429"},
    )

    assert response.status_code == 503
    assert response.json() == {"detail": "all providers unavailable"}

    # Ensure nothing was saved in SQLite
    history = get_history_for_llm(session_id)
    assert len(history) == 0

    session_res = client.get(f"/sessions/{session_id}/messages")
    assert session_res.status_code == 404


def test_cache_hit_metadata_structure(client, monkeypatch):
    """
    Test when LiteLLM reports cache_hit, metadata contains:
    - resolution_source: "LLM_CACHE"
    - key_id: null
    - fallback_attempts: 0
    """
    mock_resp = MagicMock()
    mock_resp.choices = [MagicMock(message=MagicMock(content="A wooden pickaxe requires 3 planks and 2 sticks."))]
    mock_resp.usage.prompt_tokens = 30
    mock_resp.usage.completion_tokens = 15
    mock_resp._hidden_params = {"cache_hit": True}

    mock_acompletion = AsyncMock(return_value=mock_resp)
    monkeypatch.setattr("litellm.acompletion", mock_acompletion)

    response = client.post(
        "/chat",
        json={"session_id": "s-cache", "message": "How do I make a wooden pickaxe?"},
    )

    assert response.status_code == 200
    data = response.json()
    meta = data["metadata"]
    assert meta["resolution_source"] == "LLM_CACHE"
    assert meta["key_id"] is None
    assert meta["fallback_attempts"] == 0
    assert meta["input_tokens"] == 30
    assert meta["output_tokens"] == 15
