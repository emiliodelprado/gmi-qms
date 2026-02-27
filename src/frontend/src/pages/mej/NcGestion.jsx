import { useState } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, BtnPrimary, Badge, inputStyle } from "../../constants.jsx";

const NCS_INIT = [
  { id: "NC-2026-001", titulo: "Entrega de informe fuera de plazo",     origen: "Cliente", estado: "Cerrada",   fecha: "2026-01-10", responsable: "Dir. Proyectos" },
  { id: "NC-2026-002", titulo: "Procedimiento de oferta no seguido",   origen: "Auditoría", estado: "En proceso", fecha: "2026-01-28", responsable: "Dir. Comercial" },
  { id: "NC-2026-003", titulo: "Falta de formación documentada",       origen: "Auditoría", estado: "Abierta",   fecha: "2026-02-15", responsable: "Dir. RRHH"     },
];

const ESTADO_CFG = {
  Abierta:    { bg: "#FFEBEE", color: "#C62828" },
  "En proceso":{ bg: "#E3F2FD", color: "#1565C0" },
  Cerrada:    { bg: "#E8F5E9", color: "#2E7D32" },
};

const ISHIKAWA_RAMAS = [
  { rama: "Personas",      placeholder: "¿Falta de formación, experiencia o motivación?" },
  { rama: "Método",        placeholder: "¿Procedimiento incorrecto o inexistente?"      },
  { rama: "Materiales",    placeholder: "¿Problema con insumos, herramientas o datos?"  },
  { rama: "Máquinas/IT",   placeholder: "¿Fallo de sistema, software o hardware?"       },
  { rama: "Entorno",       placeholder: "¿Factores externos o del entorno de trabajo?"  },
  { rama: "Medición",      placeholder: "¿Error en indicadores, registros o controles?" },
];

const STEPS = ["Descripción", "Análisis", "Plan de Acción"];

function NcForm({ onClose }) {
  const [step, setStep] = useState(0);
  const [desc, setDesc] = useState({ titulo: "", origen: "Auditoría interna", descripcion: "", evidencia: "" });
  const [ishikawa, setIshikawa] = useState(Object.fromEntries(ISHIKAWA_RAMAS.map(r => [r.rama, ""])));
  const [plan, setPlan] = useState({ accion: "", responsable: "", plazo: "", verificacion: "" });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: COLORS.white, borderRadius: 12, width: "100%", maxWidth: 620, maxHeight: "90vh", overflow: "auto", padding: 28, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>Nueva No Conformidad</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={18} color={COLORS.grayLight} /></button>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: i <= step ? COLORS.red : COLORS.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: i <= step ? "#fff" : COLORS.grayLight, fontFamily: H }}>
                  {i < step ? <Icon name="check" size={11} color="#fff" /> : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: i === step ? 800 : 400, color: i === step ? COLORS.gray : COLORS.grayLight, fontFamily: H }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ width: 30, height: 1, background: i < step ? COLORS.red : COLORS.border, margin: "0 8px" }} />}
            </div>
          ))}
        </div>

        {/* Step 0 */}
        {step === 0 && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>Título de la NC *</label>
              <input style={inputStyle} placeholder="Descripción breve de la no conformidad..." value={desc.titulo} onChange={e => setDesc(p => ({ ...p, titulo: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>Origen</label>
              <select style={{ ...inputStyle, appearance: "none" }} value={desc.origen} onChange={e => setDesc(p => ({ ...p, origen: e.target.value }))}>
                {["Auditoría interna","Auditoría externa","Reclamación de cliente","Revisión por dirección","Autodetección"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>Descripción detallada</label>
              <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} placeholder="Describe los hechos observados..." value={desc.descripcion} onChange={e => setDesc(p => ({ ...p, descripcion: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>Evidencia (referencia de archivo)</label>
              <input style={inputStyle} placeholder="ej. F-MEJ-NC-001_evidencia.pdf" value={desc.evidencia} onChange={e => setDesc(p => ({ ...p, evidencia: e.target.value }))} />
            </div>
          </div>
        )}

        {/* Step 1 — Ishikawa */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: 14, padding: "10px 14px", background: "#FFF8E1", borderRadius: 8, border: "1px solid #FFE082" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#F57F17", fontFamily: H }}>Diagrama de Ishikawa (Causa-Raíz)</div>
              <div style={{ fontSize: 11, color: "#BF8F00", fontFamily: B }}>Identifica las causas en cada categoría</div>
            </div>
            {ISHIKAWA_RAMAS.map(r => (
              <div key={r.rama} style={{ marginBottom: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: COLORS.gray, marginBottom: 4, fontFamily: H }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.red }} />
                  {r.rama}
                </label>
                <input style={inputStyle} placeholder={r.placeholder} value={ishikawa[r.rama]} onChange={e => setIshikawa(p => ({ ...p, [r.rama]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}

        {/* Step 2 — Plan */}
        {step === 2 && (
          <div>
            {[
              { label: "Acción correctiva *", key: "accion",        placeholder: "Describe la acción a implementar" },
              { label: "Responsable",         key: "responsable",   placeholder: "Cargo o nombre del responsable"   },
              { label: "Plazo de ejecución",  key: "plazo",         placeholder: "ej. 2026-04-30"                   },
              { label: "Método de verificación", key: "verificacion", placeholder: "¿Cómo se verificará la eficacia?" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>{f.label}</label>
                <input style={inputStyle} placeholder={f.placeholder} value={plan[f.key]} onChange={e => setPlan(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}

        {/* Nav */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} style={{ padding: "9px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>← Anterior</button>
          ) : <div />}
          {step < STEPS.length - 1 ? (
            <BtnPrimary onClick={() => setStep(s => s + 1)} disabled={step === 0 && !desc.titulo.trim()}>Siguiente →</BtnPrimary>
          ) : (
            <BtnPrimary onClick={onClose} disabled={!plan.accion.trim()}>
              <Icon name="check" size={14} color="#fff" /> Registrar NC
            </BtnPrimary>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NcGestion() {
  const [ncs, setNcs] = useState(NCS_INIT);
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      {showForm && <NcForm onClose={() => setShowForm(false)} />}

      <PageHeader
        title="Gestión de No Conformidades"
        subtitle="Registro, análisis de causa raíz y plan de acción"
        action={<BtnPrimary onClick={() => setShowForm(true)}><Icon name="plus" size={14} color="#fff" /> Nueva NC</BtnPrimary>}
      />

      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {Object.entries(ESTADO_CFG).map(([estado, cfg]) => {
          const count = ncs.filter(n => n.estado === estado).length;
          return (
            <Card key={estado} style={{ flex: 1, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: cfg.color, fontFamily: H }}>{count}</div>
              <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{estado}</div>
            </Card>
          );
        })}
      </div>

      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F9F9F9" }}>
              {["ID","Descripción","Origen","Responsable","Fecha","Estado"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `2px solid ${COLORS.border}`, fontFamily: H, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ncs.map((nc, i) => {
              const ecfg = ESTADO_CFG[nc.estado] ?? ESTADO_CFG.Abierta;
              return (
                <tr key={nc.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FCFCFC" }}>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 11, color: COLORS.red, fontWeight: 800 }}>{nc.id}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: COLORS.gray, fontFamily: H, maxWidth: 280 }}>{nc.titulo}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>{nc.origen}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>{nc.responsable}</td>
                  <td style={{ padding: "12px 16px", fontSize: 11, fontFamily: "monospace", color: COLORS.grayLight }}>{nc.fecha}</td>
                  <td style={{ padding: "12px 16px" }}><Badge label={nc.estado} bg={ecfg.bg} color={ecfg.color} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
