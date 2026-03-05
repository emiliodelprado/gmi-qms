import { useState, useEffect, useCallback, useContext } from "react";
import { COLORS, H, B, Card, PageHeader, Badge, apiFetch } from "../../constants.jsx";
import { TimezoneContext } from "../../contexts.jsx";

// ── Action colour config ───────────────────────────────────────────────────────
const ACCION_CFG = {
  LOGIN:            { bg: "#E8F5E9", color: "#2E7D32",  label: "Login" },
  LOGOUT:           { bg: "#F5F5F5", color: "#888888",  label: "Logout" },
  USER_CREATE:      { bg: "#FFF3E0", color: "#E65100",  label: "Usuario creado" },
  EDIT:             { bg: "#FFF8E1", color: "#F57F17",  label: "Edición" },
  DELETE:           { bg: "#FFEBEE", color: "#C62828",  label: "Eliminación" },
  ROLE_CHANGE:      { bg: "#FCE4EC", color: "#880E4F",  label: "Cambio de rol" },
  TENANT_ADD:       { bg: "#E8EAF6", color: "#3949AB",  label: "Acceso añadido" },
  TENANT_EDIT:      { bg: "#EDE7F6", color: "#6A1B9A",  label: "Acceso editado" },
  TENANT_REMOVE:    { bg: "#FFEBEE", color: "#B71C1C",  label: "Acceso eliminado" },
  UI_SETTINGS:      { bg: "#E0F7FA", color: "#00695C",  label: "Config. UI" },
  UI_SETTINGS_DELETE:{ bg: "#FFEBEE", color: "#880E4F", label: "Config. UI eliminada" },
  STRUCTURE_CREATE: { bg: "#E8EAF6", color: "#1A237E",  label: "Estructura creada" },
  STRUCTURE_EDIT:   { bg: "#E3F2FD", color: "#1565C0",  label: "Estructura editada" },
  STRUCTURE_DELETE: { bg: "#FFEBEE", color: "#C62828",  label: "Estructura eliminada" },
  SOLICITUD_CREATE: { bg: "#E3F2FD", color: "#1565C0",  label: "Solicitud creada" },
  SOLICITUD_EDIT:   { bg: "#FFF8E1", color: "#F57F17",  label: "Solicitud editada" },
  SOLICITUD_DELETE: { bg: "#FFEBEE", color: "#C62828",  label: "Solicitud eliminada" },
};

const ALL_ACTIONS = Object.entries(ACCION_CFG).map(([k, v]) => ({ value: k, label: v.label }));

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtTs(ts, tz = "Europe/Madrid") {
  if (!ts) return "—";
  const d = new Date(ts.endsWith?.("Z") ? ts : ts + "Z");
  return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "medium", timeZone: tz });
}

function buildQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
  return q.toString();
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdmLog() {
  const tz = useContext(TimezoneContext);
  const [rows,      setRows]     = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [error,     setError]    = useState("");
  const [exporting, setExporting] = useState(false);

  // Filters
  const [userEmail, setUserEmail] = useState("");
  const [action,    setAction]    = useState("");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");
  const [limit,     setLimit]     = useState("500");

  const hasFilter = userEmail || action || dateFrom || dateTo;

  const fetchLog = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = buildQuery({ user_email: userEmail, action, date_from: dateFrom, date_to: dateTo, limit });
      const res = await apiFetch(`/api/adm/audit-log${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error();
      setRows(await res.json());
    } catch {
      setError("No se pudo cargar el registro de actividad.");
    } finally {
      setLoading(false);
    }
  }, [userEmail, action, dateFrom, dateTo, limit]);

  // Load on mount + when filters change (debounced for text inputs)
  useEffect(() => {
    const t = setTimeout(fetchLog, userEmail ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchLog]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const qs = buildQuery({ user_email: userEmail, action, date_from: dateFrom, date_to: dateTo });
      const res = await apiFetch(`/api/adm/audit-log/csv${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `audit_log_${dateFrom || "todo"}_${dateTo || "todo"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al exportar el CSV.");
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setUserEmail(""); setAction(""); setDateFrom(""); setDateTo("");
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const inp = {
    padding: "7px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 7,
    fontSize: 12, color: COLORS.gray, background: "#fff", outline: "none", fontFamily: B,
  };

  return (
    <div>
      <PageHeader
        title="Registro de Actividad"
        subtitle="Audit trail para ISO 27001 — A.12.4 · Registro y supervisión"
      />

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ ...inp, width: 240 }}
          placeholder="Filtrar por usuario…"
          value={userEmail}
          onChange={e => setUserEmail(e.target.value)}
        />

        <select
          style={{ ...inp, cursor: "pointer" }}
          value={action}
          onChange={e => setAction(e.target.value)}
        >
          <option value="">Todas las acciones</option>
          {ALL_ACTIONS.map(a => (
            <option key={a.value} value={a.value}>{a.label} ({a.value})</option>
          ))}
        </select>

        <input style={inp} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Desde" />
        <input style={inp} type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   title="Hasta" />

        <select
          style={{ ...inp, cursor: "pointer" }}
          value={limit}
          onChange={e => setLimit(e.target.value)}
          title="Máximo de registros"
        >
          <option value="200">200 registros</option>
          <option value="500">500 registros</option>
          <option value="1000">1 000 registros</option>
          <option value="2000">2 000 registros</option>
        </select>

        {hasFilter && (
          <button
            onClick={clearFilters}
            style={{ ...inp, cursor: "pointer", color: COLORS.red, border: `1px solid #F5CCCC` }}
          >
            Limpiar filtros
          </button>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        <button
          onClick={exportCsv}
          disabled={exporting || loading}
          style={{
            ...inp,
            cursor: exporting || loading ? "not-allowed" : "pointer",
            background: exporting || loading ? COLORS.border : "#fff",
            border: `1.5px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", gap: 6,
            fontWeight: 700,
          }}
          title="Exportar CSV para auditoría ISO 27001"
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 2v10M6 8l4 4 4-4M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" strokeLinecap="round"/>
          </svg>
          {exporting ? "Exportando…" : "Exportar CSV"}
        </button>
      </div>

      {/* Counter */}
      <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, marginBottom: 10 }}>
        {loading ? "Cargando…" : `${rows.length} registros${rows.length === Number(limit) ? ` (límite ${limit}, aplica filtros para ver más)` : ""}`}
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C", marginBottom: 12 }}>
          {error}
        </div>
      )}

      <Card style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFAFA" }}>
              {["Fecha / Hora", "Usuario", "Acción", "Detalle", "Empresa", "IP"].map(h => (
                <th key={h} style={{
                  padding: "9px 14px", textAlign: "left", fontSize: 10,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  color: COLORS.grayLight, fontWeight: 800,
                  borderBottom: `2px solid ${COLORS.border}`, fontFamily: H, whiteSpace: "nowrap",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: "center", color: COLORS.grayLight, fontFamily: B }}>
                  Cargando registros…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: "center", color: COLORS.grayLight, fontFamily: B }}>
                  Sin resultados para los filtros aplicados.
                </td>
              </tr>
            ) : rows.map((r, i) => {
              const cfg = ACCION_CFG[r.action] ?? { bg: "#EEE", color: "#555" };
              const scope = [r.company_id, r.brand_id].filter(Boolean).join("·");
              return (
                <tr key={r.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? "#fff" : "#FCFCFC" }}>
                  <td style={{ padding: "8px 14px", fontSize: 11, color: COLORS.grayLight, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                    {fmtTs(r.timestamp, tz)}
                  </td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: COLORS.gray, fontFamily: B, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.user_email}
                  </td>
                  <td style={{ padding: "8px 14px" }}>
                    <Badge label={r.action} bg={cfg.bg} color={cfg.color} />
                  </td>
                  <td style={{ padding: "8px 14px", fontSize: 11, color: COLORS.gray, fontFamily: B, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.entity || "—"}
                  </td>
                  <td style={{ padding: "8px 14px", fontSize: 11, color: COLORS.grayLight, fontFamily: "monospace" }}>
                    {scope || "—"}
                  </td>
                  <td style={{ padding: "8px 14px", fontSize: 11, color: COLORS.grayLight, fontFamily: "monospace" }}>
                    {r.ip_address || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
