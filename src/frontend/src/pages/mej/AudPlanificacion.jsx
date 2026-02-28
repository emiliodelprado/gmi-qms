import { useState } from "react";
import { COLORS, H, B, Card, PageHeader, Badge, Icon, BtnPrimary } from "../../constants.jsx";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const AUDITORIAS = [
  {
    id: "AUD-2026-01",
    titulo: "Auditoría Interna ISO 9001 – GMS",
    tipo: "Interna",
    empresa: "GMS",
    alcance: ["Procesos Estratégicos", "Operaciones Comercial", "Mejora Continua"],
    auditor: "Carlos Ruiz",
    fechaPrevista: "2026-03-15",
    fechaFin: "2026-03-16",
    mes: 2,
    estado: "Planificada",
    informe: "Pendiente",
  },
  {
    id: "AUD-2026-02",
    titulo: "Auditoría Interna ISO 27001 – GMS",
    tipo: "Interna",
    empresa: "GMS",
    alcance: ["Seguridad de la Información", "Activos Digitales", "Control de Acceso"],
    auditor: "Ana García",
    fechaPrevista: "2026-04-22",
    fechaFin: "2026-04-23",
    mes: 3,
    estado: "Planificada",
    informe: "Pendiente",
  },
  {
    id: "AUD-2026-03",
    titulo: "Revisión por la Dirección Q1",
    tipo: "Dirección",
    empresa: "GMI",
    alcance: ["Todos los procesos", "Indicadores de desempeño", "Riesgos y oportunidades"],
    auditor: "Dirección General",
    fechaPrevista: "2026-01-30",
    fechaFin: "2026-01-30",
    mes: 0,
    estado: "Completada",
    informe: "Emitido",
  },
  {
    id: "AUD-2026-04",
    titulo: "Auditoría Externa ISO 9001 – Recertificación",
    tipo: "Externa",
    empresa: "GMS",
    alcance: ["Sistema de Gestión de Calidad completo"],
    auditor: "Bureau Veritas",
    fechaPrevista: "2026-06-10",
    fechaFin: "2026-06-11",
    mes: 5,
    estado: "Planificada",
    informe: "Pendiente",
  },
  {
    id: "AUD-2026-05",
    titulo: "Auditoría Interna ISO 9001 – GMP",
    tipo: "Interna",
    empresa: "GMP",
    alcance: ["Procesos Operativos", "Talento Humano", "Soporte Documental"],
    auditor: "Laura Sánchez",
    fechaPrevista: "2026-05-18",
    fechaFin: "2026-05-19",
    mes: 4,
    estado: "En curso",
    informe: "Borrador",
  },
  {
    id: "AUD-2026-06",
    titulo: "Auditoría de Proveedores Críticos",
    tipo: "Proveedores",
    empresa: "GMI",
    alcance: ["Evaluación de proveedores homologados"],
    auditor: "Miguel Torres",
    fechaPrevista: "2026-09-08",
    fechaFin: "2026-09-09",
    mes: 8,
    estado: "Planificada",
    informe: "Pendiente",
  },
  {
    id: "AUD-2026-07",
    titulo: "Revisión por la Dirección Q3",
    tipo: "Dirección",
    empresa: "GMI",
    alcance: ["Todos los procesos", "Seguimiento de objetivos", "Estado de NC"],
    auditor: "Dirección General",
    fechaPrevista: "2026-07-31",
    fechaFin: "2026-07-31",
    mes: 6,
    estado: "Planificada",
    informe: "Pendiente",
  },
  {
    id: "AUD-2026-08",
    titulo: "Auditoría Interna ISO 27001 – GMP",
    tipo: "Interna",
    empresa: "GMP",
    alcance: ["Seguridad lógica", "Gestión de incidentes", "Continuidad de negocio"],
    auditor: "Ana García",
    fechaPrevista: "2026-10-14",
    fechaFin: "2026-10-15",
    mes: 9,
    estado: "Planificada",
    informe: "Pendiente",
  },
];

