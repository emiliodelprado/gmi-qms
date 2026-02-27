import { COLORS, H, B, Card, PageHeader, Badge } from "../../constants.jsx";

const OBJETIVOS = [
  { codigo: "OBJ-EST-01", objetivo: "Incrementar satisfacción de cliente",    responsable: "Dir. Comercial",   meta: "≥ 85% NPS",  actual: "87%",  pct: 87 },
  { codigo: "OBJ-EST-02", objetivo: "Alcanzar facturación anual objetivo",    responsable: "Dir. General",     meta: "8M€",        actual: "4.2M€", pct: 52 },
  { codigo: "OBJ-EST-03", objetivo: "Formación mínima por colaborador",       responsable: "Dir. RRHH",        meta: "40 h/año",   actual: "38 h",  pct: 95 },
  { codigo: "OBJ-EST-04", objetivo: "Tasa de cierre de No Conformidades",     responsable: "Resp. Calidad",    meta: "≥ 90%",      actual: "72%",   pct: 72 },
  { codigo: "OBJ-EST-05", objetivo: "Reducir tiempo de respuesta a clientes", responsable: "Dir. Operaciones", meta: "< 24h",      actual: "18h",   pct: 90 },
  { codigo: "OBJ-EST-06", objetivo: "Ampliar cartera de proyectos activos",  responsable: "Dir. Proyectos",   meta: "15 proyectos", actual: "9",   pct: 60 },
];

function ProgressBar({ pct }) {
  const color = pct >= 80 ? "#43A047" : pct >= 40 ? "#FFB300" : "#E53935";
  const label = pct >= 80 ? "En objetivo" : pct >= 40 ? "En seguimiento" : "En riesgo";
  const badgeBg = pct >= 80 ? "#E8F5E9" : pct >= 40 ? "#FFF8E1" : "#FFEBEE";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 220 }}>
      <div style={{ flex: 1, height: 7, background: "#EBEBEB", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 800, color, fontFamily: H, minWidth: 35 }}>{pct}%</span>
      <Badge label={label} bg={badgeBg} color={color} />
    </div>
  );
}

export default function DashObjetivos() {
  const total   = OBJETIVOS.length;
  const enObj   = OBJETIVOS.filter(o => o.pct >= 80).length;
  const enSeg   = OBJETIVOS.filter(o => o.pct >= 40 && o.pct < 80).length;
  const enRiesg = OBJETIVOS.filter(o => o.pct < 40).length;

  return (
    <div>
      <PageHeader
        title="Estado de Objetivos"
        subtitle="Seguimiento de objetivos anuales según R-ES02-01"
      />

      {/* Summary row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total objetivos", value: total,   color: COLORS.gray,  bg: "#F0F0F0" },
          { label: "En objetivo",     value: enObj,   color: "#43A047",    bg: "#E8F5E9" },
          { label: "En seguimiento",  value: enSeg,   color: "#FFB300",    bg: "#FFF8E1" },
          { label: "En riesgo",       value: enRiesg, color: "#E53935",    bg: "#FFEBEE" },
        ].map(s => (
          <Card key={s.label} style={{ flex: 1, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: s.color, fontFamily: H }}>{s.value}</div>
            <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F9F9F9" }}>
              {["Código", "Objetivo", "Responsable", "Meta", "Actual", "Progreso"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `2px solid ${COLORS.border}`, fontFamily: H, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OBJETIVOS.map((obj, i) => (
              <tr key={obj.codigo} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FCFCFC" }}>
                <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 11, color: COLORS.red, fontWeight: 700 }}>{obj.codigo}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: COLORS.gray, fontFamily: H, fontWeight: 600 }}>{obj.objetivo}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>{obj.responsable}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.gray, fontFamily: "monospace", fontWeight: 600 }}>{obj.meta}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: COLORS.gray, fontFamily: H, fontWeight: 700 }}>{obj.actual}</td>
                <td style={{ padding: "12px 16px" }}>
                  <ProgressBar pct={obj.pct} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
