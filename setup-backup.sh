#!/usr/bin/env bash
# =============================================================================
#  GMI QMS – Backup diario de BD a Google Cloud Storage
#  Uso: ./setup-backup.sh <EMAIL_ALERTAS>
#  Ejemplo: ./setup-backup.sh admin@gmiberia.com
#
#  Crea:
#    - Bucket GCS con retención 30 días
#    - Cloud Run Job que exporta la BD a SQL.gz
#    - Cloud Scheduler que lo ejecuta a las 23:00 CET
#    - Alerta de Cloud Monitoring (email en éxito y fallo)
# =============================================================================
set -euo pipefail

# ─── Colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}▶ $*${NC}"; }
success() { echo -e "${GREEN}✔ $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠ $*${NC}"; }
error()   { echo -e "${RED}✖ $*${NC}"; exit 1; }

# ─── Variables ────────────────────────────────────────────────────────────────
ALERT_EMAIL="${1:-}"
[ -z "$ALERT_EMAIL" ] && error "Falta email. Uso: ./setup-backup.sh <EMAIL_ALERTAS>"

PROJECT_ID="gmiberia"
REGION="europe-west1"
DB_INSTANCE="gmi-qms-db"
DB_NAME="gmi_qms"
BUCKET="gs://gmiberia-db-backups"
JOB_NAME="db-backup"
SCHEDULER_NAME="db-backup-daily"
BACKUP_SA_NAME="backup-sa"
BACKUP_SA="${BACKUP_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GMI QMS – Setup Backup Diario"
echo "  Proyecto : $PROJECT_ID"
echo "  Instancia: $DB_INSTANCE"
echo "  Bucket   : $BUCKET"
echo "  Horario  : 23:00 Europe/Madrid"
echo "  Email    : $ALERT_EMAIL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

gcloud config set project "$PROJECT_ID"

# ─── 1. Habilitar APIs ──────────────────────────────────────────────────────
info "Habilitando APIs necesarias..."
gcloud services enable \
  cloudscheduler.googleapis.com \
  monitoring.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  --project="$PROJECT_ID" --quiet
success "APIs habilitadas."

# ─── 2. Bucket GCS con lifecycle 30 días ─────────────────────────────────────
info "Creando bucket GCS ($BUCKET)..."
if gsutil ls "$BUCKET" &>/dev/null; then
  warn "Bucket '$BUCKET' ya existe – omitido."
else
  gsutil mb -l "$REGION" -p "$PROJECT_ID" "$BUCKET"
  success "Bucket $BUCKET creado."
fi

info "Configurando lifecycle (retención 30 días)..."
LIFECYCLE_JSON=$(mktemp)
cat > "$LIFECYCLE_JSON" <<'EOF'
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": 30}
    }
  ]
}
EOF
gsutil lifecycle set "$LIFECYCLE_JSON" "$BUCKET"
rm -f "$LIFECYCLE_JSON"
success "Lifecycle configurado: delete > 30 días."

# ─── 3. Permisos de Cloud SQL SA sobre el bucket ────────────────────────────
info "Configurando permisos de la SA de Cloud SQL..."
SQL_SA=$(gcloud sql instances describe "$DB_INSTANCE" \
  --project="$PROJECT_ID" \
  --format='value(serviceAccountEmailAddress)')
gsutil iam ch "serviceAccount:${SQL_SA}:objectAdmin" "$BUCKET"
success "SA de Cloud SQL ($SQL_SA) con objectAdmin en $BUCKET."

# ─── 4. Service Account para backup ─────────────────────────────────────────
info "Creando Service Account ($BACKUP_SA_NAME)..."
if gcloud iam service-accounts describe "$BACKUP_SA" --project="$PROJECT_ID" &>/dev/null; then
  warn "SA '$BACKUP_SA' ya existe – omitida."
else
  gcloud iam service-accounts create "$BACKUP_SA_NAME" \
    --display-name="DB Backup Scheduler" \
    --project="$PROJECT_ID" --quiet
  success "SA $BACKUP_SA creada."
fi

info "Asignando roles a $BACKUP_SA_NAME..."
for ROLE in roles/cloudsql.admin roles/run.invoker; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$BACKUP_SA" \
    --role="$ROLE" \
    --quiet
