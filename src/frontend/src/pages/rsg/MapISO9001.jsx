import { useState } from "react";
import { COLORS, H, B, Card, PageHeader, Badge } from "../../constants.jsx";

const RIESGOS = [
  { id: "RSG-001", nombre: "Incumplimiento de plazos en proyectos Interim",         proceso: "PR-OPE02", prob: 3, imp: 4, residual: 3 },
  { id: "RSG-002", nombre: "Insatisfacción del cliente por calidad de entregables", proceso: "PR-OPE01", prob: 2, imp: 4, residual: 2 },
  { id: "RSG-003", nombre: "Alta rotación de partners y colaboradores clave",        proceso: "PR-SOP01", prob: 3, imp: 3, residual: 3 },
  { id: "RSG-004", nombre: "Pérdida de certificación ISO 9001",                     proceso: "PR-ES01",  prob: 1, imp: 4, residual: 1 },
  { id: "RSG-005", nombre: "Procedimientos no documentados o desactualizados",      proceso: "PR-SOP07", prob: 2, imp: 3, residual: 2 },
  { id: "RSG-006", nombre: "Fallo en comunicación interna entre equipos",           proceso: "PR-SOP01", prob: 3, imp: 2, residual: 3 },
  { id: "RSG-007", nombre: "Desviación en objetivos estratégicos anuales",          proceso: "PR-ES02",  prob: 2, imp: 3, residual: 2 },
  { id: "RSG-008", nombre: "Proveedor crítico no homologado activo",                proceso: "PR-SOP05", prob: 1, imp: 2, residual: 1 },
];

// Score = prob × imp
const score     = r => r.prob * r.imp;
const scoreRes  = r => r.residual * r.imp;

const ZONE = s => s >= 12 ? "critico" : s >= 8 ? "alto" : s >= 4 ? "medio" : "bajo";

const ZONE_CFG = {
  critico: { label: "Crítico", bg: "#C62828", light: "#FFEBEE", color: "#C62828" },
  alto:    { label: "Alto",    bg: "#E65100", light: "#FFF3E0", color: "#E65100" },
  medio:   { label: "Medio",   bg: "#F57F17", light: "#FFF8E1", color: "#F57F17" },
  bajo:    { label: "Bajo",    bg: "#2E7D32", light: "#E8F5E9", color: "#2E7D32" },
};

// Cell background based on prob × imp zone
function cellBg(prob, imp) {
  const s = prob * imp;
  const opacity = 0.18 + (s / 16) * 0.45;
  const z = ZONE(s);
  const colors = { critico: `rgba(198,40,40,${opacity})`, alto: `rgba(230,81,0,${opacity})`, medio: `rgba(245,127,23,${opacity})`, bajo: `rgba(46,125,50,${opacity})` };
  return colors[z];
}

