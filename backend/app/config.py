import os
from typing import List, Tuple
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # API Keys
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    # Models
    GEMINI_MODEL: str = "gemini/gemini-flash-lite-latest"
    GROQ_MODEL: str = "groq/openai/gpt-oss-120b"

    # Key Mapping (Internal key_1 -> Gemini, key_2 -> Groq)
    LLM_API_KEYS: str = "key_1:gemini,key_2:groq"

    # Database
    DATABASE_URL: str = "sqlite:////data/app.db"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # Testing & Caching
    ENABLE_FAILURE_SIMULATION: bool = True
    ENABLE_CACHE: bool = True

    def get_allowed_origins_list(self) -> List[str]:
        if not self.ALLOWED_ORIGINS:
            return ["http://localhost:3000", "https://craftmind-frontend.vercel.app"]
        origins = [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        for default_origin in ["http://localhost:3000", "https://craftmind-frontend.vercel.app"]:
            if default_origin not in origins:
                origins.append(default_origin)
        return origins

    def get_sqlite_path(self) -> str:
        """
        Resolves the SQLite database file path.
        In Docker, DATABASE_URL points to /data/app.db.
        When running locally outside Docker where /data is not accessible,
        gracefully falls back to a local ./data/app.db.
        """
        url = self.DATABASE_URL
        if url.startswith("sqlite:///"):
            path_str = url[len("sqlite:///"):]
            # If path_str starts with another slash, e.g. /data/app.db
            if path_str.startswith("/data"):
                # Check if /data is writable or exists
                try:
                    p = Path(path_str)
                    p.parent.mkdir(parents=True, exist_ok=True)
                    # Try creating or checking write permissions
                    return str(p.resolve())
                except (PermissionError, OSError):
                    # Fallback to local ./data/app.db
                    local_p = Path("data/app.db")
                    local_p.parent.mkdir(parents=True, exist_ok=True)
                    return str(local_p.resolve())
            else:
                p = Path(path_str)
                p.parent.mkdir(parents=True, exist_ok=True)
                return str(p.resolve())
        return "data/app.db"


settings = Settings()
