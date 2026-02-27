# ── Stage 1: Build React frontend ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
ARG GIT_SHA=dev
ENV VITE_GIT_COMMIT=$GIT_SHA
RUN npm run build
# Output: /frontend/dist/index.html + /frontend/dist/assets/

# ── Stage 2: Build Python dependencies ────────────────────────────────────────
FROM python:3.12-slim AS python-builder

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libxml2-dev libxmlsec1-dev libxmlsec1-openssl pkg-config gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 3: Final image ───────────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libxml2 libxmlsec1 libxmlsec1-openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=python-builder /install /usr/local
COPY . .

# Copy built frontend into static/ so FastAPI can serve it
COPY --from=frontend-builder /frontend/dist ./static

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "python -m alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 2"]
