import { useState } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, Badge, BtnPrimary, inputStyle } from "../../constants.jsx";

// ─── Mock data ────────────────────────────────────────────────────────────────
const FORMACIONES_INIT = [
  {
    id: 1,
    fecha: "2026-01-15",
    titulo: "ISO 9001:2015 – Fundamentos y requisitos",
    colaborador: "Ana García Martínez",
    estado: "Realizada",
    evidencia: "certificado_iso9001_ana.pdf",
    eficacia: "Aprobado",
    notas: "Prueba práctica superada con 8.5/10.",
  },
  {
    id: 2,
    fecha: "2026-02-10",
    titulo: "Prevención de Riesgos Laborales (20h)",
    colaborador: "Carlos López Ruiz",
    estado: "Realizada",
    evidencia: "diploma_prl_carlos.pdf",
    eficacia: "Aprobado",
    notas: "Formación presencial con evaluación final.",
  },
  {
    id: 3,
    fecha: "2026-03-05",
    titulo: "Gestión de Proyectos – Metodología Ágil",
    colaborador: "María Sánchez Torres",
    estado: "Planificada",
    evidencia: null,
    eficacia: "Pendiente",
    notas: "",
  },
  {
    id: 4,
    fecha: "2026-03-20",
    titulo: "Atención al cliente y calidad de servicio",
    colaborador: "Pedro Martínez Gil",
    estado: "Planificada",
    evidencia: null,
    eficacia: "Pendiente",
    notas: "",
  },
  {
    id: 5,
    fecha: "2026-01-28",
    titulo: "Herramientas Office 365 avanzado",
    colaborador: "Ana García Martínez",
    estado: "Realizada",
    evidencia: "certificado_o365_ana.pdf",
    eficacia: "No evaluado",
    notas: "Sin evaluación de eficacia asociada.",
  },
];

const ESTADO_CFG = {
  Realizada:   { color: "#2E7D32", bg: "#E8F5E9" },
  Planificada: { color: "#1565C0", bg: "#E3F2FD" },
};

const EFICACIA_CFG = {
  Aprobado:      { color: "#2E7D32", bg: "#E8F5E9" },
  "No evaluado": { color: "#757575", bg: "#F5F5F5" },
  Pendiente:     { color: "#E65100", bg: "#FBE9E7" },
};

const FORM_EMPTY = {
  fecha: "", titulo: "", colaborador: "", estado: "Planificada",
  eficacia: "Pendiente", notas: "",
};

