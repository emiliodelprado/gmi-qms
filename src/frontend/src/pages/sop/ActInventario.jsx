import { useState } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, Badge } from "../../constants.jsx";

const ACTIVOS = [
  { id: "DIG-001", nombre: "Microsoft 365 Business",      tipo: "Software",   responsable: "IT Central",       sensibilidad: "Alta",  estado: "Activo",   caducidad: "2026-12-31", licencias: 50  },
  { id: "DIG-002", nombre: "CRM HubSpot Enterprise",      tipo: "Software",   responsable: "Dirección Gral.",  sensibilidad: "Alta",  estado: "Activo",   caducidad: "2026-09-30", licencias: 20  },
  { id: "DIG-003", nombre: "AWS – Cuenta Producción",     tipo: "Cloud",      responsable: "IT Central",       sensibilidad: "Alta",  estado: "Activo",   caducidad: "—",          licencias: null },
  { id: "DIG-004", nombre: "Azure AD (Entra ID)",         tipo: "Cloud",      responsable: "IT Central",       sensibilidad: "Alta",  estado: "Activo",   caducidad: "—",          licencias: null },
  { id: "DIG-005", nombre: "Base de Datos PostgreSQL QMS",tipo: "Base de Datos",responsable: "IT Central",    sensibilidad: "Alta",  estado: "Activo",   caducidad: "—",          licencias: null },
  { id: "DIG-006", nombre: "API OneLogin SSO",            tipo: "API",        responsable: "IT Central",       sensibilidad: "Alta",  estado: "Activo",   caducidad: "2027-01-15", licencias: null },
  { id: "DIG-007", nombre: "Dominio gmiberia.com",        tipo: "Dominio",    responsable: "Dirección Gral.",  sensibilidad: "Media", estado: "Activo",   caducidad: "2026-11-01", licencias: null },
  { id: "DIG-008", nombre: "Slack Business+",            tipo: "Software",   responsable: "RRHH",             sensibilidad: "Media", estado: "Activo",   caducidad: "2026-08-01", licencias: 60  },
  { id: "DIG-009", nombre: "Adobe Acrobat Pro",           tipo: "Software",   responsable: "Calidad",          sensibilidad: "Baja",  estado: "Activo",   caducidad: "2026-06-30", licencias: 5   },
  { id: "DIG-010", nombre: "Dropbox Business",            tipo: "Cloud",      responsable: "IT Central",       sensibilidad: "Media", estado: "Inactivo", caducidad: "2025-12-31", licencias: null },
  { id: "DIG-011", nombre: "API Stripe (pagos)",          tipo: "API",        responsable: "Operaciones",      sensibilidad: "Alta",  estado: "Activo",   caducidad: "—",          licencias: null },
  { id: "DIG-012", nombre: "Dominio gmiberia.pt",         tipo: "Dominio",    responsable: "Dirección Gral.",  sensibilidad: "Media", estado: "Activo",   caducidad: "2026-10-15", licencias: null },
];

const TIPO_CFG = {
  "Software":     { bg: "#E3F2FD", color: "#1565C0" },
  "Cloud":        { bg: "#F3E5F5", color: "#6A1B9A" },
  "Base de Datos":{ bg: "#FFEBEE", color: "#C62828" },
  "API":          { bg: "#FFF8E1", color: "#F57F17" },
  "Dominio":      { bg: "#E8F5E9", color: "#2E7D32" },
};

const SENS_CFG = {
  Alta:  { bg: "#FFEBEE", color: "#C62828" },
  Media: { bg: "#FFF8E1", color: "#F57F17" },
  Baja:  { bg: "#E8F5E9", color: "#2E7D32" },
};

const TIPOS = ["Todos", "Software", "Cloud", "Base de Datos", "API", "Dominio"];

export default function ActInventario() {
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [search, setSearch]         = useState("");

  const visible = ACTIVOS.filter(a => {
    const matchTipo   = filtroTipo === "Todos" || a.tipo === filtroTipo;
    const matchSearch = !search || a.nombre.toLowerCase().includes(search.toLowerCase()) || a.responsable.toLowerCase().includes(search.toLowerCase());
    return matchTipo && matchSearch;
  });

  const totalAlta  = ACTIVOS.filter(a => a.sensibilidad === "Alta").length;
  const totalActiv = ACTIVOS.filter(a => a.estado === "Activo").length;

  return (
    <div>
      <PageHeader title="Inventario de Activos Digitales" subtitle="Registro de activos de información: software, cloud, APIs, bases de datos y dominios" />

      {/* KPI strip */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total activos",         value: ACTIVOS.length,  color: COLORS.gray  },
          { label: "Activos",               value: totalActiv,      color: "#2E7D32"    },
          { label: "Sensibilidad Alta",      value: totalAlta,       color: "#C62828"    },
          { label: "Inactivos / Caducados", value: ACTIVOS.length - totalActiv, color: "#888" },
        ].map(k => (
          <Card key={k.label} style={{ flex: 1, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: H }}>{k.value}</div>
            <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{k.label}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="Buscar por nombre o responsable…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "7px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 12, color: COLORS.gray, background: COLORS.white, outline: "none", fontFamily: B, width: 260 }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {TIPOS.map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)} style={{
              padding: "6px 12px", borderRadius: 20, border: `1px solid ${filtroTipo === t ? COLORS.red : COLORS.border}`,
              background: filtroTipo === t ? "#FFF8F8" : COLORS.white,
              color: filtroTipo === t ? COLORS.red : COLORS.grayLight,
              fontSize: 11, fontWeight: filtroTipo === t ? 800 : 400, fontFamily: H, cursor: "pointer",
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFAFA" }}>
              {["ID", "Activo", "Tipo", "Responsable", "Sensibilidad", "Estado", "Caducidad", "Licencias"].map(h => (
                <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `2px solid ${COLORS.border}`, fontFamily: H, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((a, i) => {
              const tcfg = TIPO_CFG[a.tipo]  ?? { bg: "#EEE", color: "#555" };
              const scfg = SENS_CFG[a.sensibilidad] ?? { bg: "#EEE", color: "#555" };
              const inactivo = a.estado === "Inactivo";
              return (
                <tr key={a.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FCFCFC", opacity: inactivo ? 0.6 : 1 }}>
                  <td style={{ padding: "9px 16px", fontSize: 11, color: COLORS.grayLight, fontFamily: "monospace" }}>{a.id}</td>
                  <td style={{ padding: "9px 16px", fontSize: 13, fontWeight: 700, color: COLORS.gray, fontFamily: H }}>{a.nombre}</td>
                  <td style={{ padding: "9px 16px" }}><Badge label={a.tipo} bg={tcfg.bg} color={tcfg.color} /></td>
                  <td style={{ padding: "9px 16px", fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>{a.responsable}</td>
                  <td style={{ padding: "9px 16px" }}><Badge label={a.sensibilidad} bg={scfg.bg} color={scfg.color} /></td>
                  <td style={{ padding: "9px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: inactivo ? "#AAA" : "#2E7D32", fontFamily: H }}>
                      {a.estado}
                    </span>
                  </td>
                  <td style={{ padding: "9px 16px", fontSize: 11, color: COLORS.grayLight, fontFamily: "monospace" }}>{a.caducidad}</td>
                  <td style={{ padding: "9px 16px", fontSize: 12, color: COLORS.gray, fontFamily: B }}>{a.licencias ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: COLORS.grayLight, fontFamily: B }}>Sin resultados.</div>
        )}
      </Card>
    </div>
  );
}