done
success "Roles asignados (cloudsql.admin, run.invoker)."

# ─── 5. Cloud Run Job ───────────────────────────────────────────────────────
info "Creando Cloud Run Job ($JOB_NAME)..."
if gcloud run jobs describe "$JOB_NAME" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  warn "Job '$JOB_NAME' ya existe – actualizando..."
  gcloud run jobs update "$JOB_NAME" \
    --image="gcr.io/google.com/cloudsdktool/google-cloud-cli:slim" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --service-account="$BACKUP_SA" \
    --command="bash" \
    --args="-c,STAMP=\$(date +%Y%m%d-%H%M%S) && gcloud sql export sql $DB_INSTANCE ${BUCKET}/${DB_NAME}_\${STAMP}.sql.gz --database=$DB_NAME --project=$PROJECT_ID --quiet && echo \"Backup completado: ${DB_NAME}_\${STAMP}.sql.gz\"" \
    --max-retries=1 \
    --task-timeout=600 \
    --quiet
else
  gcloud run jobs create "$JOB_NAME" \
    --image="gcr.io/google.com/cloudsdktool/google-cloud-cli:slim" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --service-account="$BACKUP_SA" \
    --command="bash" \
    --args="-c,STAMP=\$(date +%Y%m%d-%H%M%S) && gcloud sql export sql $DB_INSTANCE ${BUCKET}/${DB_NAME}_\${STAMP}.sql.gz --database=$DB_NAME --project=$PROJECT_ID --quiet && echo \"Backup completado: ${DB_NAME}_\${STAMP}.sql.gz\"" \
    --max-retries=1 \
    --task-timeout=600 \
    --quiet
fi
success "Cloud Run Job '$JOB_NAME' configurado."

# ─── 6. Cloud Scheduler ─────────────────────────────────────────────────────
info "Creando Cloud Scheduler ($SCHEDULER_NAME)..."
SCHEDULER_URI="https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${PROJECT_ID}/jobs/${JOB_NAME}:run"

if gcloud scheduler jobs describe "$SCHEDULER_NAME" --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  warn "Scheduler '$SCHEDULER_NAME' ya existe – actualizando..."
  gcloud scheduler jobs update http "$SCHEDULER_NAME" \
    --location="$REGION" \
    --schedule="0 23 * * *" \
    --time-zone="Europe/Madrid" \
    --uri="$SCHEDULER_URI" \
    --http-method=POST \
    --oauth-service-account-email="$BACKUP_SA" \
    --project="$PROJECT_ID" --quiet
else
  gcloud scheduler jobs create http "$SCHEDULER_NAME" \
    --location="$REGION" \
    --schedule="0 23 * * *" \
    --time-zone="Europe/Madrid" \
    --uri="$SCHEDULER_URI" \
    --http-method=POST \
    --oauth-service-account-email="$BACKUP_SA" \
    --project="$PROJECT_ID" --quiet
fi
success "Scheduler '$SCHEDULER_NAME' → 23:00 Europe/Madrid."

# ─── 7. Monitoring ───────────────────────────────────────────────────────────
info "Configuración de alertas..."
warn "Las alertas de Cloud Monitoring deben configurarse desde la consola:"
echo "  1. Ve a: https://console.cloud.google.com/monitoring/alerting?project=$PROJECT_ID"
echo "  2. → Create Policy → Add Condition:"
echo "       Resource: Cloud Run Job"
echo "       Metric:   completed_execution_count"
echo "       Filter:   job_name = $JOB_NAME"
echo "  3. → Notification channel → Email → $ALERT_EMAIL"
echo ""

# ─── 8. Resumen ──────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}  Backup diario configurado.${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Bucket     : $BUCKET (retención 30 días)"
echo "  Job        : https://console.cloud.google.com/run/jobs/details/$REGION/$JOB_NAME?project=$PROJECT_ID"
echo "  Scheduler  : https://console.cloud.google.com/cloudscheduler?project=$PROJECT_ID"
echo "  Monitoring : https://console.cloud.google.com/monitoring/alerting?project=$PROJECT_ID"
echo ""
echo "  Prueba manual:"
echo "    gcloud run jobs execute $JOB_NAME --region=$REGION --project=$PROJECT_ID"
echo "    gsutil ls $BUCKET/"
echo ""
