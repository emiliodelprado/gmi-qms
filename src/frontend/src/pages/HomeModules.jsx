import { useNavigate } from "react-router-dom";
import { COLORS, H, B, Icon } from "../constants.jsx";

const MODULES = [
  {
    id: "est", code: "EST", label: "Estrategia", icon: "strategy",
    desc: "Gestión del contexto y liderazgo",
    path: "/est/dash/v-exe",
    color: COLORS.red,
    kpis: [
      { label: "Objetivos cumplidos", value: "68%"  },
      { label: "Riesgos estratégicos", value: "3"   },
    ],
  },
  {
    id: "rsg", code: "RSG", label: "Riesgos", icon: "risk",
    desc: "Evaluación y tratamiento de riesgos ISO 9001/27001",
    path: "/rsg/evar/v-calc",
    color: "#E65100",
    kpis: [
      { label: "Riesgos críticos activos", value: "2"   },
      { label: "Nivel de mitigación",      value: "74%" },
    ],
  },
  {
    id: "ope", code: "OPE", label: "Operaciones", icon: "operations",
    desc: "Control comercial y ejecución de proyectos",
    path: "/ope/com/v-oft",
    color: "#1565C0",
    kpis: [
      { label: "Ventas acumuladas año", value: "€2.4M" },
      { label: "Proyectos activos",     value: "12"    },
    ],
  },
  {
    id: "tal", code: "TAL", label: "Talento", icon: "talent",
    desc: "Ciclo de vida del colaborador y formación",
    path: "/tal/emp/v-perf",
    color: "#6A1B9A",
    kpis: [
      { label: "Plan de formación ejecutado", value: "55%" },
      { label: "Colaboradores activos",       value: "47"  },
    ],
  },
  {
    id: "sop", code: "SOP", label: "Soporte", icon: "support",
    desc: "Documentación, proveedores y recursos",
    path: "/sop/doc/v-maes",
    color: "#2E7D32",
    kpis: [
      { label: "Documentos vigentes",      value: "34"  },
      { label: "Proveedores homologados",  value: "83%" },
    ],
  },
  {
    id: "mej", code: "MEJ", label: "Mejora", icon: "improve",
    desc: "No conformidades y auditorías",
    path: "/mej/nc/v-nc",
    color: "#00695C",
    kpis: [
      { label: "NC abiertas",                value: "5"       },
      { label: "Tiempo medio de resolución", value: "8 días"  },
    ],
  },
  {
    id: "adm", code: "ADM", label: "Administración", icon: "lock",
    desc: "Configuración y gobernanza del sistema",
    path: "/adm/org/v-estr",
    color: "#424242",
    kpis: [
      { label: "Usuarios activos hoy", value: "12"     },
      { label: "Estado SSO",           value: "Activo" },
    ],
  },
];

export default function HomeModules() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: COLORS.gray, fontFamily: H, margin: 0 }}>
          Centro de Mando
        </h1>
        <p style={{ color: COLORS.grayLight, marginTop: 6, fontSize: 13, fontFamily: B }}>
          Quality Management System · Global Manager Iberia
        </p>
      </div>

      {/* Module grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
        {MODULES.map(mod => (
          <button
            key={mod.id}
            onClick={() => navigate(mod.path)}
            style={{
              background: COLORS.white, border: `1px solid ${COLORS.border}`,
              borderRadius: 12, padding: 0, cursor: "pointer", textAlign: "left",
              transition: "box-shadow 0.15s, transform 0.15s",
              overflow: "hidden",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.10)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "none";
            }}
          >
            {/* Color bar */}
            <div style={{ height: 4, background: mod.color }} />

            <div style={{ padding: "18px 20px 20px" }}>
              {/* Icon + code + label */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: mod.color + "15",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon name={mod.icon} size={18} color={mod.color} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.gray, fontFamily: H, lineHeight: 1.2 }}>
                    {mod.label}
                  </div>
                  <div style={{ fontSize: 9, color: mod.color, fontFamily: "monospace", fontWeight: 800, letterSpacing: "0.1em" }}>
                    {mod.code}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: 12, color: COLORS.grayLight, fontFamily: B, margin: "0 0 16px", lineHeight: 1.5 }}>
                {mod.desc}
              </p>

              {/* KPIs */}
              <div style={{ display: "flex", gap: 8 }}>
                {mod.kpis.map(kpi => (
                  <div key={kpi.label} style={{
                    flex: 1, background: COLORS.bg, borderRadius: 8, padding: "10px 12px",
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: mod.color, fontFamily: H, lineHeight: 1 }}>
                      {kpi.value}
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: B, marginTop: 3, lineHeight: 1.3 }}>
                      {kpi.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
