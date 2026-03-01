#!/usr/bin/env bash
# =============================================================================
#  GMI QMS – Test de autenticación (local + SAML)
#  Uso: ./test-auth.sh
# =============================================================================
set -euo pipefail

# ── Colores ──────────────────────────────────────────────────────────────────
GREEN="\033[0;32m"; RED="\033[0;31m"; YELLOW="\033[1;33m"
CYAN="\033[0;36m"; BOLD="\033[1m"; RESET="\033[0m"

PASS="${GREEN}✔ PASS${RESET}"
FAIL="${RED}✖ FAIL${RESET}"
MANUAL="${YELLOW}⬡ MANUAL${RESET}"
SKIP="${CYAN}— SKIP${RESET}"

# ── Config ────────────────────────────────────────────────────────────────────
COOKIE_JAR=$(mktemp)
trap "rm -f $COOKIE_JAR" EXIT

# ── Helpers ───────────────────────────────────────────────────────────────────
header() { echo -e "\n${BOLD}${CYAN}$1${RESET}"; echo "$(printf '─%.0s' {1..60})"; }
test_label() { printf "  %-4s %s\n" "[$1]" "$2"; }

check_status() {
  local expected="$1" actual="$2" label="$3"
  if [ "$actual" = "$expected" ]; then
    echo -e "       $PASS  (HTTP $actual)"
  else
    echo -e "       $FAIL  (esperado HTTP $expected, obtenido HTTP $actual)"
  fi
}

pause() { echo -e "\n  ${YELLOW}Pulsa ENTER cuando hayas completado el paso manual...${RESET}"; read -r; }

# ── Introducción ──────────────────────────────────────────────────────────────
clear
echo -e "${BOLD}"
echo "  ╔═══════════════════════════════════════════════╗"
echo "  ║   GMI QMS – Plan de pruebas de autenticación  ║"
echo "  ╚═══════════════════════════════════════════════╝"
echo -e "${RESET}"

# ── Configuración del servidor ────────────────────────────────────────────────
echo -e "  ${BOLD}Entorno de pruebas${RESET}"
echo "  1) Local     → http://localhost:3001"
echo "  2) Producción → https://qms.gmiberia.com"
echo "  3) Otro (introducir manualmente)"
echo ""
read -rp "  Selecciona [1/2/3]: " env_choice

case "$env_choice" in
  1) BASE_URL="http://localhost:3001";  ENV_LABEL="LOCAL" ;;
  2) BASE_URL="https://qms.gmiberia.com"; ENV_LABEL="PRODUCCIÓN" ;;
  3) read -rp "  URL base (sin / final): " BASE_URL; ENV_LABEL="CUSTOM" ;;
  *) echo "Opción no válida."; exit 1 ;;
esac

echo ""
echo -e "  Servidor: ${BOLD}$BASE_URL${RESET}  [${YELLOW}$ENV_LABEL${RESET}]"

# ── Credenciales para tests locales ───────────────────────────────────────────
echo ""
echo -e "  ${BOLD}Credenciales de usuario local válido (para tests 1 y 4)${RESET}"
read -rp "  Email: " VALID_EMAIL
read -rsp "  Password: " VALID_PASSWORD
echo ""

# =============================================================================
#  BLOQUE 1 – Autenticación local
# =============================================================================
header "BLOQUE 1 · Autenticación local"

# ── Test 1: Login correcto ────────────────────────────────────────────────────
test_label "T1" "Login con credenciales válidas"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -c "$COOKIE_JAR" \
  -X POST "$BASE_URL/auth/local/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$VALID_EMAIL\",\"password\":\"$VALID_PASSWORD\"}")
check_status "200" "$STATUS" "T1"
COOKIE_SET=$(grep -c "gmi_session" "$COOKIE_JAR" || true)
if [ "$COOKIE_SET" -ge 1 ]; then
  echo -e "       $PASS  (cookie gmi_session establecida)"
else
  echo -e "       $FAIL  (cookie gmi_session no encontrada)"
fi

# ── Test 2: Password incorrecta ───────────────────────────────────────────────
test_label "T2" "Login con password incorrecta"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/auth/local/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$VALID_EMAIL\",\"password\":\"password_incorrecta_xyz\"}")
check_status "401" "$STATUS" "T2"

# ── Test 3: Email no existe ───────────────────────────────────────────────────
test_label "T3" "Login con email desconocido"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/auth/local/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"noexiste_xyz@gmiberia.com","password":"cualquiera"}')
check_status "401" "$STATUS" "T3"

# ── Test 4: Logout ────────────────────────────────────────────────────────────
test_label "T4" "Logout (borra cookie de sesión)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE_URL/auth/logout")
check_status "200" "$STATUS" "T4"
COOKIE_AFTER=$(grep -c "gmi_session" "$COOKIE_JAR" || true)
if [ "$COOKIE_AFTER" -eq 0 ]; then
  echo -e "       $PASS  (cookie gmi_session eliminada)"
