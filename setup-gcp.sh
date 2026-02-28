#!/usr/bin/env bash
# =============================================================================
#  GMI QMS – Aprovisionamiento GCP (one-time setup)
#  Uso: ./setup-gcp.sh <PROJECT_ID>
#  Ejemplo: ./setup-gcp.sh gmi-qms-prod
# =============================================================================
set -euo pipefail

# ─── Colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}▶ $*${NC}"; }
success() { echo -e "${GREEN}✔ $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠ $*${NC}"; }
error()   { echo -e "${RED}✖ $*${NC}"; exit 1; }

# ─── Variables ────────────────────────────────────────────────────────────────
PROJECT_ID="${1:-}"
[ -z "$PROJECT_ID" ] && error "Falta PROJECT_ID. Uso: ./setup-gcp.sh <PROJECT_ID>"

REGION="europe-west1"
SERVICE="gmi-qms"
DB_INSTANCE="gmi-qms-db"
DB_NAME="gmi_qms"
DB_USER="gmi"
DOMAIN="qms.gmiberia.com"
REPO="gmi"
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/qms-backend"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GMI QMS – Setup GCP"
echo "  Proyecto : $PROJECT_ID"
echo "  Región   : $REGION"
echo "  Dominio  : $DOMAIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ─── 0. Configurar proyecto activo ────────────────────────────────────────────
info "Configurando proyecto GCP..."
gcloud config set project "$PROJECT_ID"
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
CR_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
success "Proyecto: $PROJECT_ID (nº $PROJECT_NUMBER)"

# ─── 1. Habilitar APIs ────────────────────────────────────────────────────────
info "Habilitando APIs necesarias..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  cloudresourcemanager.googleapis.com \
  --project="$PROJECT_ID" --quiet
success "APIs habilitadas."

# ─── 2. Artifact Registry ─────────────────────────────────────────────────────
info "Creando repositorio Artifact Registry ($REPO)..."
if gcloud artifacts repositories describe "$REPO" \
    --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  warn "Repositorio '$REPO' ya existe – omitido."
else
  gcloud artifacts repositories create "$REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --description="GMI QMS Docker images" \
    --project="$PROJECT_ID" --quiet
  success "Repositorio $REGION-docker.pkg.dev/$PROJECT_ID/$REPO creado."
fi

# ─── 3. Cloud SQL (PostgreSQL 16) ─────────────────────────────────────────────
info "Creando instancia Cloud SQL ($DB_INSTANCE)..."
if gcloud sql instances describe "$DB_INSTANCE" --project="$PROJECT_ID" &>/dev/null; then
  warn "Instancia '$DB_INSTANCE' ya existe – omitida."
else
  gcloud sql instances create "$DB_INSTANCE" \
    --database-version=POSTGRES_16 \
    --edition=ENTERPRISE \
    --tier=db-g1-small \
    --region="$REGION" \
    --storage-type=SSD \
    --storage-size=10GB \
    --storage-auto-increase \
    --backup-start-time=03:00 \
    --project="$PROJECT_ID" --quiet
  success "Instancia Cloud SQL '$DB_INSTANCE' creada."
fi

info "Creando base de datos '$DB_NAME'..."
if gcloud sql databases describe "$DB_NAME" \
    --instance="$DB_INSTANCE" --project="$PROJECT_ID" &>/dev/null; then
  warn "Base de datos '$DB_NAME' ya existe – omitida."
else
  gcloud sql databases create "$DB_NAME" \
    --instance="$DB_INSTANCE" --project="$PROJECT_ID" --quiet
  success "Base de datos '$DB_NAME' creada."
fi

# ─── 4. Secret Manager ────────────────────────────────────────────────────────
info "Generando y almacenando secretos en Secret Manager..."

