#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
VENV="$ROOT/src/.venv"

echo "▶ Levantando PostgreSQL..."
docker compose up -d db

echo "▶ Esperando a que PostgreSQL esté listo..."
until docker compose exec -T db pg_isready -U gmi -d gmi_qms &>/dev/null; do
  sleep 1
done
echo "  PostgreSQL listo."

echo "▶ Cargando variables de entorno..."
cd "$ROOT/src"
set -a && source .env.local && set +a

echo "▶ Configurando entorno virtual Python..."
if [ ! -d "$VENV" ]; then
  python3 -m venv "$VENV"
  echo "  Entorno virtual creado en $VENV"
fi

echo "▶ Instalando dependencias Python (si hace falta)..."
"$VENV/bin/pip" install -r requirements.txt -q

echo "▶ Aplicando migraciones Alembic..."
"$VENV/bin/python" -m alembic upgrade head

echo "▶ Seeding usuarios de desarrollo..."
"$VENV/bin/python" seed_dev.py

echo "▶ Arrancando backend FastAPI (puerto 8000)..."
"$VENV/bin/python" -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

echo "▶ Instalando dependencias frontend (si hace falta)..."
cd "$ROOT/src/frontend"
npm install --silent
# Eliminar flag de cuarentena de macOS en binarios nativos
xattr -rd com.apple.quarantine node_modules 2>/dev/null || true

echo "▶ Arrancando frontend Vite (puerto 3001)..."
npm run dev &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Backend API:  http://localhost:8000/api/docs"
echo "  Frontend:     http://localhost:3001"
echo "  DEV_MODE:     autenticación SAML desactivada"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Ctrl+C para parar todo."

trap "echo ''; echo 'Parando servicios...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker compose stop db; exit 0" SIGINT SIGTERM

wait
