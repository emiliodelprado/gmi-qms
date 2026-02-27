#!/usr/bin/env bash
# sync-github.sh – Commit y push de todos los cambios al repositorio GitHub
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# ── 1. Verificar que hay cambios ───────────────────────────────────────────────
if git diff --quiet && git diff --cached --quiet && [ -z "$(git status --porcelain)" ]; then
  echo "  Sin cambios que sincronizar."
  exit 0
fi

# ── 2. Mensaje de commit ───────────────────────────────────────────────────────
TIMESTAMP="$(date '+%Y-%m-%d %H:%M')"
MSG="${1:-"chore: sync $TIMESTAMP"}"

# ── 3. Staging ─────────────────────────────────────────────────────────────────
echo "▶ Añadiendo cambios..."
git add -A

echo "▶ Estado:"
git status --short

# ── 4. Commit ──────────────────────────────────────────────────────────────────
echo ""
echo "▶ Commit: \"$MSG\""
git commit -m "$MSG"

# ── 5. Push ────────────────────────────────────────────────────────────────────
echo "▶ Push a origin/main..."
git push origin main

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Sincronizado con GitHub correctamente."
echo "  Repo: $(git remote get-url origin)"
echo "  Commit: $(git rev-parse --short HEAD) – $MSG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
