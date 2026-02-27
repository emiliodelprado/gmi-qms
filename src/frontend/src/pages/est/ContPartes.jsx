import { useState } from "react";
import { COLORS, H, B, Card, PageHeader, Badge } from "../../constants.jsx";

const PARTES = [
  { grupo: "Clientes corporativos", tipo: "Externo", requisitos: "Confidencialidad, entregables a tiempo, reporting mensual, consultores senior certificados", influencia: "Alto", prioridad: "Alta" },
  { grupo: "Empleados estructura", tipo: "Interno", requisitos: "Estabilidad contractual, desarrollo profesional, formación continua, clima laboral positivo", influencia: "Alto", prioridad: "Alta" },
  { grupo: "Consultores proyecto", tipo: "Interno", requisitos: "Asignación de proyectos afines, remuneración competitiva, apoyo backoffice, visibilidad de oportunidades", influencia: "Medio", prioridad: "Alta" },
  { grupo: "Accionistas / Dirección", tipo: "Interno", requisitos: "Rentabilidad, crecimiento sostenible, gestión del riesgo, cumplimiento normativo", influencia: "Alto", prioridad: "Alta" },
  { grupo: "Proveedores IT", tipo: "Externo", requisitos: "Pagos en plazo, especificaciones claras, contrato marco, SLAs definidos", influencia: "Bajo", prioridad: "Media" },
  { grupo: "Entidades reguladoras", tipo: "Externo", requisitos: "Cumplimiento LOPD/RGPD, legislación laboral, normas ISO, prevención de riesgos", influencia: "Alto", prioridad: "Alta" },
  { grupo: "Partners estratégicos", tipo: "Externo", requisitos: "Acuerdos marco claros, co-branding, referencias mutuas, calidad de entregables compartidos", influencia: "Medio", prioridad: "Media" },
  { grupo: "Comunidad / Sociedad", tipo: "Externo", requisitos: "Responsabilidad social, sostenibilidad, ética empresarial, impacto positivo en el entorno", influencia: "Bajo", prioridad: "Baja" },
];

const INF_CONFIG = {
  Alto:  { bg: "#FFEBEE", color: "#C62828" },
  Medio: { bg: "#FFF8E1", color: "#F57F17" },
  Bajo:  { bg: "#F1F8E9", color: "#33691E" },
};

const PRI_CONFIG = {
  Alta:  { bg: "#FCE4EC", color: "#AD1457" },
  Media: { bg: "#E3F2FD", color: "#1565C0" },
  Baja:  { bg: "#F3E5F5", color: "#6A1B9A" },
};

const TIPO_CONFIG = {
  Interno: { bg: "#E8F5E9", color: "#2E7D32" },
  Externo: { bg: "#E3F2FD", color: "#1565C0" },
};

export default function ContPartes() {
  const [filter, setFilter] = useState("Todos");

  const tipos   = ["Todos", "Interno", "Externo"];
  const visible = filter === "Todos" ? PARTES : PARTES.filter(p => p.tipo === filter);

  return (
    <div>
      <PageHeader
        title="Partes Interesadas"
        subtitle="Grupos de interés, sus requisitos y nivel de atención prioritaria"
      />

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {tipos.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            style={{
              padding: "6px 16px", border: "none", borderRadius: 20, cursor: "pointer",
              background: filter === t ? COLORS.red : COLORS.white,
              color: filter === t ? "#fff" : COLORS.grayLight,
              fontSize: 12, fontWeight: 700, fontFamily: H,
              border: `1px solid ${filter === t ? COLORS.red : COLORS.border}`,
            }}>
            {t}
          </button>
        ))}
      </div>

      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F9F9F9" }}>
              {["Grupo de Interés", "Tipo", "Requisitos Clave", "Influencia", "Prioridad"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `2px solid ${COLORS.border}`, fontFamily: H, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((p, i) => (
              <tr key={p.grupo} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FCFCFC" }}>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: COLORS.gray, fontFamily: H }}>{p.grupo}</td>
                <td style={{ padding: "12px 16px" }}>
                  <Badge label={p.tipo} bg={TIPO_CONFIG[p.tipo].bg} color={TIPO_CONFIG[p.tipo].color} />
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.grayLight, fontFamily: B, maxWidth: 340 }}>{p.requisitos}</td>
                <td style={{ padding: "12px 16px" }}>
                  <Badge label={p.influencia} bg={INF_CONFIG[p.influencia].bg} color={INF_CONFIG[p.influencia].color} />
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <Badge label={p.prioridad} bg={PRI_CONFIG[p.prioridad].bg} color={PRI_CONFIG[p.prioridad].color} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