const TIPO_CFG = {
  "Interna":     { bg: "#E3F2FD", color: "#1565C0" },
  "Externa":     { bg: "#F3E5F5", color: "#6A1B9A" },
  "Dirección":   { bg: "#FFF3E0", color: "#E65100" },
  "Proveedores": { bg: "#E8F5E9", color: "#2E7D32" },
};

const ESTADO_CFG = {
  "Planificada": { bg: "#EDE7F6", color: "#4527A0" },
  "En curso":    { bg: "#FFF8E1", color: "#F57F17" },
  "Completada":  { bg: "#E8F5E9", color: "#2E7D32" },
};

const INFORME_CFG = {
  "Pendiente": { bg: "#F5F5F5", color: "#888" },
  "Borrador":  { bg: "#FFF8E1", color: "#F57F17" },
  "Emitido":   { bg: "#E8F5E9", color: "#2E7D32" },
};

export default function AudPlanificacion() {
  const [filtroTipo,   setFiltroTipo]   = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [selected,     setSelected]     = useState(null);

  const TIPOS   = ["Todos", "Interna", "Externa", "Dirección", "Proveedores"];
  const ESTADOS = ["Todos", "Planificada", "En curso", "Completada"];

  const visible = AUDITORIAS.filter(a => {
    const matchTipo   = filtroTipo   === "Todos" || a.tipo   === filtroTipo;
    const matchEstado = filtroEstado === "Todos" || a.estado === filtroEstado;
    return matchTipo && matchEstado;
  });

  const totalComp = AUDITORIAS.filter(a => a.estado === "Completada").length;
  const totalCurso = AUDITORIAS.filter(a => a.estado === "En curso").length;
  const totalPlan = AUDITORIAS.filter(a => a.estado === "Planificada").length;
  const totalInformes = AUDITORIAS.filter(a => a.informe === "Emitido").length;

  const selectedAud = AUDITORIAS.find(a => a.id === selected);

  return (
    <div>
      <PageHeader title="Planificación de Auditorías" subtitle="Calendario anual de auditorías internas, externas y revisiones por la dirección" />

      {/* KPI strip */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total auditadas", value: AUDITORIAS.length, color: COLORS.gray },
          { label: "Completadas",     value: totalComp,          color: "#2E7D32"  },
          { label: "En curso",        value: totalCurso,         color: "#F57F17"  },
          { label: "Planificadas",    value: totalPlan,          color: "#4527A0"  },
          { label: "Informes emitidos", value: totalInformes,    color: COLORS.red },
        ].map(k => (
          <Card key={k.label} style={{ flex: 1, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: H }}>{k.value}</div>
            <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{k.label}</div>
          </Card>
        ))}
      </div>

      {/* Calendar strip */}
      <Card style={{ marginBottom: 20, padding: "16px 20px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 12 }}>
          Calendario 2026
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 6 }}>
          {MESES.map((m, idx) => {
            const audsInMonth = AUDITORIAS.filter(a => a.mes === idx);
            return (
              <div key={m} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: H, fontWeight: 800, marginBottom: 6 }}>{m}</div>
                <div style={{ minHeight: 32, background: audsInMonth.length ? "#F8F0FF" : "#F9F9F9", borderRadius: 6, padding: "4px 2px", display: "flex", flexDirection: "column", gap: 3, alignItems: "center", border: `1px solid ${audsInMonth.length ? "#D1A8F0" : COLORS.border}` }}>
                  {audsInMonth.map(a => {
                    const ecfg = ESTADO_CFG[a.estado] ?? { bg: "#EEE", color: "#555" };
                    return (
                      <div key={a.id}
                        onClick={() => setSelected(a.id === selected ? null : a.id)}
                        title={a.titulo}
                        style={{ width: "80%", height: 7, borderRadius: 4, background: ecfg.color, cursor: "pointer", opacity: selected === a.id ? 1 : 0.7 }}
                      />
                    );
                  })}
                  {audsInMonth.length === 0 && <div style={{ height: 7 }} />}
                </div>
                {audsInMonth.length > 0 && (
                  <div style={{ fontSize: 9, color: "#6A1B9A", fontFamily: H, fontWeight: 800, marginTop: 3 }}>{audsInMonth.length}</div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
          {Object.entries(ESTADO_CFG).map(([label, cfg]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: cfg.color }} />
              <span style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: B }}>{label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
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
        <div style={{ display: "flex", gap: 6 }}>
          {ESTADOS.map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)} style={{
              padding: "6px 12px", borderRadius: 20, border: `1px solid ${filtroEstado === e ? "#4527A0" : COLORS.border}`,
              background: filtroEstado === e ? "#F3E8FF" : COLORS.white,
              color: filtroEstado === e ? "#4527A0" : COLORS.grayLight,
              fontSize: 11, fontWeight: filtroEstado === e ? 800 : 400, fontFamily: H, cursor: "pointer",
            }}>{e}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFAFA" }}>
              {["ID", "Auditoría", "Tipo", "Empresa", "Auditor", "Fecha Prevista", "Estado", "Informe"].map(h => (
                <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `2px solid ${COLORS.border}`, fontFamily: H, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((a, i) => {
              const tcfg = TIPO_CFG[a.tipo] ?? { bg: "#EEE", color: "#555" };
              const ecfg = ESTADO_CFG[a.estado] ?? { bg: "#EEE", color: "#555" };
              const icfg = INFORME_CFG[a.informe] ?? { bg: "#EEE", color: "#555" };
              const isSelected = selected === a.id;
              return (
                <>
                  <tr key={a.id}
                    onClick={() => setSelected(isSelected ? null : a.id)}
                    style={{ borderBottom: `1px solid ${COLORS.border}`, background: isSelected ? "#F8F0FF" : i % 2 === 0 ? COLORS.white : "#FCFCFC", cursor: "pointer" }}>
                    <td style={{ padding: "9px 16px", fontSize: 11, color: COLORS.grayLight, fontFamily: "monospace" }}>{a.id}</td>
                    <td style={{ padding: "9px 16px", fontSize: 13, fontWeight: 700, color: COLORS.gray, fontFamily: H }}>{a.titulo}</td>
                    <td style={{ padding: "9px 16px" }}><Badge label={a.tipo} bg={tcfg.bg} color={tcfg.color} /></td>
                    <td style={{ padding: "9px 16px", fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>{a.empresa}</td>
                    <td style={{ padding: "9px 16px", fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>{a.auditor}</td>
                    <td style={{ padding: "9px 16px", fontSize: 11, color: COLORS.grayLight, fontFamily: "monospace", whiteSpace: "nowrap" }}>{a.fechaPrevista}</td>
                    <td style={{ padding: "9px 16px" }}><Badge label={a.estado} bg={ecfg.bg} color={ecfg.color} /></td>
                    <td style={{ padding: "9px 16px" }}><Badge label={a.informe} bg={icfg.bg} color={icfg.color} /></td>
                  </tr>
                  {isSelected && (
                    <tr key={`${a.id}-detail`}>
                      <td colSpan={8} style={{ padding: "0 16px 16px", background: "#F8F0FF", borderBottom: `1px solid ${COLORS.border}` }}>
                        <div style={{ padding: "14px 16px", background: COLORS.white, borderRadius: 8, border: `1px solid #D1A8F0` }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: "#4527A0", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 10 }}>Alcance de la Auditoría</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {a.alcance.map(proc => (
                              <span key={proc} style={{ padding: "5px 12px", borderRadius: 20, background: "#EDE7F6", color: "#4527A0", fontSize: 12, fontFamily: B }}>{proc}</span>
                            ))}
                          </div>
                          {a.fechaFin !== a.fechaPrevista && (
                            <div style={{ marginTop: 10, fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>
                              Fecha fin prevista: <strong style={{ color: COLORS.gray }}>{a.fechaFin}</strong>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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
