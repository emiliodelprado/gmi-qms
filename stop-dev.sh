#!/usr/bin/env bash
set -e

echo "▶ Parando servicios de desarrollo..."

# Backend (uvicorn en puerto 8000)
BACKEND_PIDS=$(lsof -ti :8000 2>/dev/null || true)
if [ -n "$BACKEND_PIDS" ]; then
  echo "$BACKEND_PIDS" | xargs kill -9 2>/dev/null || true
  echo "  Backend parado."
else
  echo "  Backend no estaba corriendo."
fi

# Frontend (vite en puerto 3001)
FRONTEND_PIDS=$(lsof -ti :3001 2>/dev/null || true)
if [ -n "$FRONTEND_PIDS" ]; then
  echo "$FRONTEND_PIDS" | xargs kill -9 2>/dev/null || true
  echo "  Frontend parado."
else
  echo "  Frontend no estaba corriendo."
fi

# PostgreSQL (docker compose)
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
if docker compose ps --status running 2>/dev/null | grep -q db; then
  docker compose stop db
  echo "  PostgreSQL parado."
else
  echo "  PostgreSQL no estaba corriendo."
fi

echo ""
echo "  Todos los servicios parados."
