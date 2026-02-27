import { useState } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, BtnPrimary, inputStyle } from "../../constants.jsx";

const HEAT_COLORS = [
  ["#C8E6C9","#FFF9C4","#FFE0B2","#FFCCBC"],
  ["#FFF9C4","#FFE0B2","#FFCCBC","#FFCDD2"],
  ["#FFE0B2","#FFCCBC","#FFCDD2","#EF9A9A"],
  ["#FFCCBC","#FFCDD2","#EF9A9A","#EF5350"],
];
const HEAT_TEXT = [
  ["#2E7D32","#827717","#E65100","#BF360C"],
  ["#827717","#E65100","#BF360C","#B71C1C"],
  ["#E65100","#BF360C","#B71C1C","#B71C1C"],
  ["#BF360C","#B71C1C","#B71C1C","#B71C1C"],
];
const HEAT_LABEL = [
  ["Bajo","Bajo","Medio","Medio"],
  ["Bajo","Medio","Medio","Alto"],
  ["Medio","Medio","Alto","Crítico"],
  ["Medio","Alto","Crítico","Crítico"],
];

const NIVEL_CONFIG = {
  Bajo:    { bg: "#E8F5E9", color: "#2E7D32", icon: "check"   },
  Medio:   { bg: "#FFF8E1", color: "#F57F17", icon: "warning" },
  Alto:    { bg: "#FBE9E7", color: "#E64A19", icon: "warning" },
  Crítico: { bg: "#FFEBEE", color: "#B71C1C", icon: "risk"    },
};

const STEPS = ["Identificación", "Evaluación", "Resultado"];

