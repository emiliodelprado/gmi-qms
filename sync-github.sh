#!/usr/bin/env bash
# sync-github.sh – Commit y push de todos los cambios al repositorio GitHub
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# ── 1. Detectar estado ─────────────────────────────────────────────────────────
HAS_LOCAL_CHANGES=false
AHEAD=0

if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git status --porcelain)" ]; then
  HAS_LOCAL_CHANGES=true
fi

AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)

if [ "$HAS_LOCAL_CHANGES" = false ] && [ "$AHEAD" -eq 0 ]; then
  echo "  Sin cambios que sincronizar."
  exit 0
fi

# ── 2. Commit cambios locales (si los hay) ────────────────────────────────────
if [ "$HAS_LOCAL_CHANGES" = true ]; then
  TIMESTAMP="$(date '+%Y-%m-%d %H:%M')"
  MSG="${1:-"chore: sync $TIMESTAMP"}"

  echo "▶ Añadiendo cambios..."
  git add -A

  echo "▶ Estado:"
  git status --short

  echo ""
  echo "▶ Commit: \"$MSG\""
  git commit -m "$MSG"
else
  echo "▶ No hay cambios locales nuevos."
  echo "  $AHEAD commit(s) pendientes de push."
fi

# ── 3. Push ────────────────────────────────────────────────────────────────────
echo "▶ Push a origin/main..."
git push origin main

# Push tags pendientes (si los hay)
LOCAL_TAGS=$(git tag --points-at HEAD 2>/dev/null || true)
if [ -n "$LOCAL_TAGS" ]; then
  echo "▶ Push tags: $LOCAL_TAGS"
  git push origin --tags
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Sincronizado con GitHub correctamente."
echo "  Repo: $(git remote get-url origin)"
echo "  Commit: $(git rev-parse --short HEAD)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
