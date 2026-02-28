import { useState } from "react";
import { COLORS, H, B, Card, PageHeader, Badge } from "../../constants.jsx";

const LOG_DATA = [
  { id:  1, usuario: "carlos.ruiz@gms.com",   accion: "LOGIN",       entidad: "Sesión",             fecha: "2026-02-28 09:14:22", ip: "88.12.34.56" },
  { id:  2, usuario: "carlos.ruiz@gms.com",   accion: "EDIT",        entidad: "R-ES02-01",          fecha: "2026-02-28 09:22:07", ip: "88.12.34.56" },
  { id:  3, usuario: "laura.sanchez@gms.com", accion: "CREATE",      entidad: "Oferta O20260228",   fecha: "2026-02-28 10:01:44", ip: "88.12.34.57" },
  { id:  4, usuario: "admin@gms.com",         accion: "USER_CREATE", entidad: "miguel.torres",      fecha: "2026-02-28 10:15:00", ip: "88.12.34.58" },
  { id:  5, usuario: "ana.garcia@gms.com",    accion: "VIEW",        entidad: "Canal Denuncias",    fecha: "2026-02-28 11:00:10", ip: "88.12.34.59" },
  { id:  6, usuario: "admin@gms.com",         accion: "ROLE_CHANGE", entidad: "ana.garcia",         fecha: "2026-02-28 11:30:22", ip: "88.12.34.58" },
  { id:  7, usuario: "miguel.torres@gms.com", accion: "UPLOAD",      entidad: "Certificado.pdf",    fecha: "2026-02-28 12:10:55", ip: "88.12.34.60" },
  { id:  8, usuario: "carlos.ruiz@gms.com",   accion: "DELETE",      entidad: "Riesgo RSG-007",     fecha: "2026-02-28 12:44:01", ip: "88.12.34.56" },
  { id:  9, usuario: "admin@gms.com",         accion: "LOGOUT",      entidad: "Sesión",             fecha: "2026-02-28 13:00:00", ip: "88.12.34.58" },
  { id: 10, usuario: "laura.sanchez@gms.com", accion: "LOGIN",       entidad: "Sesión",             fecha: "2026-02-28 14:05:33", ip: "88.12.34.57" },
  { id: 11, usuario: "laura.sanchez@gms.com", accion: "EDIT",        entidad: "NC-2026-003",        fecha: "2026-02-28 14:22:11", ip: "88.12.34.57" },
  { id: 12, usuario: "admin@gms.com",         accion: "LOGIN",       entidad: "Sesión",             fecha: "2026-02-28 15:00:00", ip: "88.12.34.58" },
];

const ACCION_CFG = {
  LOGIN:       { bg: "#E8F5E9", color: "#2E7D32" },
  LOGOUT:      { bg: "#F5F5F5", color: "#888888" },
  VIEW:        { bg: "#E3F2FD", color: "#1565C0" },
  CREATE:      { bg: "#E8EAF6", color: "#3949AB" },
  EDIT:        { bg: "#FFF8E1", color: "#F57F17" },
  DELETE:      { bg: "#FFEBEE", color: "#C62828" },
  UPLOAD:      { bg: "#F3E5F5", color: "#6A1B9A" },
  USER_CREATE: { bg: "#FFF3E0", color: "#E65100" },
  ROLE_CHANGE: { bg: "#FCE4EC", color: "#880E4F" },
};

export default function AdmLog() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const visible = LOG_DATA.filter(l => {
    const matchSearch = !search ||
      l.usuario.toLowerCase().includes(search.toLowerCase()) ||
      l.accion.includes(search.toUpperCase()) ||
      l.entidad.toLowerCase().includes(search.toLowerCase());
    const matchFrom = !dateFrom || l.fecha >= dateFrom;
    const matchTo   = !dateTo   || l.fecha <= dateTo + " 23:59:59";
    return matchSearch && matchFrom && matchTo;
  });

  const inp = { padding: "7px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 12, color: COLORS.gray, background: COLORS.white, outline: "none", fontFamily: B };

  return (
    <div>
      <PageHeader title="Registro de Actividad" subtitle="Audit trail cronológico de acciones realizadas en el sistema" />

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input style={{ ...inp, width: 280 }} placeholder="Filtrar por usuario, acción o entidad…" value={search} onChange={e => setSearch(e.target.value)} />
        <input style={inp} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Desde" />
        <input style={inp} type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   title="Hasta" />
        {(search || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }}
            style={{ ...inp, cursor: "pointer", color: COLORS.red, border: `1px solid #F5CCCC` }}>
            Limpiar filtros
          </button>
        )}
      </div>

      <Card style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFAFA" }}>
              {["Fecha / Hora", "Usuario", "Acción", "Entidad Afectada", "IP"].map(h => (
                <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `2px solid ${COLORS.border}`, fontFamily: H, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((l, i) => {
              const acfg = ACCION_CFG[l.accion] ?? { bg: "#EEE", color: "#555" };
              return (
                <tr key={l.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FCFCFC" }}>
                  <td style={{ padding: "9px 16px", fontSize: 11, color: COLORS.grayLight, fontFamily: "monospace", whiteSpace: "nowrap" }}>{l.fecha}</td>
                  <td style={{ padding: "9px 16px", fontSize: 12, color: COLORS.gray, fontFamily: B }}>{l.usuario}</td>
                  <td style={{ padding: "9px 16px" }}><Badge label={l.accion} bg={acfg.bg} color={acfg.color} /></td>
                  <td style={{ padding: "9px 16px", fontSize: 12, color: COLORS.gray, fontFamily: B }}>{l.entidad}</td>
                  <td style={{ padding: "9px 16px", fontSize: 11, color: COLORS.grayLight, fontFamily: "monospace" }}>{l.ip}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: COLORS.grayLight, fontFamily: B }}>Sin resultados para los filtros aplicados.</div>
        )}
      </Card>
    </div>
  );
}