export default function EvalCalculadora() {
  const [step, setStep]  = useState(0);
  const [prob, setProb]  = useState(2);
  const [imp,  setImp]   = useState(2);
  const [form, setForm]  = useState({ nombre: "", descripcion: "", tipo: "Operacional" });

  const puntuacion = prob * imp;
  const nivel = puntuacion >= 12 ? "Crítico" : puntuacion >= 8 ? "Alto" : puntuacion >= 4 ? "Medio" : "Bajo";
  const nCfg  = NIVEL_CONFIG[nivel];

  const SliderRow = ({ label, value, set }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 800, color: COLORS.grayLight, fontFamily: H, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</label>
        <span style={{ fontSize: 18, fontWeight: 800, color: COLORS.red, fontFamily: H }}>{value}</span>
      </div>
      <input type="range" min={1} max={4} value={value} onChange={e => set(Number(e.target.value))}
        style={{ width: "100%", accentColor: COLORS.red, cursor: "pointer" }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {[1,2,3,4].map(v => (
          <span key={v} style={{ fontSize: 10, color: v === value ? COLORS.red : COLORS.grayLight, fontFamily: H, fontWeight: v === value ? 800 : 400 }}>
            {v === 1 ? "Muy baja" : v === 2 ? "Baja" : v === 3 ? "Alta" : "Muy alta"}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Calculadora de Riesgos" subtitle="Evaluación según IT-ES03-01 — Metodología de Evaluación de Riesgos" />

      {/* Steps */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: i <= step ? "pointer" : "default" }} onClick={() => i <= step && setStep(i)}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: i < step ? COLORS.red : i === step ? COLORS.red : COLORS.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: i <= step ? "#fff" : COLORS.grayLight, fontFamily: H }}>
                {i < step ? <Icon name="check" size={13} color="#fff" /> : i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: i === step ? 800 : 500, color: i === step ? COLORS.gray : COLORS.grayLight, fontFamily: H }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ width: 40, height: 1, background: i < step ? COLORS.red : COLORS.border, margin: "0 10px" }} />}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: step === 1 ? "1fr 1fr" : "1fr", gap: 16 }}>

        {/* Step 0 — Identificación */}
        {step === 0 && (
          <Card style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>Identificación del riesgo</h3>
            {[
              { label: "Nombre del riesgo *", key: "nombre", placeholder: "ej. Pérdida de cliente clave" },
              { label: "Descripción",         key: "descripcion", placeholder: "Describe el escenario de riesgo..." },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>{f.label}</label>
                <input style={inputStyle} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>Tipo de riesgo</label>
              <select style={{ ...inputStyle, appearance: "none" }} value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                {["Estratégico","Operacional","Financiero","Reputacional","Legal/Regulatorio","Tecnológico"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <BtnPrimary onClick={() => setStep(1)} disabled={!form.nombre.trim()} style={{ marginTop: 8 }}>
              Continuar <Icon name="chevron" size={14} color="#fff" />
            </BtnPrimary>
          </Card>
        )}

        {/* Step 1 — Evaluación */}
        {step === 1 && (
          <>
            <Card style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>Evaluación cuantitativa</h3>
              <SliderRow label="Probabilidad" value={prob} set={setProb} />
              <SliderRow label="Impacto"      value={imp}  set={setImp}  />
              <div style={{ background: COLORS.bg, borderRadius: 8, padding: "12px 16px", marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>Puntuación de riesgo</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.red, fontFamily: H }}>{puntuacion}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => setStep(0)} style={{ padding: "9px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>
                  ← Volver
                </button>
                <BtnPrimary onClick={() => setStep(2)} style={{ flex: 1, justifyContent: "center" }}>
                  Ver resultado <Icon name="chevron" size={14} color="#fff" />
                </BtnPrimary>
              </div>
            </Card>

            {/* Heat map */}
            <Card style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>Mapa de Calor</h3>
              <div style={{ display: "flex", gap: 8 }}>
                {/* Y-axis label */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 0 }}>
                  <span style={{ fontSize: 9, color: COLORS.grayLight, fontFamily: H, textTransform: "uppercase", letterSpacing: "0.08em", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>Probabilidad →</span>
                </div>
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 52px)", gridTemplateRows: "repeat(4, 40px)", gap: 3 }}>
                    {[4,3,2,1].map(p =>
                      [1,2,3,4].map(im => {
                        const active = p === prob && im === imp;
                        return (
                          <div key={`${p}-${im}`}
                            onClick={() => { setProb(p); setImp(im); }}
                            style={{
                              borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
                              background: HEAT_COLORS[4-p][im-1],
                              fontSize: 9, fontWeight: 800, color: HEAT_TEXT[4-p][im-1], fontFamily: H,
                              cursor: "pointer",
                              boxShadow: active ? `0 0 0 2px ${COLORS.gray}` : "none",
                              transform: active ? "scale(1.08)" : "scale(1)",
                              transition: "all 0.15s",
                            }}>
                            {p * im}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 52px)", gap: 3, marginTop: 4 }}>
                    {["1","2","3","4"].map(v => <div key={v} style={{ fontSize: 9, color: COLORS.grayLight, fontFamily: H, textAlign: "center" }}>{v}</div>)}
                  </div>
                  <div style={{ textAlign: "center", fontSize: 9, color: COLORS.grayLight, fontFamily: H, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Impacto →</div>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Step 2 — Resultado */}
        {step === 2 && (
          <Card style={{ padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: "16px 20px", background: nCfg.bg, borderRadius: 10 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${nCfg.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={nCfg.icon} size={24} color={nCfg.color} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: nCfg.color, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H }}>Nivel de riesgo</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: nCfg.color, fontFamily: H }}>{nivel}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>Puntuación</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{puntuacion}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Riesgo",       value: form.nombre },
                { label: "Tipo",         value: form.tipo },
                { label: "Probabilidad", value: `${prob} / 4` },
                { label: "Impacto",      value: `${imp} / 4` },
              ].map(r => (
                <div key={r.label} style={{ padding: "10px 14px", background: COLORS.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H }}>{r.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray, fontFamily: H, marginTop: 3 }}>{r.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setStep(0); setForm({ nombre: "", descripcion: "", tipo: "Operacional" }); setProb(2); setImp(2); }}
                style={{ padding: "9px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>
                Nueva evaluación
              </button>
              <BtnPrimary onClick={() => {}} style={{ flex: 1, justifyContent: "center" }}>
                <Icon name="check" size={14} color="#fff" /> Registrar riesgo
              </BtnPrimary>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