// ─── Main component ────────────────────────────────────────────────────────────
export default function ForFormacion() {
  const [formaciones, setFormaciones] = useState(FORMACIONES_INIT);
  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]               = useState(FORM_EMPTY);
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const realizadas  = formaciones.filter(f => f.estado === "Realizada").length;
  const planificadas = formaciones.filter(f => f.estado === "Planificada").length;
  const eficaciaOk  = formaciones.filter(f => f.eficacia === "Aprobado").length;

  const visible = filtroEstado === "Todos"
    ? formaciones
    : formaciones.filter(f => f.estado === filtroEstado);

  const handleSave = () => {
    if (!form.titulo.trim() || !form.colaborador.trim() || !form.fecha) return;
    setFormaciones(prev => [
      ...prev,
      { ...form, id: Date.now(), evidencia: null },
    ]);
    setForm(FORM_EMPTY);
    setShowModal(false);
  };

  return (
    <div>
      <PageHeader
        title="Gestión de Formación"
        subtitle="Registro de acciones formativas · IT-TAL-FOR-01"
        action={
          <BtnPrimary onClick={() => setShowModal(true)}>
            <Icon name="plus" size={14} color="#fff" /> Nueva acción
          </BtnPrimary>
        }
      />

      {/* KPI strip */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Acciones totales",   value: formaciones.length, color: COLORS.gray,  bg: COLORS.white },
          { label: "Realizadas",         value: realizadas,         color: "#2E7D32",    bg: "#E8F5E9" },
          { label: "Planificadas",       value: planificadas,       color: "#1565C0",    bg: "#E3F2FD" },
          { label: "Eficacia verificada", value: eficaciaOk,        color: "#6A1B9A",    bg: "#F3E5F5" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.color}22`, borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: H }}>{s.value}</div>
            <div style={{ fontSize: 10, color: s.color, fontFamily: B, opacity: 0.85, lineHeight: 1.3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["Todos", "Realizada", "Planificada"].map(op => (
          <button key={op} onClick={() => setFiltroEstado(op)}
            style={{
              padding: "6px 14px", border: `1px solid ${filtroEstado === op ? COLORS.red : COLORS.border}`,
              borderRadius: 6, background: filtroEstado === op ? "#FFF0F0" : COLORS.white,
              color: filtroEstado === op ? COLORS.red : COLORS.gray,
              fontSize: 12, fontWeight: filtroEstado === op ? 800 : 500,
              fontFamily: H, cursor: "pointer",
            }}>
            {op}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12, color: COLORS.grayLight, fontFamily: B, alignSelf: "center" }}>
          {visible.length} registros
        </span>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F9F9F9" }}>
              {["Fecha", "Título", "Colaborador", "Estado", "Evidencia", "Eficacia"].map(h => (
                <th key={h} style={{
                  padding: "10px 16px", textAlign: "left",
                  fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em",
                  color: COLORS.grayLight, fontWeight: 800,
                  borderBottom: `2px solid ${COLORS.border}`, fontFamily: H, whiteSpace: "nowrap",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: "center", color: COLORS.grayLight, fontFamily: B, fontSize: 13 }}>
                  No hay acciones formativas registradas.
                </td>
              </tr>
            ) : visible.map((f, i) => {
              const eCfg = ESTADO_CFG[f.estado]   || { color: COLORS.gray, bg: COLORS.bg };
              const kCfg = EFICACIA_CFG[f.eficacia] || { color: COLORS.gray, bg: COLORS.bg };
              return (
                <tr key={f.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FCFCFC" }}>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.grayLight, fontFamily: B, whiteSpace: "nowrap" }}>
                    {f.fecha}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: COLORS.gray, fontFamily: H, fontWeight: 700, maxWidth: 260 }}>
                    {f.titulo}
                    {f.notas && (
                      <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, fontWeight: 400, marginTop: 2 }}>{f.notas}</div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: COLORS.gray, fontFamily: B, whiteSpace: "nowrap" }}>
                    {f.colaborador}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge label={f.estado} bg={eCfg.bg} color={eCfg.color} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {f.evidencia ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Icon name="folder" size={13} color="#2E7D32" />
                        <span style={{ fontSize: 11, color: "#2E7D32", fontFamily: B }}>{f.evidencia}</span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Icon name="upload" size={13} color={COLORS.grayLight} />
                        <span style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>Sin evidencia</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge label={f.eficacia} bg={kCfg.bg} color={kCfg.color} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Modal: nueva acción formativa */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: COLORS.white, borderRadius: 10, width: 500, padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>
              Nueva acción formativa
            </h2>

            {[
              { label: "Fecha *",               key: "fecha",        type: "date"   },
              { label: "Título *",              key: "titulo",       type: "text",  placeholder: "Nombre de la formación" },
              { label: "Colaborador asistente *", key: "colaborador", type: "text",  placeholder: "Nombre completo" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>{f.label}</label>
                <input
                  style={inputStyle}
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>Estado</label>
                <select style={{ ...inputStyle, appearance: "none" }} value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}>
                  <option>Planificada</option>
                  <option>Realizada</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>Evaluación de eficacia</label>
                <select style={{ ...inputStyle, appearance: "none" }} value={form.eficacia} onChange={e => setForm(p => ({ ...p, eficacia: e.target.value }))}>
                  <option>Pendiente</option>
                  <option>Aprobado</option>
                  <option>No evaluado</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>Evidencia / Notas</label>
              <div style={{ padding: "10px 14px", border: `2px dashed ${COLORS.border}`, borderRadius: 8, textAlign: "center", marginBottom: 8, cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.red}
                onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}>
                <Icon name="upload" size={16} color={COLORS.grayLight} />
                <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, marginTop: 4 }}>Arrastra un archivo o haz clic para subir</div>
              </div>
              <input
                style={inputStyle}
                type="text"
                placeholder="Notas adicionales"
                value={form.notas}
                onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={() => { setShowModal(false); setForm(FORM_EMPTY); }}
                style={{ padding: "9px 18px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, color: COLORS.grayLight, fontFamily: B }}>
                Cancelar
              </button>
              <button onClick={handleSave}
                style={{ padding: "9px 20px", border: "none", borderRadius: 6, background: COLORS.red, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: H }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
