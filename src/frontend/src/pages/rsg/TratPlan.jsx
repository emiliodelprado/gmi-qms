import { useState } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, BtnPrimary, Badge } from "../../constants.jsx";

const COLS = [
  { id: "identificado",  label: "Identificado",                 color: "#1565C0", bg: "#E3F2FD" },
  { id: "tratamiento",   label: "En Tratamiento",                color: "#E65100", bg: "#FBE9E7" },
  { id: "verificacion",  label: "Eficacia Pendiente",            color: "#6A1B9A", bg: "#F3E5F5" },
  { id: "cerrado",       label: "Cerrado",                       color: "#2E7D32", bg: "#E8F5E9" },
];

const INIT_CARDS = [
  { id: 1, titulo: "Pérdida de consultor senior en proyecto crítico", responsable: "Dir. Proyectos", fecha: "2026-03-15", riesgo: "Alto",  col: "identificado"  },
  { id: 2, titulo: "Incumplimiento SLA con cliente IBEX",             responsable: "Dir. Comercial", fecha: "2026-02-28", riesgo: "Crítico", col: "tratamiento" },
  { id: 3, titulo: "Brecha en procedimiento de onboarding",          responsable: "Dir. RRHH",      fecha: "2026-03-31", riesgo: "Medio", col: "tratamiento"   },
  { id: 4, titulo: "Dependencia de proveedor IT único (ERP)",        responsable: "Resp. IT",        fecha: "2026-04-10", riesgo: "Alto",  col: "verificacion"  },
  { id: 5, titulo: "Ausencia de plan de continuidad documentado",    responsable: "Resp. Calidad",  fecha: "2026-01-20", riesgo: "Medio", col: "cerrado"       },
  { id: 6, titulo: "Datos de clientes sin clasificación RGPD",      responsable: "DPO",             fecha: "2025-12-15", riesgo: "Alto",  col: "cerrado"       },
];

const RIESGO_CFG = {
  Crítico: { bg: "#FFEBEE", color: "#B71C1C" },
  Alto:    { bg: "#FBE9E7", color: "#E64A19" },
  Medio:   { bg: "#FFF8E1", color: "#F57F17" },
  Bajo:    { bg: "#E8F5E9", color: "#2E7D32" },
};

function KanbanCard({ card, cards, setCards }) {
  const colIdx   = COLS.findIndex(c => c.id === card.col);
  const canLeft  = colIdx > 0;
  const canRight = colIdx < COLS.length - 1;

  const move = (dir) => {
    const newCol = COLS[colIdx + dir].id;
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, col: newCol } : c));
  };

  const rcfg = RIESGO_CFG[card.riesgo] ?? RIESGO_CFG.Medio;

  return (
    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray, fontFamily: H, marginBottom: 8, lineHeight: 1.4 }}>{card.titulo}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        <Badge label={card.riesgo} bg={rcfg.bg} color={rcfg.color} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: B }}>{card.responsable}</div>
          <div style={{ fontSize: 10, color: "#BBB", fontFamily: "monospace" }}>{card.fecha}</div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => canLeft && move(-1)} disabled={!canLeft}
            style={{ background: canLeft ? COLORS.bg : "#F8F8F8", border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "3px 7px", cursor: canLeft ? "pointer" : "not-allowed", opacity: canLeft ? 1 : 0.3 }}>
            <Icon name="arrowLeft" size={12} color={COLORS.gray} />
          </button>
          <button onClick={() => canRight && move(1)} disabled={!canRight}
            style={{ background: canRight ? COLORS.bg : "#F8F8F8", border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "3px 7px", cursor: canRight ? "pointer" : "not-allowed", opacity: canRight ? 1 : 0.3 }}>
            <Icon name="chevron" size={12} color={COLORS.gray} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TratPlan() {
  const [cards, setCards] = useState(INIT_CARDS);

  return (
    <div>
      <PageHeader
        title="Plan de Acciones"
        subtitle="Tablero Kanban de seguimiento de acciones de mitigación de riesgos"
        action={<BtnPrimary onClick={() => {}}><Icon name="plus" size={14} color="#fff" /> Nueva acción</BtnPrimary>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {COLS.map(col => {
          const colCards = cards.filter(c => c.col === col.id);
          return (
            <div key={col.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: col.color, fontFamily: H, textTransform: "uppercase", letterSpacing: "0.07em" }}>{col.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 800, color: col.color, background: col.bg, borderRadius: 20, padding: "1px 8px", fontFamily: H }}>{colCards.length}</span>
              </div>
              <div style={{ minHeight: 120, background: col.bg + "60", borderRadius: 8, padding: 8 }}>
                {colCards.map(card => (
                  <KanbanCard key={card.id} card={card} cards={cards} setCards={setCards} />
                ))}
                {colCards.length === 0 && (
                  <div style={{ padding: "20px 0", textAlign: "center", color: "#CCC", fontSize: 11, fontFamily: B }}>Sin acciones</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
