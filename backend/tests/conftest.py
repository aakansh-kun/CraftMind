import os
import sys
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure app is importable from tests
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Configure test environment variables before importing app
os.environ["DATABASE_URL"] = "sqlite:////tmp/test_craftmind.db"
os.environ["ENABLE_FAILURE_SIMULATION"] = "true"
os.environ["ENABLE_CACHE"] = "true"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"

from app.main import app
from app.database import init_db, get_db_connection


@pytest.fixture(autouse=True)
def setup_test_db(tmp_path, monkeypatch):
    """
    Sets up an isolated SQLite database for each test.
    """
    test_db = tmp_path / "test_craftmind.db"
    monkeypatch.setattr("app.database.get_db_path", lambda: str(test_db))

    init_db()
    yield



@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
