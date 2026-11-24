# CraftMind - AI-Powered Minecraft Companion

CraftMind is a robust, full-stack AI Minecraft companion designed to assist players with architectural building, redstone engineering, survival progression, and modding/development.

The system is built strictly according to specification with high-reliability design patterns: multi-turn SQLite conversation memory, LiteLLM caching, automated key/provider failover (Google Gemini as primary `key_1`, Groq as fallback `key_2`), latency/token tracking, and dynamic failure simulation.

---

## 1. Live URLs

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 2. Run Locally: With Docker and Without

### Environment Configuration

Before running, verify your `.env` file at the project root. The template `.env.example` is pre-configured:

```env
# LLM Provider API Keys (Fill these in with your real keys)
GEMINI_API_KEY=
GROQ_API_KEY=

# LLM Model Identifiers
GEMINI_MODEL=gemini/gemini-1.5-flash
GROQ_MODEL=groq/llama-3.3-70b-versatile

# Key Mapping Configuration (key_1 = Gemini, key_2 = Groq)
LLM_API_KEYS=key_1:gemini,key_2:groq

# Database Configuration
DATABASE_URL=sqlite:////data/app.db

# CORS Allowed Origins
ALLOWED_ORIGINS=http://localhost:3000

# Testing and Failure Simulation
ENABLE_FAILURE_SIMULATION=true

# LiteLLM Cache Setting
ENABLE_CACHE=true
```

> **Important**: Add your API keys to `.env`:
> - `GEMINI_API_KEY=your_gemini_api_key_here`
> - `GROQ_API_KEY=your_groq_api_key_here`

---

### Option A: Run with Docker & Docker Compose (Recommended)

Using the provided `Makefile`:

```bash
# Build and start both frontend (port 3000) and backend (port 8000)
make up

# View logs in real-time
make logs

# Stop containers (database in /data volume is safely preserved)
make down
```

Or using standard `docker compose` commands directly:

```bash
# Start containers in detached mode
docker compose up --build -d

# Stop containers
docker compose down
```

The persistent SQLite database is stored in the Docker named volume `craftmind-data` mounted at `/data/app.db`.

---

### Option B: Run Locally Without Docker

#### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux / macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend tests
pytest -v

# Start FastAPI server on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

*Note on Database Path*: When running outside Docker where `/data` is not a writable system directory, the backend automatically falls back to `./data/app.db`.

#### 2. Frontend Setup (React + Vite)

In a separate terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server on port 3000
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Design Decisions: Key Fallback, Caching, SQLite Session Storage

### Key Fallback Architecture (`key_1` -> `key_2`)
- **Key Pool**: Internal keys are mapped as `key_1` (Google Gemini via `gemini/gemini-1.5-flash`) and `key_2` (Groq via `groq/llama-3.3-70b-versatile`). Real API keys are never exposed in responses or logs.
- **Failover Trigger**: When `key_1` encounters an eligible transient failure (HTTP 429, rate-limit, quota exhausted, HTTP 500, 502, 503, connection/timeout errors), the LLM service catches the exception, logs it safely, increments `fallback_attempts`, and seamlessly invokes `key_2`.
- **Complete Outage Handling**: If all configured keys fail (or if simulated via `*=429`), the endpoint returns an HTTP 503 with `{"detail": "all providers unavailable"}` without exposing any internal stack trace or raw provider error.
- **Transactional History Integrity**: Failed requests (422 validation errors or 503 provider outages) are strictly barred from being written to the database.

### LiteLLM Caching
- **Built-in Cache**: Utilizes LiteLLM's native caching mechanism (`litellm.cache = Cache(type="disk")`).
- **Composite Cache Key**: The cache key is computed over the LLM model identifier and the complete message chain (system prompt + historical turns + latest user message).
- **Cache Hit Metadata**:
  - `resolution_source`: `"LLM_CACHE"`
  - `key_id`: `null`
  - `fallback_attempts`: `0`
  - `latency_ms`: Measured locally, significantly lower than live inference.
  - Per-turn prompt/completion tokens are preserved from the cached response.

### SQLite Multi-Turn Session Storage
- **Isolated Sessions**: All messages are partitioned by `session_id`.
- **Database Schema**:
  ```sql
  CREATE TABLE messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL
  );
  CREATE INDEX idx_messages_session_id ON messages (session_id);
  CREATE INDEX idx_messages_session_created ON messages (session_id, id ASC);
  ```
- **Context Construction**: The client transmits only the latest message. The backend queries historical rows for `session_id` in chronological order (`ORDER BY id ASC`), prepends the system prompt, appends the latest turn, and supplies the full dialogue to the model.

---

## 4. Verification: How to See Failover, Cache Hits and Per-Message Token Usage

### A. Health Check

```bash
curl -X GET http://localhost:8000/health
```

