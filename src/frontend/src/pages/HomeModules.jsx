import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, H, B, Icon } from "../constants.jsx";
import GuidedTour from "../components/GuidedTour.jsx";

const WELCOME_KEY = "qms_welcome_dismissed";
const GUIDE_KEY   = "qms_guide_completed";

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

export default function HomeModules({ user }) {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(() => !sessionStorage.getItem(WELCOME_KEY));
  const [guideCompleted, setGuideCompleted] = useState(() => !!localStorage.getItem(GUIDE_KEY));
  const [showTour, setShowTour] = useState(false);

  const dismissWelcome = () => {
    sessionStorage.setItem(WELCOME_KEY, "1");
    setShowWelcome(false);
  };

  const startTour = () => setShowTour(true);
  const closeTour = () => {
    setShowTour(false);
    localStorage.setItem(GUIDE_KEY, "1");
    setGuideCompleted(true);
  };

  const userName  = user?.name || user?.email || "Usuario";
  const groupName = "Global Manager Iberia";

  return (
    <div>
      {/* Welcome banner */}
      {showWelcome && (
        <div style={{
          position: "relative", marginBottom: 24, padding: "24px 48px 24px 24px",
          background: "linear-gradient(135deg, #A91E22 0%, #7A1518 100%)",
          borderRadius: 12, color: "#fff",
        }}>
          {/* Close button */}
          <button
            onClick={dismissWelcome}
            style={{
              position: "absolute", top: 12, right: 12,
              background: "rgba(255,255,255,0.18)", border: "none",
              borderRadius: "50%", width: 28, height: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff", fontSize: 16, lineHeight: 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.32)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
            title="Ocultar mensaje de bienvenida"
          >
            &times;
          </button>

          <div style={{ fontFamily: H, fontWeight: 800, fontSize: 17, marginBottom: 10, lineHeight: 1.3 }}>
            Hola {userName}, te damos la bienvenida al ecosistema de gestión de {groupName}
          </div>
          <p style={{ fontFamily: B, fontSize: 13, lineHeight: 1.7, margin: 0, opacity: 0.92 }}>
            Una plataforma diseñada para centralizar la excelencia operativa de nuestras marcas.
            Este sistema se fundamenta en el <strong style={{ fontWeight: 800 }}>Ciclo PDCA</strong> (Plan-Do-Check-Act),
            una metodología dinámica que garantiza la mejora continua.
            Aquí, <strong style={{ fontWeight: 800 }}>Planificamos</strong> nuestra estrategia y riesgos, <strong style={{ fontWeight: 800 }}>Hacemos</strong> realidad
            nuestros proyectos con el mejor talento, <strong style={{ fontWeight: 800 }}>Verificamos</strong> nuestro
            desempeño a través de indicadores en tiempo real y <strong style={{ fontWeight: 800 }}>Actuamos</strong> corrigiendo
            desviaciones para evolucionar constantemente.
            Juntos, convertimos la normativa ISO en una ventaja competitiva ágil y segura.
          </p>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: COLORS.gray, fontFamily: H, margin: 0 }}>
            Centro de Mando
          </h1>
          <p style={{ color: COLORS.grayLight, marginTop: 6, fontSize: 13, fontFamily: B, margin: "6px 0 0" }}>
            Quality Management System · Global Manager Iberia
          </p>
        </div>
        <button
          onClick={startTour}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 16px", borderRadius: 6, cursor: "pointer",
            background: guideCompleted ? COLORS.white : COLORS.red,
            border: guideCompleted ? `1px solid ${COLORS.border}` : "none",
            color: guideCompleted ? COLORS.grayLight : "#fff",
            fontFamily: H, fontWeight: 700, fontSize: 12,
            transition: "all 0.15s",
          }}
        >
          <Icon name="guide" size={15} color={guideCompleted ? COLORS.grayLight : "#fff"} />
          {guideCompleted ? "Repetir guía" : "Iniciar guía interactiva"}
        </button>
      </div>

      {/* Guide invitation card (only if never completed) */}
      {!guideCompleted && !showTour && (
        <div style={{
          marginBottom: 20, padding: "16px 20px",
          background: "#FFF8F0", border: "1px solid #FFE0B2", borderRadius: 10,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon name="guide" size={18} color="#E65100" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>
              Primera vez aquí?
            </div>
            <div style={{ fontSize: 12, color: COLORS.grayLight, fontFamily: B, marginTop: 2 }}>
              Descubre cómo funciona la plataforma con una navegación guiada por las principales secciones.
            </div>
          </div>
          <button onClick={startTour} style={{
            padding: "7px 16px", border: "none", borderRadius: 6,
            background: "#E65100", color: "#fff", cursor: "pointer",
            fontFamily: H, fontWeight: 800, fontSize: 12, whiteSpace: "nowrap",
          }}>
            Comenzar
          </button>
        </div>
      )}

      {/* Module grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
        {MODULES.map(mod => (
          <button
            key={mod.id}
            data-tour={`mod-${mod.id}`}
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

      {/* Guided tour overlay */}
      {showTour && <GuidedTour onClose={closeTour} />}
    </div>
  );
}