function Heatmap({ riesgos }) {
  const [hover, setHover] = useState(null);

  // Group risks by cell
  const byCell = {};
  riesgos.forEach(r => {
    const key = `${r.prob}-${r.imp}`;
    if (!byCell[key]) byCell[key] = [];
    byCell[key].push(r);
  });

  const probs = [4, 3, 2, 1];
  const imps  = [1, 2, 3, 4];
  const CELL  = 90;

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      <div>
        {/* Y-axis label */}
        <div style={{ display: "flex", gap: 0 }}>
          <div style={{ width: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: COLORS.grayLight, fontFamily: H, textTransform: "uppercase", letterSpacing: "0.08em", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>Probabilidad</span>
          </div>
          <div>
            {/* Grid */}
            {probs.map(p => (
              <div key={p} style={{ display: "flex", alignItems: "center" }}>
                <span style={{ width: 22, fontSize: 10, color: COLORS.grayLight, fontFamily: H, fontWeight: 700, textAlign: "right", marginRight: 6 }}>{p}</span>
                {imps.map(i => {
                  const key = `${p}-${i}`;
                  const risks = byCell[key] || [];
                  return (
                    <div key={i} style={{
                      width: CELL, height: CELL, background: cellBg(p, i),
                      border: `1px solid rgba(0,0,0,0.06)`,
                      display: "flex", flexWrap: "wrap", alignContent: "center", justifyContent: "center",
                      gap: 4, padding: 4, position: "relative", cursor: risks.length ? "pointer" : "default",
                    }}>
                      {risks.map(r => {
                        const z = ZONE(score(r));
                        const zr = ZONE(scoreRes(r));
                        return (
                          <div key={r.id}
                            onMouseEnter={() => setHover(r.id)}
                            onMouseLeave={() => setHover(null)}
                            style={{
                              background: ZONE_CFG[z].bg, color: "#fff",
                              fontSize: 8, fontWeight: 800, fontFamily: H,
                              padding: "2px 5px", borderRadius: 4, whiteSpace: "nowrap",
                              opacity: hover && hover !== r.id ? 0.4 : 1,
                              outline: hover === r.id ? "2px solid #fff" : "none",
                            }}>
                            {r.id}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
            {/* X-axis */}
            <div style={{ display: "flex", marginLeft: 28 }}>
              {imps.map(i => (
                <div key={i} style={{ width: CELL, textAlign: "center", fontSize: 10, color: COLORS.grayLight, fontFamily: H, fontWeight: 700, paddingTop: 6 }}>{i}</div>
              ))}
            </div>
            <div style={{ marginLeft: 28, textAlign: "center", width: CELL * 4, fontSize: 9, fontWeight: 800, color: COLORS.grayLight, fontFamily: H, textTransform: "uppercase", letterSpacing: "0.08em", paddingTop: 2 }}>Impacto</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 4 }}>Severidad</div>
        {Object.entries(ZONE_CFG).map(([k, cfg]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: cfg.bg }} />
            <span style={{ fontSize: 11, color: COLORS.gray, fontFamily: B }}>{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MapISO9001() {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <PageHeader title="Mapa ISO 9001" subtitle="Heatmap consolidado de riesgos de gestión y calidad — severidad residual" />

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, alignItems: "start" }}>
        <Card style={{ padding: 20, display: "inline-block" }}>
          <Heatmap riesgos={RIESGOS} />
        </Card>

        {/* KPI strip */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.entries(ZONE_CFG).map(([key, cfg]) => {
            const count = RIESGOS.filter(r => ZONE(score(r)) === key).length;
            return (
              <Card key={key} style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 14, borderLeft: `4px solid ${cfg.bg}` }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color, fontFamily: H }}>{count}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{cfg.label}</div>
                  <div style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: B }}>riesgo{count !== 1 ? "s" : ""} identificado{count !== 1 ? "s" : ""}</div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Risk table */}
      <Card style={{ marginTop: 20, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFAFA" }}>
              {["ID", "Riesgo", "Proceso", "P", "I", "Severidad", "Residual"].map(h => (
                <th key={h} style={{ padding: "9px 16px", textAlign: h === "P" || h === "I" ? "center" : "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `2px solid ${COLORS.border}`, fontFamily: H, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RIESGOS.map((r, i) => {
              const z  = ZONE(score(r));
              const zr = ZONE(scoreRes(r));
              return (
                <tr key={r.id}
                  onClick={() => setSelected(selected === r.id ? null : r.id)}
                  style={{ borderBottom: `1px solid ${COLORS.border}`, background: selected === r.id ? ZONE_CFG[z].light : i % 2 === 0 ? COLORS.white : "#FCFCFC", cursor: "pointer" }}>
                  <td style={{ padding: "9px 16px", fontSize: 11, color: COLORS.grayLight, fontFamily: "monospace" }}>{r.id}</td>
                  <td style={{ padding: "9px 16px", fontSize: 13, color: COLORS.gray, fontFamily: B }}>{r.nombre}</td>
                  <td style={{ padding: "9px 16px", fontSize: 11, color: COLORS.grayLight, fontFamily: "monospace" }}>{r.proceso}</td>
                  <td style={{ padding: "9px 16px", textAlign: "center", fontSize: 13, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{r.prob}</td>
                  <td style={{ padding: "9px 16px", textAlign: "center", fontSize: 13, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{r.imp}</td>
                  <td style={{ padding: "9px 16px" }}><Badge label={`${ZONE_CFG[z].label} (${score(r)})`} bg={ZONE_CFG[z].light} color={ZONE_CFG[z].color} /></td>
                  <td style={{ padding: "9px 16px" }}><Badge label={`${ZONE_CFG[zr].label} (${scoreRes(r)})`} bg={ZONE_CFG[zr].light} color={ZONE_CFG[zr].color} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
