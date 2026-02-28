import { useState } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, Badge, BtnPrimary, inputStyle } from "../../constants.jsx";

// ─── Mock data ─────────────────────────────────────────────────────────────────
const PROVEEDORES_INIT = [
  {
    id: 1,
    nombre: "Deloitte Advisory S.L.",
    categoria: "Consultoría",
    contacto: "javier.romero@deloitte.com",
    estado: "Homologado",
    ultimaEval: "2025-10-15",
    proximaEval: "2026-10-15",
    puntuacion: 92,
    certificados: ["ISO-9001-Deloitte-2025.pdf"],
    critico: true,
  },
  {
    id: 2,
    nombre: "Microsoft Ibérica S.R.L.",
    categoria: "Tecnología",
    contacto: "enterprise@microsoft.com",
    estado: "Homologado",
    ultimaEval: "2025-06-01",
    proximaEval: "2026-06-01",
    puntuacion: 98,
    certificados: ["ISO-27001-Microsoft.pdf", "SOC2-Microsoft.pdf"],
    critico: true,
  },
  {
    id: 3,
    nombre: "Grupo Securitas Direct",
    categoria: "Seguridad",
    contacto: "corporativo@securitas.es",
    estado: "Pendiente",
    ultimaEval: "2024-11-20",
    proximaEval: "2025-11-20",
    puntuacion: null,
    certificados: [],
    critico: false,
  },
  {
    id: 4,
    nombre: "Asesoría Laboral García & Asociados",
    categoria: "Legal / RRHH",
    contacto: "info@garcia-asesores.es",
    estado: "Pendiente",
    ultimaEval: null,
    proximaEval: null,
    puntuacion: null,
    certificados: [],
    critico: false,
  },
  {
    id: 5,
    nombre: "Tech Solutions Iberia S.A.",
    categoria: "Tecnología",
    contacto: "ventas@techsolutions.es",
    estado: "Rechazado",
    ultimaEval: "2025-03-10",
    proximaEval: null,
    puntuacion: 41,
    certificados: [],
    critico: false,
  },
  {
    id: 6,
    nombre: "Manpower Group España",
    categoria: "RRHH / ETT",
    contacto: "corporate@manpower.es",
    estado: "Homologado",
    ultimaEval: "2025-09-01",
    proximaEval: "2026-09-01",
    puntuacion: 85,
    certificados: ["ISO-9001-Manpower.pdf"],
    critico: true,
  },
];

const ESTADO_CFG = {
  Homologado: { color: "#2E7D32", bg: "#E8F5E9" },
  Pendiente:  { color: "#E65100", bg: "#FBE9E7" },
  Rechazado:  { color: "#C62828", bg: "#FFEBEE" },
};

const FORM_EMPTY = {
  nombre: "", categoria: "", contacto: "", estado: "Pendiente", critico: false,
};

// ─── Puntuación badge ─────────────────────────────────────────────────────────
const ScoreBadge = ({ score }) => {
  if (score === null) return <span style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>—</span>;
  const color = score >= 80 ? "#2E7D32" : score >= 60 ? "#E65100" : "#C62828";
  const bg    = score >= 80 ? "#E8F5E9" : score >= 60 ? "#FBE9E7" : "#FFEBEE";
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, background: bg, color, fontSize: 12, fontWeight: 800, fontFamily: H }}>
      {score}/100
    </span>
  );
};

