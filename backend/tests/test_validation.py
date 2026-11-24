import pytest


def test_chat_validation_missing_fields(client):
    """
    Test POST /chat returns HTTP 422 for missing required fields.
    """
    # Empty payload
    response = client.post("/chat", json={})
    assert response.status_code == 422

    # Missing message
    response = client.post("/chat", json={"session_id": "s-test"})
    assert response.status_code == 422

    # Missing session_id
    response = client.post("/chat", json={"message": "hello"})
    assert response.status_code == 422


def test_chat_validation_empty_session_id(client):
    """
    Test POST /chat returns HTTP 422 for empty session_id string.
    """
    response = client.post("/chat", json={"session_id": "", "message": "hello"})
    assert response.status_code == 422


def test_chat_validation_empty_message(client):
    """
    Test POST /chat returns HTTP 422 for empty or whitespace-only message.
    """
    response = client.post("/chat", json={"session_id": "s-test", "message": ""})
    assert response.status_code == 422

    response = client.post("/chat", json={"session_id": "s-test", "message": "   \n\t   "})
    assert response.status_code == 422


def test_chat_validation_message_too_long(client):
    """
    Test POST /chat returns HTTP 422 for message > 4000 characters.
    """
    long_msg = "a" * 4001
    response = client.post("/chat", json={"session_id": "s-test", "message": long_msg})
    assert response.status_code == 422


def test_chat_validation_session_id_too_long(client):
    """
    Test POST /chat returns HTTP 422 for session_id > 128 characters.
    """
    long_session = "s" * 129
    response = client.post("/chat", json={"session_id": long_session, "message": "hello"})
    assert response.status_code == 422
