import { COLORS, H, B, Card, PageHeader, Badge } from "../../constants.jsx";

const PROJECTS = [
  {
    nombre: "Transformación Digital · TechCorp SL",
    tipo: "tech",
    hitos: [
      { label: "Kick-off y análisis inicial",         fecha: "2026-01-10", estado: "completado" },
      { label: "Entrega documento de arquitectura",   fecha: "2026-01-28", estado: "completado" },
      { label: "Prototipo funcional (MVP)",           fecha: "2026-02-20", estado: "en_curso"   },
      { label: "Pruebas de aceptación (UAT)",         fecha: "2026-03-15", estado: "pendiente"  },
      { label: "Go-live y formación de usuarios",     fecha: "2026-04-01", estado: "pendiente"  },
    ],
  },
  {
    nombre: "Dirección Financiera Interina · Industrias Beta SA",
    tipo: "interim",
    hitos: [
      { label: "Incorporación y onboarding",          fecha: "2026-01-15", estado: "completado" },
      { label: "Diagnóstico financiero completo",     fecha: "2026-02-05", estado: "completado" },
      { label: "Propuesta de restructuración deuda",  fecha: "2026-02-25", estado: "completado" },
      { label: "Implementación nuevos procedimientos",fecha: "2026-03-20", estado: "en_curso"   },
      { label: "Cierre de mandato y traspaso",        fecha: "2026-05-30", estado: "pendiente"  },
    ],
  },
  {
    nombre: "Implantación ERP Financiero · FinanzAlpha Group",
    tipo: "tech",
    hitos: [
      { label: "Análisis de requerimientos",          fecha: "2026-02-15", estado: "completado" },
      { label: "Configuración módulos core",          fecha: "2026-03-10", estado: "en_curso"   },
      { label: "Migración de datos históricos",       fecha: "2026-04-05", estado: "pendiente"  },
      { label: "Formación equipo finance",            fecha: "2026-04-20", estado: "pendiente"  },
      { label: "Cierre contable en nuevo sistema",    fecha: "2026-05-15", estado: "pendiente"  },
    ],
  },
];

const ESTADO_CFG = {
  completado: { color: "#43A047", bg: "#E8F5E9", label: "Completado" },
  en_curso:   { color: "#1565C0", bg: "#E3F2FD", label: "En curso"   },
  pendiente:  { color: "#757575", bg: "#F5F5F5", label: "Pendiente"  },
};

const TIPO_CFG = {
  tech:    { emoji: "⚡", label: "Liquid / Tech",       color: "#1565C0", bg: "#E3F2FD" },
  interim: { emoji: "💼", label: "Interim Management",  color: "#6A1B9A", bg: "#F3E5F5" },
};

function Timeline({ hitos }) {
  return (
    <div style={{ position: "relative", paddingLeft: 24 }}>
      {/* Vertical line */}
      <div style={{ position: "absolute", left: 8, top: 8, bottom: 8, width: 2, background: COLORS.border }} />
      {hitos.map((hito, i) => {
        const cfg = ESTADO_CFG[hito.estado];
        return (
          <div key={i} style={{ position: "relative", marginBottom: i < hitos.length - 1 ? 16 : 0, display: "flex", alignItems: "flex-start", gap: 12 }}>
            {/* Dot */}
            <div style={{ position: "absolute", left: -20, width: 16, height: 16, borderRadius: "50%", background: cfg.color, border: `2px solid ${COLORS.white}`, boxShadow: `0 0 0 2px ${cfg.color}` }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray, fontFamily: H }}>{hito.label}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginLeft: 12 }}>
                  <span style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: "monospace" }}>{hito.fecha}</span>
                  <Badge label={cfg.label} bg={cfg.bg} color={cfg.color} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PrjEntregables() {
  const totalHitos     = PROJECTS.flatMap(p => p.hitos).length;
  const completados    = PROJECTS.flatMap(p => p.hitos).filter(h => h.estado === "completado").length;
  const enCurso        = PROJECTS.flatMap(p => p.hitos).filter(h => h.estado === "en_curso").length;

  return (
    <div>
      <PageHeader
        title="Seguimiento de Entregables"
        subtitle="Estado de hitos y entregables por proyecto activo"
      />

      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Proyectos activos", value: PROJECTS.length, color: COLORS.gray,   bg: "#F0F0F0" },
          { label: "Hitos completados", value: completados,     color: "#43A047",      bg: "#E8F5E9" },
          { label: "En curso",          value: enCurso,         color: "#1565C0",      bg: "#E3F2FD" },
          { label: "Pendientes",        value: totalHitos - completados - enCurso, color: "#757575", bg: "#F5F5F5" },
        ].map(s => (
          <Card key={s.label} style={{ flex: 1, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: s.color, fontFamily: H }}>{s.value}</div>
            <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Projects */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {PROJECTS.map((proj, i) => {
          const tcfg = TIPO_CFG[proj.tipo];
          const pct  = Math.round((proj.hitos.filter(h => h.estado === "completado").length / proj.hitos.length) * 100);
          return (
            <Card key={i} style={{ padding: 0, overflow: "hidden" }}>
              {/* Project header */}
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12, background: "#FAFAFA" }}>
                <span style={{ fontSize: 18 }}>{tcfg.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{proj.nombre}</div>
                  <Badge label={tcfg.label} bg={tcfg.bg} color={tcfg.color} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, marginBottom: 4 }}>{pct}% completado</div>
                  <div style={{ width: 120, height: 6, background: COLORS.border, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#43A047" : COLORS.red, borderRadius: 3 }} />
                  </div>
                </div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <Timeline hitos={proj.hitos} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