Expected Response (HTTP 200):
```json
{
  "status": "ok",
  "keys_configured": 2,
  "cache_enabled": true
}
```

---

### B. Live Inference (`POST /chat`)

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-demo-1",
    "message": "How do I build a simple redstone door?"
  }'
```

Expected Response (HTTP 200):
```json
{
  "session_id": "session-demo-1",
  "reply": "To build a simple 2x2 flush or piston redstone door...",
  "metadata": {
    "resolution_source": "LIVE_INFERENCE",
    "model": "gemini/gemini-1.5-flash",
    "latency_ms": 780,
    "input_tokens": 58,
    "output_tokens": 124,
    "key_id": "key_1",
    "fallback_attempts": 0
  }
}
```

---

### C. LiteLLM Cache Hit Verification

Repeat the exact same initial query in a new session:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-demo-2",
    "message": "How do I build a simple redstone door?"
  }'
```

Expected Response (HTTP 200, fast latency):
```json
{
  "session_id": "session-demo-2",
  "reply": "To build a simple 2x2 flush or piston redstone door...",
  "metadata": {
    "resolution_source": "LLM_CACHE",
    "model": "gemini/gemini-1.5-flash",
    "latency_ms": 4,
    "input_tokens": 58,
    "output_tokens": 124,
    "key_id": null,
    "fallback_attempts": 0
  }
}
```

---

### D. Provider Failover Simulation (`X-Simulate-Failure: key_1=429`)

Simulate a rate-limit error on the primary Gemini key (`key_1`):

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "X-Simulate-Failure: key_1=429" \
  -d '{
    "session_id": "session-failover-test",
    "message": "What is the best y-level for mining diamonds in Minecraft 1.20+?"
  }'
```

Expected Response (HTTP 200 via Groq fallback):
```json
{
  "session_id": "session-failover-test",
  "reply": "In Minecraft 1.18+, diamond ore generation increases deeper underground, with y = -58 being the optimal level...",
  "metadata": {
    "resolution_source": "LIVE_INFERENCE",
    "model": "groq/llama-3.3-70b-versatile",
    "latency_ms": 620,
    "input_tokens": 62,
    "output_tokens": 95,
    "key_id": "key_2",
    "fallback_attempts": 1
  }
}
```

---

### E. Complete Outage Simulation (`X-Simulate-Failure: *=429`)

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "X-Simulate-Failure: *=429" \
  -d '{
    "session_id": "session-outage-test",
    "message": "This request should fail cleanly without saving."
  }'
```

Expected Response (HTTP 503):
```json
{
  "detail": "all providers unavailable"
}
```

---

### F. Multi-turn Session History (`GET /sessions/{session_id}/messages`)

```bash
curl -X GET http://localhost:8000/sessions/session-failover-test/messages
```

Expected Response (HTTP 200, chronological order):
```json
{
  "session_id": "session-failover-test",
  "messages": [
    {
      "role": "user",
      "content": "What is the best y-level for mining diamonds in Minecraft 1.20+?",
      "metadata": null
    },
    {
      "role": "assistant",
      "content": "In Minecraft 1.18+, diamond ore generation increases deeper underground...",
      "metadata": {
        "resolution_source": "LIVE_INFERENCE",
        "model": "groq/llama-3.3-70b-versatile",
        "latency_ms": 620,
        "input_tokens": 62,
        "output_tokens": 95,
        "key_id": "key_2",
        "fallback_attempts": 1
      }
    }
  ]
}
```

Checking an unknown session returns HTTP 404:
```bash
curl -X GET http://localhost:8000/sessions/nonexistent-session/messages
```
```json
{
  "detail": "session not found"
}
```

---

## 5. Setup Used: Editor and AI Tools

- **Development Environment**: Antigravity AI IDE / Google DeepMind Agent Architecture
- **Language Runtimes**: Python 3.11/3.14 (FastAPI, Uvicorn, LiteLLM, SQLite3) & Node.js 20/24 (Vite, React 18)
- **Containerization**: Docker & Docker Compose with multi-stage slim builds
- **Testing Frameworks**: `pytest` & `pytest-asyncio` with HTTP test client

---

## 6. Bonus Features

1. **Interactive Mode Switcher**:
   - Quick switching between the four planned CraftMind modes: **BUILD**, **REDSTONE**, **SURVIVAL**, and **CREATE**.
2. **Frontend Failure Simulation Selector**:
   - Built directly into the UI toggle so testers and reviewers can simulate `key_1=429`, `key_1=500`, and `*=429` with a single click without opening a terminal or Postman.
3. **Optional Custom System Prompt Input**:
   - Expandable prompt customization with the required `data-testid="system-prompt-input"`.
4. **Resilient Local/Docker SQLite Resolver**:
   - Backend automatically detects whether `/data` is writable (Docker volume) or if running locally on Windows/macOS, falling back safely to `./data/app.db` without crashing.
