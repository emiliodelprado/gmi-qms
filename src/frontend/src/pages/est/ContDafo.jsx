import { useState } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, BtnPrimary, inputStyle } from "../../constants.jsx";

const DAFO_DATA = {
  fortalezas: [
    "Equipo directivo con alta experiencia sectorial",
    "Metodología propia de Interim Management consolidada",
    "Cartera de clientes fidelizados en IBEX35",
    "Certificación ISO 9001 activa",
  ],
  debilidades: [
    "Alta dependencia de perfiles senior escasos",
    "Proceso de onboarding no estandarizado",
    "Cobertura geográfica limitada a Península",
    "Sistema de gestión del conocimiento inmaduro",
  ],
  oportunidades: [
    "Creciente demanda de servicios de transformación digital",
    "Expansión a mercado latinoamericano (México/Colombia)",
    "Alianzas estratégicas con big four",
    "Aumento de presupuesto en formación corporativa",
  ],
  amenazas: [
    "Entrada de grandes consultoras en nicho de Interim",
    "Presión salarial en perfiles directivos",
    "Incertidumbre regulatoria en contratación flexible",
    "Digitalización que reduce necesidad de perfiles tradicionales",
  ],
};

const QUAD_CONFIG = {
  fortalezas:   { label: "Fortalezas",   color: "#43A047", bg: "#E8F5E9", interactive: false },
  debilidades:  { label: "Debilidades",  color: "#E53935", bg: "#FFEBEE", interactive: true  },
  oportunidades:{ label: "Oportunidades",color: "#1565C0", bg: "#E3F2FD", interactive: false },
  amenazas:     { label: "Amenazas",     color: "#E65100", bg: "#FFF3E0", interactive: true  },
};

function Modal({ item, quadrant, onClose }) {
  const [accion, setAccion] = useState("");
  const [responsable, setResponsable] = useState("");
  const [plazo, setPlazo] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: COLORS.white, borderRadius: 10, width: 480, padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: QUAD_CONFIG[quadrant].color, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 4 }}>
              Acción de mitigación · {QUAD_CONFIG[quadrant].label}
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: COLORS.gray, fontFamily: H, margin: 0 }}>{item}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Icon name="x" size={18} color={COLORS.grayLight} />
          </button>
        </div>

        {[
          { label: "Acción de mitigación *", value: accion, set: setAccion, placeholder: "Describe la acción a implementar..." },
          { label: "Responsable",            value: responsable, set: setResponsable, placeholder: "Nombre o cargo" },
          { label: "Plazo de ejecución",     value: plazo, set: setPlazo, placeholder: "ej. Q3 2026" },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>{f.label}</label>
            <input style={inputStyle} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} />
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, color: COLORS.grayLight, fontFamily: B }}>
            Cancelar
          </button>
          <BtnPrimary onClick={onClose} disabled={!accion.trim()}>
            <Icon name="check" size={14} color="#fff" /> Vincular acción
          </BtnPrimary>
        </div>
      </div>
    </div>
  );
}

export default function ContDafo() {
  const [modal, setModal] = useState(null); // { item, quadrant }

  return (
    <div>
      {modal && <Modal item={modal.item} quadrant={modal.quadrant} onClose={() => setModal(null)} />}

      <PageHeader
        title="Matriz DAFO / CAME"
        subtitle="Contexto estratégico de la organización — haz clic en Debilidades o Amenazas para vincular acciones"
      />

      {/* DAFO legend */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {Object.entries(QUAD_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", background: cfg.bg, borderRadius: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, fontFamily: H }}>{cfg.label}</span>
            {cfg.interactive && <span style={{ fontSize: 10, color: cfg.color, fontFamily: B }}>(interactivo)</span>}
          </div>
        ))}
      </div>

      {/* 2×2 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {Object.entries(DAFO_DATA).map(([key, items]) => {
          const cfg = QUAD_CONFIG[key];
          return (
            <Card key={key} style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", background: cfg.bg, borderBottom: `1px solid ${cfg.color}30`, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: cfg.color, fontFamily: H }}>{cfg.label}</span>
                {cfg.interactive && (
                  <span style={{ marginLeft: "auto", fontSize: 10, color: cfg.color, fontFamily: B, opacity: 0.7 }}>Clic para añadir acción</span>
                )}
              </div>
              <ul style={{ margin: 0, padding: "12px 18px 14px 30px", display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map((item, i) => (
                  <li key={i}
                    onClick={cfg.interactive ? () => setModal({ item, quadrant: key }) : undefined}
                    style={{
                      fontSize: 13, color: COLORS.gray, fontFamily: B, lineHeight: 1.5,
                      cursor: cfg.interactive ? "pointer" : "default",
                      padding: cfg.interactive ? "4px 6px" : "2px 0",
                      borderRadius: cfg.interactive ? 5 : 0,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => { if (cfg.interactive) e.currentTarget.style.background = `${cfg.color}12`; }}
                    onMouseLeave={e => { if (cfg.interactive) e.currentTarget.style.background = "transparent"; }}>
                    {item}
                    {cfg.interactive && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: cfg.color, fontFamily: H, opacity: 0.6 }}>+ acción</span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
