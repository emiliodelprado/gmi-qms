#!/usr/bin/env bash
# copy_config_to_prod.sh — Copia tablas de configuración de local a producción.
#
# Uso:
#   ./copy_config_to_prod.sh           # ejecución real
#   ./copy_config_to_prod.sh --dry-run # vista previa sin cambios
#
# Requisitos:
#   - gcloud CLI autenticado (gcloud auth login)
#   - cloud-sql-proxy instalado y en PATH
#   - .env.local en el mismo directorio con DB_USER / DB_PASSWORD / ...
#   - Venv en .venv/ (creado por start-dev.sh)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY_RUN=""

# ── Argumentos ────────────────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN="--dry-run" ;;
    *) echo "Argumento desconocido: $arg" >&2; exit 1 ;;
  esac
done

# ── Comprobaciones previas ────────────────────────────────────────────────────
if ! command -v gcloud &>/dev/null; then
  echo "ERROR: 'gcloud' no encontrado. Instala Google Cloud SDK." >&2
  exit 1
fi

if ! command -v cloud-sql-proxy &>/dev/null; then
  echo "ERROR: 'cloud-sql-proxy' no encontrado." >&2
  echo "       Instala con: brew install cloud-sql-proxy" >&2
  exit 1
fi

# ── Cargar .env.local ─────────────────────────────────────────────────────────
ENV_FILE="$SCRIPT_DIR/.env.local"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  echo "AVISO: .env.local no encontrado en $SCRIPT_DIR" >&2
fi

# ── Obtener contrasena de produccion desde Secret Manager ─────────────────────
echo "Obteniendo contrasena de produccion desde Secret Manager..."
TARGET_DB_PASSWORD="$(gcloud secrets versions access latest \
  --secret=db-password \
  --project=gmiberia)"

export TARGET_DB_PASSWORD
echo "  OK. Contrasena obtenida."

# ── Iniciar Cloud SQL Auth Proxy ──────────────────────────────────────────────
PROXY_PORT=5433
PROXY_PID=""

cleanup() {
  if [[ -n "$PROXY_PID" ]] && kill -0 "$PROXY_PID" 2>/dev/null; then
    echo ""
    echo "Deteniendo Cloud SQL Auth Proxy..."
    kill "$PROXY_PID" 2>/dev/null || true
    wait "$PROXY_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "Iniciando Cloud SQL Auth Proxy en puerto $PROXY_PORT..."
cloud-sql-proxy "gmiberia:europe-west1:gmi-qms-db" \
  --port="$PROXY_PORT" \
  &>/tmp/cloud-sql-proxy-copy.log &
PROXY_PID=$!

# Esperar a que el proxy este listo (hasta 15 s)
echo -n "  Esperando"
READY=0
for i in $(seq 1 15); do
  sleep 1
  echo -n "."
  if lsof -iTCP:"$PROXY_PORT" -sTCP:LISTEN -t &>/dev/null; then
    READY=1
    echo " listo (${i}s)."
    break
  fi
  if ! kill -0 "$PROXY_PID" 2>/dev/null; then
    echo ""
    echo "ERROR: El proxy termino inesperadamente." >&2
    cat /tmp/cloud-sql-proxy-copy.log >&2
    exit 1
  fi
done

if [[ "$READY" -eq 0 ]]; then
  echo ""
  echo "ERROR: El proxy no respondio en 15 segundos." >&2
  cat /tmp/cloud-sql-proxy-copy.log >&2
  exit 1
fi

# ── Activar venv y ejecutar script Python ────────────────────────────────────
VENV="$SCRIPT_DIR/.venv/bin/activate"
if [[ ! -f "$VENV" ]]; then
  echo "ERROR: Venv no encontrado en $SCRIPT_DIR/.venv" >&2
  echo "       Ejecuta ./start-dev.sh una vez para crearlo." >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$VENV"

echo ""
echo "Ejecutando copia de configuracion..."
[[ -n "$DRY_RUN" ]] && echo "  (modo dry-run -- sin cambios reales)"
echo ""

cd "$SCRIPT_DIR"
python copy_config_to_prod.py $DRY_RUN
