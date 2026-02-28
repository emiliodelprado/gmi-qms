import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, H, B, Icon, PageHeader, Badge } from "../../constants.jsx";

// ─── Process data ─────────────────────────────────────────────────────────────
const PROCESOS = {
  estrategicos: [
    {
      id: "PE-01", nombre: "Planificación Estratégica", owner: "Dirección General",
      icon: "strategy", color: "#1565C0", bg: "#E3F2FD",
      descripcion: "Definición y despliegue de la estrategia corporativa, objetivos e indicadores clave de rendimiento.",
      entradas: ["Análisis de contexto (DAFO)", "Requisitos de partes interesadas", "Resultados ejercicio anterior"],
      salidas: ["Plan estratégico anual", "Mapa de objetivos", "KPIs corporativos"],
      indicadores: ["Cumplimiento objetivos estratégicos (%)", "NPS clientes", "Cuota de mercado"],
      docs: ["PE-01-PR-001", "PE-01-FO-001"],
      version: "2.1", fecha: "2025-01-15", estado: "Vigente",
      path: "/est/dash/v-obj",
    },
    {
      id: "PE-02", nombre: "Gestión del Riesgo", owner: "Comité de Riesgos",
      icon: "risk", color: "#6A1B9A", bg: "#F3E5F5",
      descripcion: "Identificación, evaluación y tratamiento sistemático de riesgos y oportunidades de la organización.",
      entradas: ["Contexto organizacional", "Incidentes y NC históricos", "Cambios normativos"],
      salidas: ["Registro de riesgos", "Plan de tratamiento", "Informes de seguimiento"],
      indicadores: ["Nº riesgos críticos abiertos", "% acciones completadas en plazo"],
      docs: ["RSG-01-PR-001", "RSG-01-FO-001"],
      version: "1.3", fecha: "2025-03-20", estado: "Vigente",
      path: "/rsg/evar/v-calc",
    },
    {
      id: "PE-03", nombre: "Revisión por la Dirección", owner: "Dirección General",
      icon: "dashboard", color: "#E65100", bg: "#FBE9E7",
      descripcion: "Revisión periódica del Sistema de Gestión de Calidad por la alta dirección para garantizar su conveniencia, adecuación y eficacia.",
      entradas: ["Resultados de auditorías internas", "Satisfacción de clientes", "Estado de objetivos", "NC abiertas"],
      salidas: ["Acta de revisión", "Decisiones de mejora", "Recursos asignados"],
      indicadores: ["Frecuencia revisiones (≥1 anual)", "Acciones de mejora generadas por revisión"],
      docs: ["PE-03-AC-001", "PE-03-PR-001"],
      version: "1.0", fecha: "2024-11-10", estado: "Vigente",
      path: "/est/dash/v-exe",
    },
  ],
  operativos: [
    {
      id: "PO-01", nombre: "Comercialización", owner: "Dir. Comercial",
      icon: "briefcase", color: "#00695C", bg: "#E0F2F1",
      descripcion: "Gestión del ciclo comercial: identificación de oportunidades, elaboración de ofertas y cierre de contratos.",
      entradas: ["Oportunidades de mercado", "Brief del cliente", "Tarifas y capacidad disponible"],
      salidas: ["Oferta aprobada y enviada", "Contrato firmado", "Proyecto iniciado"],
      indicadores: ["Tasa conversión ofertas (%)", "Valor medio oferta (€)", "Tiempo ciclo oferta (días)"],
      docs: ["PO-01-PR-001", "PO-01-FO-OFT"],
      version: "3.0", fecha: "2025-06-01", estado: "Vigente",
      path: "/ope/com/v-oft",
    },
    {
      id: "PO-02", nombre: "Gestión de Proyectos", owner: "Dir. de Proyectos",
      icon: "kanban", color: "#1565C0", bg: "#E3F2FD",
      descripcion: "Planificación, ejecución, seguimiento y cierre de proyectos de consultoría e interim management.",
      entradas: ["Contrato firmado", "Briefing inicial", "Asignación de equipo y recursos"],
      salidas: ["Entregables del proyecto", "Informe de avance semanal", "Cierre y lecciones aprendidas"],
      indicadores: ["% proyectos en plazo", "% proyectos en presupuesto", "Satisfacción cliente (NPS)"],
      docs: ["PO-02-PR-001", "PO-02-FO-ENT"],
      version: "2.2", fecha: "2025-04-15", estado: "Vigente",
      path: "/ope/prj/v-ent",
    },
    {
      id: "PO-03", nombre: "Gestión de No Conformidades", owner: "Responsable Calidad",
      icon: "warning", color: "#C62828", bg: "#FFEBEE",
      descripcion: "Identificación, registro, análisis causal y tratamiento de no conformidades, incidencias y reclamaciones de clientes.",
      entradas: ["Incidencias reportadas", "Reclamaciones de clientes", "Hallazgos de auditoría"],
      salidas: ["NC registrada y clasificada", "Acción correctiva implantada", "Verificación de eficacia"],
      indicadores: ["Nº NC abiertas", "Tiempo medio cierre NC (días)", "% NC recurrentes"],
      docs: ["MEJ-01-PR-001", "MEJ-01-FO-NC"],
      version: "1.5", fecha: "2025-02-28", estado: "Vigente",
      path: "/mej/nc/v-nc",
    },
  ],
  soporte: [
    {
      id: "PS-01", nombre: "Gestión Documental", owner: "Responsable Calidad",
      icon: "folder", color: "#4527A0", bg: "#EDE7F6",
      descripcion: "Control de la documentación del SGC: elaboración, revisión, aprobación, distribución y archivo.",
      entradas: ["Documentos nuevos o a revisar", "Solicitudes de cambio", "Cambios normativos"],
      salidas: ["Documentos aprobados y publicados", "Registro maestro actualizado"],
      indicadores: ["Nº documentos vigentes", "Nº documentos caducados pendientes de revisión"],
      docs: ["SOP-01-PR-001", "SOP-01-FO-DOC"],
      version: "2.0", fecha: "2025-01-20", estado: "Vigente",
      path: "/sop/doc/v-maes",
    },
    {
      id: "PS-02", nombre: "Gestión de Talento", owner: "Dir. de Personas",
      icon: "talent", color: "#2E7D32", bg: "#E8F5E9",
      descripcion: "Selección, incorporación, desarrollo y evaluación del capital humano de la organización.",
      entradas: ["Plan de plantilla", "Perfiles de puesto", "Evaluaciones de desempeño"],
      salidas: ["Contrataciones", "Plan de formación anual", "Evaluaciones completadas"],
      indicadores: ["Tiempo medio contratación (días)", "% plantilla con formación al día", "Índice de rotación (%)"],
      docs: ["TAL-01-PR-001", "TAL-02-FO-CHCK"],
      version: "1.2", fecha: "2024-09-01", estado: "Vigente",
      path: "/tal/emp/v-perf",
    },
    {
      id: "PS-03", nombre: "Infraestructura IT", owner: "IT Manager",
      icon: "monitor", color: "#EF6C00", bg: "#FFF3E0",
      descripcion: "Gestión del parque tecnológico, licencias software, seguridad de la información y soporte a usuarios.",
      entradas: ["Altas/bajas de usuario", "Solicitudes de equipamiento", "Alertas de seguridad"],
      salidas: ["Equipos operativos", "Usuarios configurados", "Informes de seguridad y disponibilidad"],
      indicadores: ["Disponibilidad sistemas (%)", "Nº incidencias IT/mes", "Activos pendientes renovación"],
      docs: ["SOP-02-PR-001", "SOP-02-INV"],
      version: "1.1", fecha: "2025-03-10", estado: "Vigente",
      path: "/sop/inf/v-inv",
    },
    {
      id: "PS-04", nombre: "Mejora Continua", owner: "Responsable Calidad",
      icon: "improve", color: "#00838F", bg: "#E0F7FA",
      descripcion: "Sistemática de mejora basada en PHVA: auditorías internas, análisis de datos y gestión de acciones de mejora.",
      entradas: ["Datos de rendimiento de procesos", "NC y reclamaciones", "Sugerencias internas", "Resultados de revisión"],
      salidas: ["Plan de mejora", "Acciones implantadas y verificadas", "Informes de auditoría interna"],
      indicadores: ["Nº mejoras implantadas/trimestre", "% acciones con eficacia verificada"],
      docs: ["MEJ-02-PR-001", "MEJ-02-FO-AUD"],
      version: "1.4", fecha: "2025-05-05", estado: "Vigente",
      path: "/mej/nc/v-nc",
    },
  ],
};

