import { useState } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, Badge } from "../../constants.jsx";

const DOCUMENTOS = {
  Estratégicos: [
    { codigo: "MN-GMI-01",  nombre: "Manual del Sistema de Gestión de la Calidad",  version: "3.0", fecha: "2026-01-15", estado: "Vigente",  tipo: "Manual"       },
    { codigo: "PL-CAL-01",  nombre: "Política de Calidad GMI",                      version: "2.1", fecha: "2025-12-01", estado: "Vigente",  tipo: "Política"     },
    { codigo: "PL-ETI-01",  nombre: "Código Ético Global Manager Iberia",           version: "1.0", fecha: "2025-06-01", estado: "Vigente",  tipo: "Política"     },
    { codigo: "R-ES02-01",  nombre: "Registro de Objetivos Estratégicos Anuales",  version: "2026", fecha: "2026-01-10", estado: "Vigente",  tipo: "Registro"     },
    { codigo: "MX-DAFO-01", nombre: "Matriz DAFO/CAME – Revisión Anual",           version: "2026", fecha: "2026-02-01", estado: "Vigente",  tipo: "Registro"     },
  ],
  Operativos: [
    { codigo: "PR-OPE01",   nombre: "Procedimiento de Captación de Clientes",       version: "2.2", fecha: "2025-09-01", estado: "Vigente",  tipo: "Procedimiento" },
    { codigo: "PR-OPE02",   nombre: "Procedimiento de Gestión de Proyectos",        version: "3.1", fecha: "2026-01-20", estado: "Vigente",  tipo: "Procedimiento" },
    { codigo: "PR-OPE03",   nombre: "Procedimiento de Elaboración de Ofertas",      version: "2.0", fecha: "2025-11-15", estado: "Vigente",  tipo: "Procedimiento" },
    { codigo: "F-OPE03-01", nombre: "Plantilla de Propuesta Comercial",             version: "1.5", fecha: "2025-11-15", estado: "Vigente",  tipo: "Formulario"   },
    { codigo: "PR-OPE01",   nombre: "Procedimiento Anterior de Captación (anulado)", version: "2.1", fecha: "2025-08-01", estado: "Obsoleto", tipo: "Procedimiento" },
  ],
  Soporte: [
    { codigo: "PR-SOP01",   nombre: "Procedimiento de Gestión de RRHH",             version: "2.0", fecha: "2025-07-01", estado: "Vigente",  tipo: "Procedimiento" },
    { codigo: "PR-SOP07",   nombre: "Gestión de Información Documentada",           version: "1.2", fecha: "2025-10-01", estado: "Vigente",  tipo: "Procedimiento" },
    { codigo: "IT-ES03-01", nombre: "IT Evaluación de Riesgos y Oportunidades",    version: "1.1", fecha: "2025-08-15", estado: "Vigente",  tipo: "Instrucción"  },
    { codigo: "F-TAL-ONB-01",nombre: "Formulario Encuesta de Onboarding",          version: "1.0", fecha: "2025-12-01", estado: "Vigente",  tipo: "Formulario"   },
    { codigo: "ET-COD-01",  nombre: "Código de Conducta Ética (firmable)",         version: "1.0", fecha: "2025-06-01", estado: "Vigente",  tipo: "Política"     },
  ],
};

const TIPO_CFG = {
  Manual:        { bg: "#EDE7F6", color: "#4527A0" },
  Política:      { bg: "#FCE4EC", color: "#880E4F" },
  Procedimiento: { bg: "#E3F2FD", color: "#0D47A1" },
  Instrucción:   { bg: "#E8F5E9", color: "#1B5E20" },
  Formulario:    { bg: "#FFF8E1", color: "#F57F17" },
  Registro:      { bg: "#FBE9E7", color: "#BF360C" },
};

const ESTADO_CFG = {
  Vigente:  { bg: "#E8F5E9", color: "#2E7D32" },
  Obsoleto: { bg: "#F5F5F5", color: "#9E9E9E" },
};

export default function DocMaestro() {
  const [tab, setTab]    = useState("Estratégicos");
  const [search, setSearch] = useState("");

  const tabs = Object.keys(DOCUMENTOS);
  const docs = DOCUMENTOS[tab].filter(d =>
    d.nombre.toLowerCase().includes(search.toLowerCase()) || d.codigo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Listado Maestro de Documentos"
        subtitle="Gestión de información documentada según PR-SOP07"
      />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `2px solid ${COLORS.border}` }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: "8px 18px", border: "none", cursor: "pointer",
              background: "transparent",
              color: tab === t ? COLORS.red : COLORS.grayLight,
              fontFamily: H, fontSize: 13, fontWeight: tab === t ? 800 : 500,
              borderBottom: tab === t ? `2px solid ${COLORS.red}` : "2px solid transparent",
              marginBottom: -2, transition: "all 0.15s",
            }}>
            {t} <span style={{ fontSize: 10, background: tab === t ? `${COLORS.red}18` : COLORS.border, color: tab === t ? COLORS.red : COLORS.grayLight, borderRadius: 10, padding: "1px 7px", marginLeft: 4, fontFamily: H }}>
              {DOCUMENTOS[t].length}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 340, marginBottom: 14 }}>
        <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <Icon name="search" size={14} color={COLORS.grayLight} />
        </div>
        <input
          style={{ width: "100%", padding: "8px 10px 8px 32px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, color: COLORS.gray, background: COLORS.white, outline: "none", fontFamily: "" + B }}
          placeholder="Buscar por código o nombre..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F9F9F9" }}>
              {["Código","Nombre del Documento","Tipo","Versión","Fecha Rev.","Estado"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `2px solid ${COLORS.border}`, fontFamily: H, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docs.map((doc, i) => {
              const tcfg = TIPO_CFG[doc.tipo]   ?? { bg: "#F0F0F0", color: COLORS.gray };
              const ecfg = ESTADO_CFG[doc.estado] ?? ESTADO_CFG.Vigente;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FCFCFC", opacity: doc.estado === "Obsoleto" ? 0.6 : 1 }}>
                  <td style={{ padding: "11px 16px", fontFamily: "monospace", fontSize: 11, color: COLORS.red, fontWeight: 700 }}>{doc.codigo}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 600, color: COLORS.gray, fontFamily: H, maxWidth: 320 }}>
                    {doc.nombre}
                    {doc.estado === "Vigente" && <span style={{ marginLeft: 8, fontSize: 9, fontWeight: 800, background: "#E8F5E9", color: "#2E7D32", borderRadius: 4, padding: "1px 6px", fontFamily: H }}>VIGENTE</span>}
                  </td>
                  <td style={{ padding: "11px 16px" }}><Badge label={doc.tipo} bg={tcfg.bg} color={tcfg.color} /></td>
                  <td style={{ padding: "11px 16px", fontSize: 12, fontFamily: "monospace", color: COLORS.gray }}>{doc.version}</td>
                  <td style={{ padding: "11px 16px", fontSize: 11, fontFamily: "monospace", color: COLORS.grayLight }}>{doc.fecha}</td>
                  <td style={{ padding: "11px 16px" }}><Badge label={doc.estado} bg={ecfg.bg} color={ecfg.color} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
