import { useState } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, Badge } from "../../constants.jsx";

const TAREAS_INIT = [
  { id: 1, categoria: "Documentación",  titulo: "Firma de contrato y documentación laboral",           descripcion: "Contrato, nómina, alta SS.",                   estado: "completado" },
  { id: 2, categoria: "Documentación",  titulo: "Lectura y firma de la Política de Calidad GMI",       descripcion: "Documento PL-CAL-01.",                         estado: "completado" },
  { id: 3, categoria: "Ética",          titulo: "Aceptación del Código Ético de GMI",                  descripcion: "Documento ET-COD-01 firmado digitalmente.",    estado: "completado" },
  { id: 4, categoria: "IT",             titulo: "Asignación y configuración del equipo informático",   descripcion: "Portátil, periféricos y accesos corporativos.", estado: "en_curso"   },
  { id: 5, categoria: "IT",             titulo: "Alta en herramientas corporativas",                   descripcion: "Email, Teams, CRM, ERP.",                      estado: "en_curso"   },
  { id: 6, categoria: "Formación",      titulo: "Curso de inducción a procesos GMI",                   descripcion: "Plataforma e-learning (3h).",                  estado: "pendiente"  },
  { id: 7, categoria: "Formación",      titulo: "Formación en PRL básica (20h)",                       descripcion: "Prevención de Riesgos Laborales.",             estado: "pendiente"  },
  { id: 8, categoria: "Organización",   titulo: "Presentación al equipo y asignación de mentor",       descripcion: "Reunión de bienvenida con dirección.",         estado: "pendiente"  },
  { id: 9, categoria: "Organización",   titulo: "Reunión inicial con responsable directo",             descripcion: "Objetivos del período de prueba.",             estado: "pendiente"  },
  { id: 10, categoria: "Cierre",        titulo: "Encuesta de experiencia de onboarding",              descripcion: "Cuestionario de satisfacción F-TAL-ONB-01.",   estado: "pendiente"  },
];

const ESTADO_CFG = {
  completado: { color: "#43A047", bg: "#E8F5E9", label: "Completado"  },
  en_curso:   { color: "#1565C0", bg: "#E3F2FD", label: "En curso"    },
  pendiente:  { color: "#757575", bg: "#F5F5F5", label: "Pendiente"   },
};

const CAT_COLORS = {
  Documentación: "#6A1B9A",
  Ética:         "#BF360C",
  IT:            "#0277BD",
  Formación:     "#1B5E20",
  Organización:  "#E65100",
  Cierre:        "#37474F",
};

const SIGUIENTE = { pendiente: "en_curso", en_curso: "completado" };

export default function OnbChecklist() {
  const [tareas, setTareas] = useState(TAREAS_INIT);
  const [colaborador] = useState("Ana García Martínez");

  const completadas = tareas.filter(t => t.estado === "completado").length;
  const pct = Math.round((completadas / tareas.length) * 100);

  const avanzar = (id) => {
    setTareas(prev => prev.map(t => t.id === id && SIGUIENTE[t.estado]
      ? { ...t, estado: SIGUIENTE[t.estado] }
      : t
    ));
  };

  return (
    <div>
      <PageHeader
        title="Checklist de Bienvenida"
        subtitle={`Proceso de incorporación — ${colaborador}`}
      />

      {/* Progress bar global */}
      <Card style={{ padding: "18px 24px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{colaborador}</div>
            <div style={{ fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>Proceso de onboarding activo</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: pct === 100 ? "#43A047" : COLORS.red, fontFamily: H }}>{pct}%</div>
            <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{completadas} de {tareas.length} tareas</div>
          </div>
        </div>
        <div style={{ height: 10, background: COLORS.border, borderRadius: 5, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#43A047" : COLORS.red, borderRadius: 5, transition: "width 0.4s ease" }} />
        </div>
      </Card>

      {/* Tasks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tareas.map((tarea, i) => {
          const cfg     = ESTADO_CFG[tarea.estado];
          const catColor = CAT_COLORS[tarea.categoria] ?? COLORS.gray;
          const done    = tarea.estado === "completado";
          const canNext = !!SIGUIENTE[tarea.estado];

          return (
            <Card key={tarea.id} style={{ padding: "14px 18px", opacity: done ? 0.85 : 1, transition: "opacity 0.2s" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                {/* Checkbox */}
                <button
                  onClick={() => canNext && avanzar(tarea.id)}
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    background: done ? "#43A047" : "transparent",
                    border: `2px solid ${done ? "#43A047" : tarea.estado === "en_curso" ? "#1565C0" : COLORS.border}`,
                    cursor: canNext ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}>
                  {done && <Icon name="check" size={12} color="#fff" />}
                  {tarea.estado === "en_curso" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1565C0" }} />}
                </button>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: done ? 500 : 700, color: done ? COLORS.grayLight : COLORS.gray, fontFamily: H, textDecoration: done ? "line-through" : "none" }}>
                      {i + 1}. {tarea.titulo}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{tarea.descripcion}</div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: catColor, background: `${catColor}18`, padding: "2px 8px", borderRadius: 10, fontFamily: H }}>{tarea.categoria}</span>
                  <Badge label={cfg.label} bg={cfg.bg} color={cfg.color} />
                  {canNext && (
                    <button onClick={() => avanzar(tarea.id)}
                      style={{ padding: "4px 10px", background: COLORS.red, border: "none", borderRadius: 5, cursor: "pointer", fontSize: 10, color: "#fff", fontFamily: H, fontWeight: 700 }}>
                      Avanzar →
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