// ─── Lane header ──────────────────────────────────────────────────────────────
const LaneHeader = ({ label, color, bg, count }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 18px", background: bg,
    borderBottom: `2px solid ${color}`, borderRadius: "8px 8px 0 0",
  }}>
    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
    <span style={{ fontSize: 11, fontWeight: 800, color, fontFamily: H, textTransform: "uppercase", letterSpacing: "0.1em", flex: 1 }}>
      {label}
    </span>
    <span style={{ fontSize: 10, color, fontFamily: "monospace", background: `${color}20`, padding: "2px 7px", borderRadius: 10, fontWeight: 700 }}>
      {count} procesos
    </span>
  </div>
);

// ─── Arrow connector between op nodes ─────────────────────────────────────────
const Arrow = () => (
  <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
    <svg width={28} height={16} viewBox="0 0 28 16" fill="none">
      <line x1="0" y1="8" x2="20" y2="8" stroke="#CCC" strokeWidth="1.5" strokeDasharray="3 2" />
      <polyline points="14,4 20,8 14,12" fill="none" stroke="#CCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// ─── Process node card ────────────────────────────────────────────────────────
const ProcessNode = ({ proc, onClick }) => (
  <div
    onClick={() => onClick(proc)}
    style={{
      flex: 1, minWidth: 160, maxWidth: 220,
      background: COLORS.white, border: `1px solid ${COLORS.border}`,
      borderTop: `3px solid ${proc.color}`, borderRadius: 8,
      padding: "14px 16px", cursor: "pointer",
      transition: "box-shadow 0.15s, transform 0.15s",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = `0 4px 16px rgba(0,0,0,0.1)`;
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: proc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={proc.icon} size={15} color={proc.color} />
      </div>
      <span style={{ fontSize: 9, fontFamily: "monospace", color: proc.color, fontWeight: 800, background: proc.bg, padding: "2px 6px", borderRadius: 4 }}>
        {proc.id}
      </span>
    </div>
    <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.gray, fontFamily: H, marginBottom: 4, lineHeight: 1.35 }}>
      {proc.nombre}
    </div>
    <div style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: B }}>
      {proc.owner}
    </div>
    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#43A047", flexShrink: 0 }} />
      <span style={{ fontSize: 9, color: "#43A047", fontFamily: H, fontWeight: 700 }}>v{proc.version}</span>
      <span style={{ fontSize: 9, color: "#CCC", fontFamily: B, marginLeft: "auto" }}>Ver ficha →</span>
    </div>
  </div>
);