// ─── Cuestionario modal ────────────────────────────────────────────────────────
const CuestionarioModal = ({ proveedor, onClose, onSave }) => {
  const [scores, setScores] = useState({
    calidad: 5, plazo: 5, precio: 5, comunicacion: 5, cumplimiento: 5,
  });

  const criterios = [
    { key: "calidad",       label: "Calidad del servicio/producto" },
    { key: "plazo",         label: "Cumplimiento de plazos" },
    { key: "precio",        label: "Competitividad de precios" },
    { key: "comunicacion",  label: "Comunicación y respuesta" },
    { key: "cumplimiento",  label: "Cumplimiento normativo" },
  ];

  const total = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / criterios.length * 10);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: COLORS.white, borderRadius: 12, width: 520, maxHeight: "85vh", overflow: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.22)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${COLORS.border}`, position: "sticky", top: 0, background: COLORS.white, borderRadius: "12px 12px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: COLORS.gray, fontFamily: H, margin: 0 }}>
                Evaluación anual de proveedor
              </h2>
              <div style={{ fontSize: 12, color: COLORS.grayLight, fontFamily: B, marginTop: 2 }}>{proveedor.nombre}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6 }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.bg}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <Icon name="x" size={18} color={COLORS.grayLight} />
            </button>
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {criterios.map(c => (
            <div key={c.key} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray, fontFamily: H }}>{c.label}</label>
                <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.red, fontFamily: H, minWidth: 28, textAlign: "right" }}>
                  {scores[c.key]}/10
                </span>
              </div>
              <input
                type="range" min={1} max={10} step={1}
                value={scores[c.key]}
                onChange={e => setScores(p => ({ ...p, [c.key]: Number(e.target.value) }))}
                style={{ width: "100%", accentColor: COLORS.red }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: COLORS.grayLight, fontFamily: B }}>
                <span>Deficiente</span><span>Excelente</span>
              </div>
            </div>
          ))}

          <div style={{ padding: "14px 18px", background: total >= 80 ? "#E8F5E9" : total >= 60 ? "#FBE9E7" : "#FFEBEE", borderRadius: 8, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>Puntuación final</span>
            <ScoreBadge score={total} />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
            <button onClick={onClose}
              style={{ padding: "9px 18px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, color: COLORS.grayLight, fontFamily: B }}>
              Cancelar
            </button>
            <button onClick={() => onSave(proveedor.id, total)}
              style={{ padding: "9px 20px", border: "none", borderRadius: 6, background: COLORS.red, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: H }}>
              Guardar evaluación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────
export default function ProvHomologacion() {
  const [proveedores, setProveedores] = useState(PROVEEDORES_INIT);
  const [showForm, setShowForm]       = useState(false);
  const [evalProv, setEvalProv]       = useState(null);
  const [form, setForm]               = useState(FORM_EMPTY);
  const [filtro, setFiltro]           = useState("Todos");

  const homologados = proveedores.filter(p => p.estado === "Homologado").length;
  const pendientes  = proveedores.filter(p => p.estado === "Pendiente").length;
  const rechazados  = proveedores.filter(p => p.estado === "Rechazado").length;
  const criticos    = proveedores.filter(p => p.critico).length;

  const visible = filtro === "Todos" ? proveedores : proveedores.filter(p => p.estado === filtro);

  const handleSaveEval = (id, puntuacion) => {
    setProveedores(prev => prev.map(p => p.id === id
      ? { ...p, puntuacion, estado: puntuacion >= 60 ? "Homologado" : "Rechazado", ultimaEval: new Date().toISOString().slice(0, 10) }
      : p
    ));
    setEvalProv(null);
  };

  const handleAdd = () => {
    if (!form.nombre.trim()) return;
    setProveedores(prev => [...prev, { ...form, id: Date.now(), ultimaEval: null, proximaEval: null, puntuacion: null, certificados: [] }]);
    setForm(FORM_EMPTY);
    setShowForm(false);
  };

  return (
    <div>
      <PageHeader
        title="Homologación y Evaluación de Proveedores"
        subtitle="Control de proveedores críticos · PR-SOP-PROV-01"
        action={
          <BtnPrimary onClick={() => setShowForm(true)}>
            <Icon name="plus" size={14} color="#fff" /> Nuevo proveedor
          </BtnPrimary>
        }
      />

      {/* KPI strip */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total proveedores", value: proveedores.length, color: COLORS.gray,  bg: COLORS.white },
          { label: "Homologados",       value: homologados,        color: "#2E7D32",    bg: "#E8F5E9"    },
          { label: "Pendientes eval.",  value: pendientes,         color: "#E65100",    bg: "#FBE9E7"    },
          { label: "Rechazados",        value: rechazados,         color: "#C62828",    bg: "#FFEBEE"    },
          { label: "Críticos",          value: criticos,           color: "#6A1B9A",    bg: "#F3E5F5"    },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.color}22`, borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: H }}>{s.value}</div>
            <div style={{ fontSize: 10, color: s.color, fontFamily: B, opacity: 0.85, lineHeight: 1.3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["Todos", "Homologado", "Pendiente", "Rechazado"].map(op => (
          <button key={op} onClick={() => setFiltro(op)}
            style={{
              padding: "6px 14px", border: `1px solid ${filtro === op ? COLORS.red : COLORS.border}`,
              borderRadius: 6, background: filtro === op ? "#FFF0F0" : COLORS.white,
              color: filtro === op ? COLORS.red : COLORS.gray,
              fontSize: 12, fontWeight: filtro === op ? 800 : 500,
              fontFamily: H, cursor: "pointer",
            }}>
            {op}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12, color: COLORS.grayLight, fontFamily: B, alignSelf: "center" }}>
          {visible.length} proveedores
        </span>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F9F9F9" }}>
              {["Proveedor", "Categoría", "Estado", "Últ. evaluación", "Puntuación", "Certificados", "Acciones"].map(h => (
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
                <td colSpan={7} style={{ padding: 32, textAlign: "center", color: COLORS.grayLight, fontFamily: B, fontSize: 13 }}>
                  No hay proveedores en este estado.
                </td>
              </tr>
            ) : visible.map((p, i) => {
              const eCfg = ESTADO_CFG[p.estado] || { color: COLORS.gray, bg: COLORS.bg };
              return (
                <tr key={p.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FCFCFC" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray, fontFamily: H }}>{p.nombre}</div>
                        <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{p.contacto}</div>
                      </div>
                      {p.critico && (
                        <span style={{ fontSize: 9, fontWeight: 800, color: "#6A1B9A", background: "#F3E5F5", padding: "2px 7px", borderRadius: 10, fontFamily: H, whiteSpace: "nowrap" }}>
                          CRÍTICO
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.gray, fontFamily: B, whiteSpace: "nowrap" }}>
                    {p.categoria}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge label={p.estado} bg={eCfg.bg} color={eCfg.color} />
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.grayLight, fontFamily: B, whiteSpace: "nowrap" }}>
                    {p.ultimaEval ?? "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <ScoreBadge score={p.puntuacion} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {p.certificados.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {p.certificados.map(cert => (
                          <div key={cert} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Icon name="folder" size={12} color="#2E7D32" />
                            <span style={{ fontSize: 10, color: "#2E7D32", fontFamily: B }}>{cert}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Icon name="upload" size={12} color={COLORS.grayLight} />
                        <span style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>Sin certificados</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => setEvalProv(p)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "5px 12px", border: `1px solid ${COLORS.red}`,
                        borderRadius: 6, background: "#FFF0F0", color: COLORS.red,
                        cursor: "pointer", fontSize: 11, fontWeight: 800, fontFamily: H,
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = COLORS.red + "22"}
                      onMouseLeave={e => e.currentTarget.style.background = "#FFF0F0"}>
                      <Icon name="chart" size={12} color={COLORS.red} />
                      Evaluar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Modal: nuevo proveedor */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: COLORS.white, borderRadius: 10, width: 460, padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>Nuevo proveedor</h2>

            {[
              { label: "Nombre *",    key: "nombre",    type: "text",  placeholder: "Razón social" },
              { label: "Categoría *", key: "categoria", type: "text",  placeholder: "Tecnología, Consultoría…" },
              { label: "Contacto",    key: "contacto",  type: "email", placeholder: "email@proveedor.com" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>{f.label}</label>
                <input style={inputStyle} type={f.type} placeholder={f.placeholder}
                  value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>Estado inicial</label>
                <select style={{ ...inputStyle, appearance: "none" }} value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}>
                  <option>Pendiente</option>
                  <option>Homologado</option>
                  <option>Rechazado</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.critico}
                    onChange={e => setForm(p => ({ ...p, critico: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: COLORS.red }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray, fontFamily: H }}>Proveedor crítico</span>
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowForm(false); setForm(FORM_EMPTY); }}
                style={{ padding: "9px 18px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, color: COLORS.grayLight, fontFamily: B }}>
                Cancelar
              </button>
              <button onClick={handleAdd}
                style={{ padding: "9px 20px", border: "none", borderRadius: 6, background: COLORS.red, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: H }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: cuestionario evaluación */}
      {evalProv && (
        <CuestionarioModal proveedor={evalProv} onClose={() => setEvalProv(null)} onSave={handleSaveEval} />
      )}
    </div>
  );
}
