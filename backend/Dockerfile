# Multi-stage Dockerfile for CraftMind FastAPI Backend
# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Minimal runtime image
FROM python:3.11-slim AS runner

WORKDIR /app

# Copy installed Python packages from builder stage
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Create /data directory for persistent SQLite database
RUN mkdir -p /data && chmod 777 /data

# Copy backend source code
COPY app/ /app/app/

EXPOSE 8000

# Start Uvicorn server on 0.0.0.0 supporting dynamic PORT (e.g. Render) with local fallback to 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