// ─── Process sheet modal ───────────────────────────────────────────────────────
const ProcessModal = ({ proc, onClose }) => {
  const navigate = useNavigate();
  if (!proc) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: COLORS.white, borderRadius: 12, width: "100%", maxWidth: 600, maxHeight: "85vh", overflow: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.22)" }}>
        {/* Modal header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${COLORS.border}`, position: "sticky", top: 0, background: COLORS.white, borderRadius: "12px 12px 0 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: proc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={proc.icon} size={20} color={proc.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 800, color: proc.color, background: proc.bg, padding: "2px 7px", borderRadius: 4 }}>{proc.id}</span>
                <Badge label="Vigente" bg="#E8F5E9" color="#2E7D32" />
                <span style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: B, marginLeft: "auto" }}>v{proc.version} · {proc.fecha}</span>
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: COLORS.gray, fontFamily: H, margin: 0 }}>{proc.nombre}</h2>
              <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, marginTop: 2 }}>Propietario: {proc.owner}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.bg}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <Icon name="x" size={18} color={COLORS.grayLight} />
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div style={{ padding: "20px 24px" }}>
          {/* Description */}
          <p style={{ fontSize: 13, color: COLORS.gray, fontFamily: B, lineHeight: 1.7, margin: "0 0 20px", padding: "12px 16px", background: COLORS.bg, borderRadius: 8, borderLeft: `3px solid ${proc.color}` }}>
            {proc.descripcion}
          </p>

          {/* Entradas / Salidas */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {[
              { label: "Entradas", items: proc.entradas, icon: "arrowRight", color: "#1565C0", bg: "#E3F2FD" },
              { label: "Salidas",  items: proc.salidas,  icon: "chevron",    color: "#2E7D32", bg: "#E8F5E9" },
            ].map(col => (
              <div key={col.label} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", background: col.bg, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name={col.icon} size={12} color={col.color} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: col.color, fontFamily: H, textTransform: "uppercase", letterSpacing: "0.08em" }}>{col.label}</span>
                </div>
                <ul style={{ margin: 0, padding: "10px 14px 10px 28px" }}>
                  {col.items.map((item, i) => (
                    <li key={i} style={{ fontSize: 12, color: COLORS.gray, fontFamily: B, lineHeight: 1.6, marginBottom: 2 }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Indicadores */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, fontFamily: H, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Indicadores Clave
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {proc.indicadores.map((ind, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: COLORS.bg, borderRadius: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: proc.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: COLORS.gray, fontFamily: B }}>{ind}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Documentos asociados */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, fontFamily: H, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Documentos Asociados
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {proc.docs.map(doc => (
                <span key={doc} style={{ padding: "4px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 5, fontSize: 11, fontFamily: "monospace", color: COLORS.gray }}>
                  {doc}
                </span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
            <button
              onClick={() => { onClose(); navigate(proc.path); }}
              style={{ flex: 1, padding: "10px 16px", background: proc.color, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: H, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
            >
              <Icon name="arrowRight" size={14} color="#fff" />
              Ver en sistema
            </button>
            <button
              onClick={() => { onClose(); navigate("/sop/doc/v-maes"); }}
              style={{ padding: "10px 16px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.gray, cursor: "pointer", fontSize: 13, fontFamily: B, display: "flex", alignItems: "center", gap: 7 }}
            >
              <Icon name="folder" size={14} color={COLORS.grayLight} />
              Documentos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────
export default function ContProcesos() {
  const [selected, setSelected] = useState(null);

  const allProcs = [
    ...PROCESOS.estrategicos,
    ...PROCESOS.operativos,
    ...PROCESOS.soporte,
  ];
  const total = allProcs.length;
  const vigentes = allProcs.filter(p => p.estado === "Vigente").length;

  return (
    <div>
      <PageHeader
        title="Listado de Procesos"
        subtitle="Sistema de Gestión de Calidad ISO 9001 · Haz clic en cualquier proceso para ver su ficha"
      />

      {/* Summary strip */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Procesos totales",      value: total,                         color: COLORS.gray,  bg: COLORS.white },
          { label: "Procesos estratégicos", value: PROCESOS.estrategicos.length,  color: "#1565C0",    bg: "#E3F2FD" },
          { label: "Procesos operativos",   value: PROCESOS.operativos.length,    color: "#00695C",    bg: "#E0F2F1" },
          { label: "Procesos de soporte",   value: PROCESOS.soporte.length,       color: "#4527A0",    bg: "#EDE7F6" },
          { label: "Vigentes",              value: vigentes,                      color: "#2E7D32",    bg: "#E8F5E9" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.color}22`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: H }}>{s.value}</div>
            <div style={{ fontSize: 10, color: s.color, fontFamily: B, opacity: 0.85, lineHeight: 1.3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* LANE 1 — Estratégicos */}
      <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
        <LaneHeader label="Procesos Estratégicos" color="#1565C0" bg="#E3F2FD" count={PROCESOS.estrategicos.length} />
        <div style={{ padding: "16px 20px", background: "#FAFCFF", display: "flex", gap: 16, alignItems: "stretch" }}>
          {PROCESOS.estrategicos.map(proc => (
            <ProcessNode key={proc.id} proc={proc} onClick={setSelected} />
          ))}
        </div>
      </div>

      {/* LANE 2 — Operativos */}
      <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
        <LaneHeader label="Procesos Operativos (Cadena de Valor)" color="#00695C" bg="#E0F2F1" count={PROCESOS.operativos.length} />
        <div style={{ padding: "16px 20px", background: "#FAFFFE" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, marginRight: 12, flexShrink: 0 }}>
              <div style={{ width: 52, padding: "8px 4px", background: "#E0F2F1", border: "1px dashed #00695C", borderRadius: 6, textAlign: "center" }}>
                <Icon name="profile" size={14} color="#00695C" />
                <div style={{ fontSize: 8, fontWeight: 800, color: "#00695C", fontFamily: H, textTransform: "uppercase", marginTop: 3 }}>Cliente</div>
              </div>
              <Arrow />
            </div>

            <div style={{ flex: 1, display: "flex", alignItems: "stretch", gap: 0 }}>
              {PROCESOS.operativos.map((proc, i) => (
                <div key={proc.id} style={{ display: "flex", alignItems: "center", flex: 1, gap: 0 }}>
                  <div style={{ flex: 1 }}>
                    <ProcessNode proc={proc} onClick={setSelected} />
                  </div>
                  {i < PROCESOS.operativos.length - 1 && <Arrow />}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, marginLeft: 12, flexShrink: 0 }}>
              <Arrow />
              <div style={{ width: 52, padding: "8px 4px", background: "#E8F5E9", border: "1px dashed #2E7D32", borderRadius: 6, textAlign: "center" }}>
                <Icon name="check" size={14} color="#2E7D32" />
                <div style={{ fontSize: 8, fontWeight: 800, color: "#2E7D32", fontFamily: H, textTransform: "uppercase", marginTop: 3 }}>Entrega</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LANE 3 — Soporte */}
      <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
        <LaneHeader label="Procesos de Soporte" color="#4527A0" bg="#EDE7F6" count={PROCESOS.soporte.length} />
        <div style={{ padding: "16px 20px", background: "#FDFAFF", display: "flex", gap: 16, alignItems: "stretch" }}>
          {PROCESOS.soporte.map(proc => (
            <ProcessNode key={proc.id} proc={proc} onClick={setSelected} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "12px 16px", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, marginTop: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, fontFamily: H, textTransform: "uppercase", letterSpacing: "0.08em" }}>Leyenda</span>
        {[
          { color: "#43A047", label: "Proceso vigente" },
          { color: "#F9A825", label: "En revisión" },
          { color: COLORS.red,  label: "Obsoleto" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
            <span style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{l.label}</span>
          </div>
        ))}
        <span style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, marginLeft: "auto" }}>
          ISO 9001:2015 · Basado en PDCA
        </span>
      </div>

      {/* Modal */}
      <ProcessModal proc={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
