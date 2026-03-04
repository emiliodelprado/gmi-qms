import { useState, useEffect, useContext } from "react";
import { COLORS, H, B, Card, PageHeader, apiFetch } from "../../constants.jsx";
import { PermissionsContext } from "../../contexts.jsx";

const TIMEZONE_OPTIONS = [
  // España
  { value: "Europe/Madrid",    label: "Europe/Madrid (CET/CEST)" },
  { value: "Atlantic/Canary",  label: "Atlantic/Canary (WET/WEST)" },
  // Europa
  { value: "Europe/London",    label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris",     label: "Europe/Paris (CET/CEST)" },
  { value: "Europe/Berlin",    label: "Europe/Berlin (CET/CEST)" },
  { value: "Europe/Rome",      label: "Europe/Rome (CET/CEST)" },
  { value: "Europe/Lisbon",    label: "Europe/Lisbon (WET/WEST)" },
  { value: "Europe/Brussels",  label: "Europe/Brussels (CET/CEST)" },
  { value: "Europe/Amsterdam", label: "Europe/Amsterdam (CET/CEST)" },
  { value: "Europe/Zurich",    label: "Europe/Zurich (CET/CEST)" },
  { value: "Europe/Warsaw",    label: "Europe/Warsaw (CET/CEST)" },
  { value: "Europe/Athens",    label: "Europe/Athens (EET/EEST)" },
  { value: "Europe/Helsinki",  label: "Europe/Helsinki (EET/EEST)" },
  { value: "Europe/Moscow",    label: "Europe/Moscow (MSK)" },
  // Americas
  { value: "America/New_York",      label: "America/New_York (EST/EDT)" },
  { value: "America/Chicago",       label: "America/Chicago (CST/CDT)" },
  { value: "America/Denver",        label: "America/Denver (MST/MDT)" },
  { value: "America/Los_Angeles",   label: "America/Los_Angeles (PST/PDT)" },
  { value: "America/Mexico_City",   label: "America/Mexico_City (CST/CDT)" },
  { value: "America/Bogota",        label: "America/Bogota (COT)" },
  { value: "America/Sao_Paulo",     label: "America/Sao_Paulo (BRT)" },
  { value: "America/Argentina/Buenos_Aires", label: "America/Buenos_Aires (ART)" },
  // UTC
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
];

export default function AdmRegionalSettings() {
  const perms = useContext(PermissionsContext);
  const canWrite = (() => { const p = perms?.["v-regional"]; return p === undefined || p === "R/W"; })();

  const [timezone, setTimezone] = useState("Europe/Madrid");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    apiFetch("/api/adm/regional-settings")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.timezone) setTimezone(data.timezone); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await apiFetch("/api/adm/regional-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setError(e.detail || "Error al guardar.");
        return;
      }
      setSaved(true);
      window.dispatchEvent(new CustomEvent("regional-settings-saved", { detail: { timezone } }));
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Error de conexión.");
    } finally {
      setSaving(false);
    }
  };

  const inp = {
    width: "100%", padding: "9px 12px", border: `1px solid ${COLORS.border}`,
    borderRadius: 7, fontSize: 13, color: COLORS.gray, background: "#fff",
    outline: "none", fontFamily: B, boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight,
    marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H,
  };

  return (
    <div>
      <PageHeader
        title="Configuración Regional"
        subtitle="Zona horaria y parámetros regionales de la aplicación"
      />

      {loading ? (
        <div style={{ padding: 32, textAlign: "center", color: COLORS.grayLight, fontFamily: B }}>
          Cargando configuración…
        </div>
      ) : (
        <Card style={{ padding: 28, maxWidth: 560 }}>

          {/* Timezone */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Zona horaria</label>
            <select
              style={{ ...inp, cursor: canWrite ? "pointer" : "not-allowed", appearance: "none" }}
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              disabled={!canWrite}
            >
              {TIMEZONE_OPTIONS.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: COLORS.grayLight, marginTop: 6, fontFamily: B }}>
              Se aplicará a todas las fechas y horas mostradas en la aplicación.
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <div style={{
              marginBottom: 16, padding: "8px 14px", background: "#FFF0F0",
              border: "1px solid #F5CCCC", borderRadius: 7, fontSize: 13,
              color: COLORS.red, fontFamily: B,
            }}>{error}</div>
          )}
          {saved && (
            <div style={{
              marginBottom: 16, padding: "8px 14px", background: "#E8F5E9",
              border: "1px solid #A5D6A7", borderRadius: 7, fontSize: 13,
              color: "#2E7D32", fontFamily: B,
            }}>Configuración guardada correctamente.</div>
          )}

          {/* Save button */}
          {canWrite && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "10px 24px", border: "none", borderRadius: 7,
                background: saving ? "#CCC" : COLORS.red, color: "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: 800, fontFamily: H,
              }}
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          )}

        </Card>
      )}
    </div>
  );
}
