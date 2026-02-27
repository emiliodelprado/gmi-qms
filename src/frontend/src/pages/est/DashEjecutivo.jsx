import { useContext } from "react";
import { COLORS, H, B, Icon, Card, PageHeader } from "../../constants.jsx";
import { CompanyContext } from "../../App.jsx";

// ─── Gauge (velocímetro) SVG ──────────────────────────────────────────────────
function Gauge({ value, max, label, unit = "M€" }) {
  const pct   = Math.min(value / max, 1);
  const angle = -135 + pct * 270; // -135° a +135°
  const r = 60;
  const cx = 80, cy = 80;

  // Arc path helper
  const arc = (startDeg, endDeg) => {
    const toRad = d => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  // Needle
  const needleRad = ((angle - 90) * Math.PI) / 180;
  const nx = cx + 48 * Math.cos(needleRad);
  const ny = cy + 48 * Math.sin(needleRad);

  const zones = [
    { start: -135, end: -45, color: "#E53935" },
    { start: -45,  end:  45, color: "#FFB300" },
    { start:  45,  end: 135, color: "#43A047" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={160} height={110} viewBox="0 0 160 110">
        {/* Track */}
        <path d={arc(-135, 135)} fill="none" stroke="#E8E8E8" strokeWidth={12} strokeLinecap="round" />
        {/* Color zones */}
        {zones.map((z, i) => (
          <path key={i} d={arc(z.start, z.end)} fill="none" stroke={z.color} strokeWidth={12} strokeLinecap="round" opacity={0.25} />
        ))}
        {/* Progress arc */}
        <path d={arc(-135, -135 + pct * 270)} fill="none" stroke={pct < 0.33 ? "#E53935" : pct < 0.66 ? "#FFB300" : "#43A047"} strokeWidth={12} strokeLinecap="round" />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={COLORS.gray} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill={COLORS.gray} />
        {/* Value */}
        <text x={cx} y={cy + 22} textAnchor="middle" fontSize={16} fontWeight={800} fontFamily={H} fill={COLORS.gray}>{value}{unit}</text>
        <text x={cx} y={cy + 35} textAnchor="middle" fontSize={9} fontFamily={B} fill={COLORS.grayLight}>{label}</text>
      </svg>
    </div>
  );
}

// ─── Semaphore ────────────────────────────────────────────────────────────────
function Semaphore({ label, status }) {
  const c = status === "green" ? "#43A047" : status === "amber" ? "#FFB300" : "#E53935";
  const label2 = status === "green" ? "En objetivo" : status === "amber" ? "En seguimiento" : "En riesgo";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
      <div style={{ width: 14, height: 14, borderRadius: "50%", background: c, flexShrink: 0, boxShadow: `0 0 6px ${c}88` }} />
      <div style={{ flex: 1, fontSize: 12, color: COLORS.gray, fontFamily: B }}>{label}</div>
      <span style={{ fontSize: 10, fontWeight: 700, color: c, fontFamily: H }}>{label2}</span>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = COLORS.red, icon }) {
  return (
    <Card style={{ padding: "16px 20px", flex: 1, minWidth: 140 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 6, fontFamily: H }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: H }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: "#AAA", marginTop: 2, fontFamily: B }}>{sub}</div>}
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={16} color={color} />
        </div>
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashEjecutivo() {
  const { company, brand } = useContext(CompanyContext);

  const mockData = {
    GMS: { ventasActual: 4.2, ventasMeta: 8, ncAbiertas: 3, cumplimiento: 78, objetivos: [
      { label: "Satisfacción de cliente ≥ 85%", status: "green" },
      { label: "Facturación anual ≥ 8M€",       status: "amber" },
      { label: "Formación interna ≥ 40h/persona",status: "green" },
      { label: "Tasa NC cerradas ≥ 90%",          status: "red"   },
    ]},
    GMP: { ventasActual: 1.8, ventasMeta: 4, ncAbiertas: 1, cumplimiento: 60, objetivos: [
      { label: "Satisfacción de cliente ≥ 85%", status: "amber" },
      { label: "Facturación anual ≥ 4M€",       status: "amber" },
      { label: "Formación interna ≥ 40h/persona",status: "red"   },
      { label: "Tasa NC cerradas ≥ 90%",          status: "green" },
    ]},
  };

  const d = mockData[company] ?? mockData.GMS;

  return (
    <div>
      <PageHeader
        title="Vista Ejecutiva"
        subtitle={`${company} · ${brand} — Cuadro de mando integrado`}
      />

      {/* Bento grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "auto auto", gap: 14 }}>

        {/* Velocímetro ventas — grande */}
        <Card style={{ gridColumn: "1 / 2", gridRow: "1 / 2", padding: "20px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: H, marginBottom: 8, alignSelf: "flex-start" }}>Ventas Anuales Acumuladas</div>
          <Gauge value={d.ventasActual} max={d.ventasMeta} label={`Meta: ${d.ventasMeta}M€`} />
          <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, marginTop: 4 }}>
            {Math.round((d.ventasActual / d.ventasMeta) * 100)}% del objetivo anual
          </div>
        </Card>

        {/* KPIs */}
        <Card style={{ gridColumn: "2 / 3", gridRow: "1 / 2", padding: "20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: H }}>Indicadores Clave</div>
          <div style={{ display: "flex", gap: 10, flex: 1 }}>
            <KpiCard label="NC Abiertas" value={d.ncAbiertas} sub="no conformidades" color={d.ncAbiertas > 3 ? "#E53935" : COLORS.red} icon="warning" />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <KpiCard label="Cumplimiento" value={`${d.cumplimiento}%`} sub="objetivos estratégicos" color={d.cumplimiento >= 75 ? "#43A047" : d.cumplimiento >= 50 ? "#FFB300" : "#E53935"} icon="chart" />
          </div>
        </Card>

        {/* Semáforos objetivos */}
        <Card style={{ gridColumn: "3 / 4", gridRow: "1 / 2", padding: "20px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: H, marginBottom: 12 }}>Objetivos Estratégicos</div>
          {d.objetivos.map((obj, i) => (
            <Semaphore key={i} label={obj.label} status={obj.status} />
          ))}
        </Card>

        {/* Actividad reciente */}
        <Card style={{ gridColumn: "1 / 4", gridRow: "2 / 3", padding: "20px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: H, marginBottom: 14 }}>Actividad Reciente</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { icon: "warning", label: "NC-2026-003 abierta", date: "Hoy", color: COLORS.red },
              { icon: "check",   label: "Auditoría interna completada", date: "Hace 2 días", color: "#43A047" },
              { icon: "edit",    label: "PR-OPE03 actualizado (v2.1)", date: "Hace 3 días", color: "#1565C0" },
              { icon: "talent",  label: "Nuevo colaborador: Ana García", date: "Hace 5 días", color: "#7B1FA2" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: COLORS.bg, borderRadius: 8, padding: "10px 14px", flex: "1 1 200px" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${item.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={item.icon} size={14} color={item.color} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray, fontFamily: H }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: B }}>{item.date}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
