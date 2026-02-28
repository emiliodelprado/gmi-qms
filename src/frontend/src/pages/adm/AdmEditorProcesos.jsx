import { useState } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, Badge } from "../../constants.jsx";

const INIT_PROCESOS = {
  Estratégicos: [
    { id: "PR-ES01", nombre: "Planificación Estratégica",          gms: true,  gmp: true  },
    { id: "PR-ES02", nombre: "Seguimiento de Objetivos",            gms: true,  gmp: true  },
    { id: "PR-ES03", nombre: "Gestión de Riesgos y Oportunidades",  gms: true,  gmp: true  },
  ],
  Operativos: [
    { id: "PR-OPE01", nombre: "Captación y Selección de Clientes",     gms: true,  gmp: false },
    { id: "PR-OPE02", nombre: "Gestión de Proyectos Interim",          gms: true,  gmp: true  },
    { id: "PR-OPE03", nombre: "Elaboración y Control de Ofertas",      gms: true,  gmp: false },
    { id: "PR-OPE04", nombre: "Prestación de Servicios Tecnológicos",  gms: true,  gmp: false },
  ],
  Soporte: [
    { id: "PR-SOP01", nombre: "Gestión de RRHH y Competencia",          gms: true, gmp: true },
    { id: "PR-SOP05", nombre: "Gestión de Proveedores",                 gms: true, gmp: true },
    { id: "PR-SOP06", nombre: "Gestión de Infraestructura y Equipos",   gms: true, gmp: true },
    { id: "PR-SOP07", nombre: "Gestión de Información Documentada",     gms: true, gmp: true },
  ],
};

const CAT_CFG = {
  Estratégicos: { bg: "#F5E6E6", color: COLORS.red    },
  Operativos:   { bg: "#E3F2FD", color: "#1565C0"     },
  Soporte:      { bg: "#F0F4F0", color: "#2E7D32"     },
};

const ENTITIES = ["gms", "gmp"];
const ENTITY_LABELS = { gms: "GMS", gmp: "GMP" };

export default function AdmEditorProcesos() {
  const [data, setData] = useState(INIT_PROCESOS);

  const toggle = (cat, id, entity) => {
    setData(prev => ({
      ...prev,
      [cat]: prev[cat].map(p => p.id === id ? { ...p, [entity]: !p[entity] } : p),
    }));
  };

  const Check = ({ value, onClick }) => (
    <button onClick={onClick} style={{
      width: 28, height: 28, borderRadius: 6,
      background: value ? "#E8F5E9" : "#F5F5F5",
      border: `1px solid ${value ? "#2E7D32" : COLORS.border}`,
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {value && <Icon name="check" size={14} color="#2E7D32" />}
    </button>
  );

  return (
    <div>
      <PageHeader title="Editor de Procesos" subtitle="Matriz de asignación de procesos por Entidad Legal" />
      {Object.entries(data).map(([cat, procs]) => {
        const cfg = CAT_CFG[cat];
        return (
          <Card key={cat} style={{ marginBottom: 16, overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", background: cfg.bg, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 10 }}>
              <Badge label={cat} bg={cfg.bg} color={cfg.color} />
              <span style={{ fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>{procs.length} procesos</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFAFA" }}>
                  <th style={{ padding: "9px 18px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `1px solid ${COLORS.border}`, fontFamily: H }}>Código</th>
                  <th style={{ padding: "9px 18px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `1px solid ${COLORS.border}`, fontFamily: H }}>Nombre del Proceso</th>
                  {ENTITIES.map(e => (
                    <th key={e} style={{ padding: "9px 18px", textAlign: "center", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `1px solid ${COLORS.border}`, fontFamily: H }}>{ENTITY_LABELS[e]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {procs.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FCFCFC" }}>
                    <td style={{ padding: "10px 18px", fontSize: 11, color: COLORS.grayLight, fontFamily: "monospace" }}>{p.id}</td>
                    <td style={{ padding: "10px 18px", fontSize: 13, color: COLORS.gray, fontFamily: B }}>{p.nombre}</td>
                    {ENTITIES.map(e => (
                      <td key={e} style={{ padding: "10px 18px", textAlign: "center" }}>
                        <Check value={p[e]} onClick={() => toggle(cat, p.id, e)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        );
      })}
    </div>
  );
}