create_secret() {
  local NAME=$1; local VALUE=$2
  if gcloud secrets describe "$NAME" --project="$PROJECT_ID" &>/dev/null; then
    warn "Secreto '$NAME' ya existe – omitido."
  else
    echo -n "$VALUE" | gcloud secrets create "$NAME" \
      --data-file=- --project="$PROJECT_ID" --quiet
    success "Secreto '$NAME' creado."
  fi
}

# Contraseña DB: generada aleatoriamente
DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
create_secret "db-password" "$DB_PASS"

# Usuario DB: crear con la contraseña generada
info "Creando usuario DB '$DB_USER'..."
if gcloud sql users describe "$DB_USER" \
    --instance="$DB_INSTANCE" --project="$PROJECT_ID" &>/dev/null; then
  warn "Usuario '$DB_USER' ya existe – actualizando contraseña..."
  gcloud sql users set-password "$DB_USER" \
    --instance="$DB_INSTANCE" --password="$DB_PASS" --project="$PROJECT_ID" --quiet
else
  gcloud sql users create "$DB_USER" \
    --instance="$DB_INSTANCE" --password="$DB_PASS" --project="$PROJECT_ID" --quiet
  success "Usuario '$DB_USER' creado en Cloud SQL."
fi

# Session secret
SESSION_SECRET=$(openssl rand -base64 48 | tr -d '/+=')
create_secret "session-secret" "$SESSION_SECRET"

# Placeholders SAML (rellenar en consola GCP tras obtener metadatos de OneLogin)
create_secret "onelogin-idp-entity-id"  "PLACEHOLDER – rellenar desde consola OneLogin"
create_secret "onelogin-idp-sso-url"    "PLACEHOLDER – rellenar desde consola OneLogin"
create_secret "onelogin-idp-cert"       "PLACEHOLDER – rellenar desde consola OneLogin"

# ─── 5. IAM – permisos para Cloud Build y Cloud Run ──────────────────────────
info "Configurando permisos IAM..."

bind_role() {
  local MEMBER=$1; local ROLE=$2
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="$MEMBER" --role="$ROLE" --condition=None --quiet 2>/dev/null || true
}

# Cloud Build SA necesita desplegar en Cloud Run y usar la SA de Cloud Run
bind_role "serviceAccount:$CB_SA" "roles/run.admin"
bind_role "serviceAccount:$CB_SA" "roles/iam.serviceAccountUser"
bind_role "serviceAccount:$CB_SA" "roles/cloudsql.client"
bind_role "serviceAccount:$CB_SA" "roles/artifactregistry.writer"

# Cloud Run (Compute SA) necesita leer secretos y conectarse a Cloud SQL
bind_role "serviceAccount:$CR_SA" "roles/cloudsql.client"
bind_role "serviceAccount:$CR_SA" "roles/secretmanager.secretAccessor"

# Dar acceso a los secretos específicos
for SECRET in db-password session-secret onelogin-idp-entity-id onelogin-idp-sso-url onelogin-idp-cert; do
  gcloud secrets add-iam-policy-binding "$SECRET" \
    --member="serviceAccount:$CR_SA" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT_ID" --quiet 2>/dev/null || true
done

success "Permisos IAM configurados."

# ─── 6. Primer despliegue manual para crear el servicio Cloud Run ─────────────
info "Realizando despliegue inicial del servicio Cloud Run..."
warn "Esto usa una imagen placeholder hasta que Cloud Build construya la primera."

