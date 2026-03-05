#!/usr/bin/env bash
# =============================================================================
#  sync-github.sh  –  Sincroniza el repositorio local con GitHub
#
#  Uso:
#    bash sync-github.sh              → commit automático con fecha/hora
#    bash sync-github.sh "mi mensaje" → commit con mensaje personalizado
#
#  Comportamiento:
#    1. Fetch para conocer el estado remoto
#    2. Si hay cambios locales sin commitear → los commitea y sube
#    3. Si el remoto está por delante → hace pull (caso cambio de equipo)
#    4. Aplica migraciones Alembic pendientes a la BD local
# =============================================================================
set -euo pipefail

BRANCH="main"
REMOTE="origin"

# ── Colores ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Sincronización con GitHub  ·  rama: $BRANCH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Fetch silencioso para conocer el estado remoto ─────────────────────────
echo ""
echo -e "${CYAN}▶ [1/4] Consultando estado remoto...${NC}"
git fetch "$REMOTE" --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE_SHA=$(git rev-parse "$REMOTE/$BRANCH")

# ── 2. Gestión de cambios locales ─────────────────────────────────────────────
echo -e "${CYAN}▶ [2/4] Revisando cambios locales...${NC}"

STAGED=$(git diff --cached --name-only)
UNSTAGED=$(git diff --name-only)
UNTRACKED=$(git ls-files --others --exclude-standard)

HAS_CHANGES=false
if [ -n "$STAGED" ] || [ -n "$UNSTAGED" ] || [ -n "$UNTRACKED" ]; then
  HAS_CHANGES=true
fi

if $HAS_CHANGES; then
  echo -e "${YELLOW}       Hay cambios sin commitear:${NC}"
  git status --short

  # Mensaje de commit: argumento o automático
  if [ -n "${1:-}" ]; then
    MSG="$1"
  else
    VERSION=$(grep -o '"[0-9]\+\.[0-9]\+\.[0-9]\+"' src/frontend/src/components/AppFooter.jsx \
              | head -1 | tr -d '"' 2>/dev/null || echo "")
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M")
    if [ -n "$VERSION" ]; then
      MSG="chore: sync v${VERSION} – ${TIMESTAMP}"
    else
      MSG="chore: sync – ${TIMESTAMP}"
    fi
  fi

  echo ""
  echo -e "${CYAN}       Commiteando: \"$MSG\"${NC}"
  git add -A
  git commit -m "$MSG

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
  LOCAL=$(git rev-parse HEAD)
else
  echo "       Sin cambios locales."
fi

# ── 3. Push / Pull ────────────────────────────────────────────────────────────
echo -e "${CYAN}▶ [3/4] Sincronizando con $REMOTE/$BRANCH...${NC}"

# Determinar si local está delante, detrás, o divergido
AHEAD=$(git rev-list "$REMOTE_SHA..HEAD" --count 2>/dev/null || echo "0")
BEHIND=$(git rev-list "HEAD..$REMOTE_SHA" --count 2>/dev/null || echo "0")

if $HAS_CHANGES || [ "$AHEAD" -gt "0" ]; then
  # Hay cambios locales que subir
  git push "$REMOTE" "$BRANCH"
  echo -e "${GREEN}       Subido correctamente.${NC}"
elif [ "$BEHIND" -gt "0" ]; then
  # El remoto tiene commits nuevos → pull (caso cambio de equipo)
  echo -e "${YELLOW}       Remoto por delante ($BEHIND commits). Descargando...${NC}"
  git pull "$REMOTE" "$BRANCH" --ff-only
  echo -e "${GREEN}       Código actualizado desde GitHub.${NC}"
else
  echo -e "${GREEN}       Ya sincronizado. Commit: $(git rev-parse --short HEAD)${NC}"
fi

# ── 4. Actualizar esquema BD local ────────────────────────────────────────────
echo -e "${CYAN}▶ [4/4] Verificando esquema BD local...${NC}"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="$ROOT_DIR/src"
if [ -d "$SRC_DIR" ]; then
  cd "$SRC_DIR"
  if [ -d .venv ]; then source .venv/bin/activate 2>/dev/null; fi
  if [ -f .env.local ]; then set -a && source .env.local && set +a; fi
  if python3 -m alembic upgrade heads 2>/dev/null; then
    echo -e "${GREEN}       BD local al día.${NC}"
  else
    echo -e "${YELLOW}       ⚠️  No se pudo actualizar BD (¿Docker corriendo? Ejecuta: docker compose up -d db)${NC}"
  fi
  cd "$ROOT_DIR"
fi

# ── Resumen ───────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  Commit local : ${GREEN}$(git rev-parse --short HEAD)${NC}"
echo -e "  Commit remoto: ${GREEN}$(git rev-parse --short "$REMOTE/$BRANCH")${NC}"
VERSION=$(grep -o '"[0-9]\+\.[0-9]\+\.[0-9]\+"' src/frontend/src/components/AppFooter.jsx \
          | head -1 | tr -d '"' 2>/dev/null || echo "–")
echo -e "  Versión app  : ${GREEN}v${VERSION}${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
