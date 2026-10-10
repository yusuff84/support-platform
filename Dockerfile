# ==========================================
# Stage 1: Build modern frontend SPA (Vite + React)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /build

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Python Backend Runtime
# ==========================================
FROM python:3.12-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application source code
COPY app/ ./app/
COPY tests/ ./tests/

# Copy built frontend assets from stage 1
COPY --from=frontend-builder /build/dist ./frontend/dist

# Persistent data directory
RUN mkdir -p /app/data
ENV DATABASE_PATH=/app/data/support_os.sqlite3
ENV PORT=8080
ENV HOST=0.0.0.0

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