# Intentar desplegar solo si el servicio no existe aún
if gcloud run services describe "$SERVICE" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  warn "Servicio Cloud Run '$SERVICE' ya existe – omitido."
else
  # Imagen placeholder de Google (responde HTTP en 8080, reemplazada en el primer push)
  gcloud run deploy "$SERVICE" \
    --image="gcr.io/cloudrun/hello" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --add-cloudsql-instances="$PROJECT_ID:$REGION:$DB_INSTANCE" \
    --set-env-vars="DB_USER=$DB_USER,DB_NAME=$DB_NAME,DB_HOST=/cloudsql/$PROJECT_ID:$REGION:$DB_INSTANCE,DEV_MODE=false,ONELOGIN_SP_ENTITY_ID=https://$DOMAIN,ONELOGIN_SP_ACS_URL=https://$DOMAIN/auth/saml/callback" \
    --set-secrets="DB_PASSWORD=db-password:latest,SESSION_SECRET=session-secret:latest,ONELOGIN_IDP_ENTITY_ID=onelogin-idp-entity-id:latest,ONELOGIN_IDP_SSO_URL=onelogin-idp-sso-url:latest,ONELOGIN_IDP_CERT=onelogin-idp-cert:latest" \
    --project="$PROJECT_ID" --quiet
  success "Servicio '$SERVICE' creado (se sobreescribirá con la imagen real en el primer push)."
fi

# ─── 7. Domain Mapping ────────────────────────────────────────────────────────
info "Configurando domain mapping para $DOMAIN..."
if gcloud beta run domain-mappings describe \
    --domain="$DOMAIN" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  warn "Domain mapping para '$DOMAIN' ya existe – omitido."
else
  gcloud beta run domain-mappings create \
    --service="$SERVICE" \
    --domain="$DOMAIN" \
    --region="$REGION" \
    --project="$PROJECT_ID" --quiet
  success "Domain mapping creado para $DOMAIN."
fi

# ─── 8. Registros DNS necesarios ──────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}  DNS: Añade estos registros en tu proveedor (gmiberia.com)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Registros CNAME para verificación SSL y routing:"
gcloud beta run domain-mappings describe \
  --domain="$DOMAIN" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format="table[box](resourceRecords[].name,resourceRecords[].type,resourceRecords[].rrdata)" \
  2>/dev/null || echo "  (Ejecuta este script tras el primer despliegue para ver los registros DNS)"
echo ""

# ─── 9. Cloud Build trigger (instrucciones) ───────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}  Cloud Build: Conecta el repositorio GitHub${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1. Ve a: https://console.cloud.google.com/cloud-build/triggers?project=$PROJECT_ID"
echo "  2. → Conectar repositorio → GitHub → emiliodelprado/gmi-qms"
echo "  3. → Crear trigger:"
echo "       Nombre   : deploy-on-push-main"
echo "       Evento   : Push a rama main"
echo "       Config   : cloudbuild.yaml (autodetectado)"
echo "       Sust.    : _PROJECT_ID=$PROJECT_ID"
echo ""

# ─── 10. SAML: instrucciones OneLogin ────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}  SAML: Configura OneLogin con estos valores${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  SP Entity ID : https://$DOMAIN"
echo "  ACS URL      : https://$DOMAIN/auth/saml/callback"
echo "  SP Metadata  : https://$DOMAIN/auth/saml/metadata"
echo ""
echo "  Tras configurar OneLogin, actualiza los secretos:"
echo "    gcloud secrets versions add onelogin-idp-entity-id --data-file=- <<< 'tu-entity-id'"
echo "    gcloud secrets versions add onelogin-idp-sso-url   --data-file=- <<< 'tu-sso-url'"
echo "    gcloud secrets versions add onelogin-idp-cert      --data-file=- <<< 'tu-certificado'"
echo ""

# ─── Resumen final ────────────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}  Setup completado.${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Artifact Registry : $IMAGE"
echo "  Cloud SQL         : $PROJECT_ID:$REGION:$DB_INSTANCE"
echo "  Cloud Run         : https://console.cloud.google.com/run/detail/$REGION/$SERVICE?project=$PROJECT_ID"
echo "  Secret Manager    : https://console.cloud.google.com/security/secret-manager?project=$PROJECT_ID"
echo ""
echo "  Próximos pasos:"
echo "    1. Añade los registros DNS (tabla arriba)"
echo "    2. Conecta el repositorio GitHub en Cloud Build"
echo "    3. Rellena los secretos SAML de OneLogin"
echo "    4. Haz un push a main → Cloud Build desplegará automáticamente"
echo ""