else
  echo -e "       $FAIL  (cookie gmi_session sigue presente)"
fi

# ── Test 5: Acceso sin sesión ─────────────────────────────────────────────────
test_label "T5" "GET /auth/me sin sesión activa → 401"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/auth/me")
check_status "401" "$STATUS" "T5"

# =============================================================================
#  BLOQUE 2 – Autenticación SAML
# =============================================================================
header "BLOQUE 2 · Autenticación SAML (OneLogin)"

# ── Test 6: Inicio flujo SAML ─────────────────────────────────────────────────
test_label "T6" "GET /auth/login → redirect a OneLogin"
REDIRECT_URL=$(curl -s -o /dev/null -w "%{redirect_url}" "$BASE_URL/auth/login" || true)
if echo "$REDIRECT_URL" | grep -q "onelogin.com"; then
  echo -e "       $PASS  (redirige a: $REDIRECT_URL)"
else
  echo -e "       $FAIL  (redirect inesperado: '$REDIRECT_URL')"
fi

# ── Test 7: Login SAML con usuario en BD ──────────────────────────────────────
test_label "T7" "Login SAML con usuario registrado en user_access"
echo -e "       $MANUAL"
echo "       Abre en el navegador: $BASE_URL/auth/login"
echo "       Introduce credenciales de un usuario que SÍ exista en user_access."
echo "       Resultado esperado: redirige a /home con sesión activa."
pause

# ── Test 8: Login SAML sin user_access ───────────────────────────────────────
test_label "T8" "Login SAML con usuario NO registrado en user_access → 403"
echo -e "       $MANUAL"
echo "       Abre en el navegador: $BASE_URL/auth/login"
echo "       Introduce credenciales de un usuario OneLogin que NO esté en user_access."
echo "       Resultado esperado: mensaje '403 No tienes acceso a esta aplicación'."
pause

# ── Test 9: Login SAML sin tenant ────────────────────────────────────────────
test_label "T9" "Login SAML con usuario en user_access pero sin tenant → 403"
echo -e "       $MANUAL"
echo "       Inserta un usuario en user_access SIN fila en user_tenants:"
echo "       INSERT INTO user_access (email,name,password_hash,activo,created_at)"
echo "         VALUES ('test-sin-tenant@dominio.com','Test',NULL,1,NOW());"
echo "       Luego inicia sesión SAML con ese usuario."
echo "       Resultado esperado: '403 Sin acceso asignado a ninguna entidad'."
pause

# ── Test 10: Logout tras SAML ────────────────────────────────────────────────
test_label "T10" "Logout tras sesión SAML"
echo -e "       $MANUAL"
echo "       Con sesión SAML activa, pulsa el botón de logout en la app."
echo "       Resultado esperado: cookie borrada, redirige a /login."
pause

# =============================================================================
#  BLOQUE 3 – Casos mixtos
# =============================================================================
header "BLOQUE 3 · Casos mixtos"

# ── Test 11: Mismo email en local y SAML ──────────────────────────────────────
test_label "T11" "Mismo email funciona por local y por SAML"
echo -e "       $MANUAL"
echo "       1) Login local:  $BASE_URL/login  → usa el email/password del test T1."
echo "       2) Logout."
echo "       3) Login SAML:   $BASE_URL/auth/login → usa el mismo email en OneLogin."
echo "       Resultado esperado: ambas sesiones funcionan con los mismos datos de usuario."
pause

# ── Test 12: Metadatos SP ─────────────────────────────────────────────────────
test_label "T12" "GET /auth/saml/metadata → XML válido"
BODY=$(curl -s "$BASE_URL/auth/saml/metadata")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/saml/metadata")
check_status "200" "$STATUS" "T12"
if echo "$BODY" | grep -q "EntityDescriptor"; then
  echo -e "       $PASS  (XML contiene EntityDescriptor)"
else
  echo -e "       $FAIL  (respuesta no parece XML SAML válido)"
fi
if echo "$BODY" | grep -q "qms.gmiberia.com"; then
  echo -e "       $PASS  (entity ID correcto: qms.gmiberia.com)"
else
  echo -e "       $FAIL  (entity ID no encontrado en el XML)"
fi

# =============================================================================
#  Resumen
# =============================================================================
header "Pruebas completadas"
echo -e "  Servidor probado: ${BOLD}$BASE_URL${RESET}  [${YELLOW}$ENV_LABEL${RESET}]"
echo ""
echo "  Tests automatizados: T1, T2, T3, T4, T5, T6, T12"
echo "  Tests manuales:      T7, T8, T9, T10, T11"
echo ""
