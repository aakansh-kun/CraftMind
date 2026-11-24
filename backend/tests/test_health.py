def test_get_health_success(client):
    """
    Test GET /health returns HTTP 200 with required structure:
    - status: "ok"
    - keys_configured: 2
    - cache_enabled: true
    """
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["keys_configured"] == 2
    assert data["cache_enabled"] is True


def test_get_health_unreachable_db(client, monkeypatch):
    """
    Test GET /health returns HTTP 503 if database is unreachable.
    """
    monkeypatch.setattr("app.routes.health.check_db_health", lambda: False)
    response = client.get("/health")
    assert response.status_code == 503
    assert response.json()["detail"] == "database unreachable"
