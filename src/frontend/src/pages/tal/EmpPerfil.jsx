import { useState } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, Badge } from "../../constants.jsx";

const COLABORADORES = [
  {
    id: 1, nombre: "Carlos Ruiz Morales", email: "c.ruiz@gmiberia.com",
    cargo: "Director de Proyectos", departamento: "Proyectos",
    contrato: "Estructura", inicio: "2022-03-01",
    formacion: [
      { titulo: "PMP – Project Management Professional", entidad: "PMI",         año: 2023, estado: "Vigente"  },
      { titulo: "ISO 9001:2015 Lead Auditor",            entidad: "Bureau Veritas",año: 2022, estado: "Vigente"  },
      { titulo: "MBA Executive",                         entidad: "IE Business",   año: 2020, estado: "Vigente"  },
    ],
  },
  {
    id: 2, nombre: "Laura Sánchez Vega", email: "l.sanchez@gmiberia.com",
    cargo: "Consultora Senior Financiera", departamento: "Operaciones",
    contrato: "Proyecto", inicio: "2023-09-15",
    formacion: [
      { titulo: "CFA – Chartered Financial Analyst",  entidad: "CFA Institute",  año: 2021, estado: "Vigente"  },
      { titulo: "Lean Six Sigma Green Belt",          entidad: "ASQ",            año: 2023, estado: "Vigente"  },
    ],
  },
  {
    id: 3, nombre: "Miguel Torres Blanco", email: "m.torres@gmiberia.com",
    cargo: "Responsable de Calidad", departamento: "Calidad",
    contrato: "Estructura", inicio: "2021-06-01",
    formacion: [
      { titulo: "ISO 9001:2015 Internal Auditor",    entidad: "SGS",            año: 2022, estado: "Vigente"   },
      { titulo: "Responsable de Calidad – UNE",      entidad: "AENOR",          año: 2021, estado: "Vigente"   },
      { titulo: "Prevención de Riesgos (60h)",       entidad: "Fremap",         año: 2020, estado: "Caducado"  },
    ],
  },
];

const CONTRATO_CFG = {
  Estructura: { bg: "#E8F5E9", color: "#2E7D32" },
  Proyecto:   { bg: "#E3F2FD", color: "#1565C0" },
};
const FMC_CFG = {
  Vigente:  { bg: "#E8F5E9", color: "#2E7D32" },
  Caducado: { bg: "#FFEBEE", color: "#C62828" },
};

function getInitials(name) {
  return (name || "U").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function EmpPerfil() {
  const [selected, setSelected] = useState(COLABORADORES[0]);

  return (
    <div>
      <PageHeader title="Ficha Colaborador" subtitle="Datos maestros, contrato y certificaciones de calidad" />

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
        {/* Left: list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {COLABORADORES.map(col => (
            <button key={col.id} onClick={() => setSelected(col)}
              style={{
                width: "100%", textAlign: "left", padding: "12px 14px", border: "none", cursor: "pointer", borderRadius: 8,
                background: selected.id === col.id ? COLORS.red : COLORS.white,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                transition: "background 0.15s",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: selected.id === col.id ? "rgba(255,255,255,0.25)" : COLORS.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0, fontFamily: H }}>
                  {getInitials(col.nombre)}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: selected.id === col.id ? "#fff" : COLORS.gray, fontFamily: H }}>{col.nombre}</div>
                  <div style={{ fontSize: 10, color: selected.id === col.id ? "rgba(255,255,255,0.75)" : COLORS.grayLight, fontFamily: B }}>{col.cargo}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right: detail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Identity card */}
          <Card style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20 }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg,${COLORS.red},${COLORS.redDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: H }}>
                {getInitials(selected.nombre)}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{selected.nombre}</div>
                <div style={{ fontSize: 13, color: COLORS.grayLight, fontFamily: B, marginTop: 2 }}>{selected.cargo}</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <Badge label={selected.contrato} bg={CONTRATO_CFG[selected.contrato].bg} color={CONTRATO_CFG[selected.contrato].color} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Email",         value: selected.email },
                { label: "Departamento",  value: selected.departamento },
                { label: "Tipo contrato", value: selected.contrato },
                { label: "Fecha inicio",  value: selected.inicio },
              ].map(r => (
                <div key={r.label} style={{ padding: "10px 14px", background: COLORS.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H }}>{r.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray, fontFamily: H, marginTop: 3 }}>{r.value}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Formación */}
          <Card style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Icon name="check" size={15} color={COLORS.red} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>Formación y Certificados</h3>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Certificación / Título", "Entidad", "Año", "Estado"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `1px solid ${COLORS.border}`, fontFamily: H }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selected.formacion.map((f, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: COLORS.gray, fontFamily: H }}>{f.titulo}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>{f.entidad}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: COLORS.gray, fontFamily: "monospace" }}>{f.año}</td>
                    <td style={{ padding: "10px 12px" }}><Badge label={f.estado} bg={FMC_CFG[f.estado].bg} color={FMC_CFG[f.estado].color} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
