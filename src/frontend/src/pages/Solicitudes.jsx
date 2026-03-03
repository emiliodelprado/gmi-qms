import { useState, useEffect, useContext } from "react";
import { COLORS, H, B, Icon, PageHeader, Badge, Card, BtnPrimary, inputStyle } from "../constants.jsx";
import { SolicitudContext } from "../contexts.jsx";

// ── Roles that can manage solicitudes ────────────────────────────────────────
const ADMIN_ROLES = new Set(["IT", "admin"]);

// ── Status config ────────────────────────────────────────────────────────────
const ESTADOS = [
  { value: "enviada",    label: "Enviada",    bg: "#E3F2FD", color: "#1565C0" },
  { value: "leida",      label: "Leída",      bg: "#ECEFF1", color: "#546E7A" },
  { value: "en_proceso", label: "En proceso", bg: "#FFF3E0", color: "#E65100" },
  { value: "resuelta",   label: "Resuelta",   bg: "#E8F5E9", color: "#2E7D32" },
  { value: "descartada", label: "Descartada", bg: "#FCE4EC", color: "#C62828" },
];
const estadoMap = Object.fromEntries(ESTADOS.map(e => [e.value, e]));

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK = [
  { id: 1, usuario: "Ana García",      pantalla: "Vista Ejecutiva",          fecha: "2026-02-28", estado: "resuelta",   detalle: "Sería útil poder exportar el dashboard a PDF para las reuniones de dirección.", comentario_admin: "Implementado en v0.4.0" },
  { id: 2, usuario: "Carlos Ruiz",     pantalla: "Gestión de Formación",     fecha: "2026-03-01", estado: "en_proceso", detalle: "Añadir filtro por departamento en el listado de formaciones planificadas.", comentario_admin: "" },
  { id: 3, usuario: "Lucía Fernández", pantalla: "Homologación Proveedores", fecha: "2026-03-02", estado: "leida",      detalle: "El cuestionario de evaluación debería permitir adjuntar documentos de soporte.", comentario_admin: "" },
  { id: 4, usuario: "Pedro Martín",    pantalla: "Calculadora de Riesgos",   fecha: "2026-03-03", estado: "enviada",    detalle: "Incluir un campo de notas en cada riesgo para justificar la valoración asignada.", comentario_admin: "" },
  { id: 5, usuario: "María López",     pantalla: "Master de Ofertas",        fecha: "2026-02-20", estado: "descartada", detalle: "Poder duplicar ofertas existentes como plantilla.", comentario_admin: "Funcionalidad ya disponible con el botón copiar" },
];

// ── Table styles ─────────────────────────────────────────────────────────────
const thStyle = {
  padding: "10px 14px", textAlign: "left",
  fontSize: 11, fontWeight: 800, textTransform: "uppercase",
  color: COLORS.grayLight, fontFamily: H,
  borderBottom: `2px solid ${COLORS.border}`, background: "#FAFAFA",
};
const tdStyle = {
  padding: "10px 14px", fontSize: 13, color: COLORS.gray, fontFamily: B,
  verticalAlign: "top",
};

// ── Component ────────────────────────────────────────────────────────────────
export default function Solicitudes() {
  const [items, setItems]     = useState(MOCK);
  const [filter, setFilter]   = useState("todas");
  const [editComment, setEditComment] = useState(null); // id of item being edited
  const [commentDraft, setCommentDraft] = useState("");
  const { open, prevScreenLabel, user } = useContext(SolicitudContext);

  const isAdmin = ADMIN_ROLES.has(user?.role);

  // Listen for solicitudes saved from the global drawer
  useEffect(() => {
    const handler = (e) => setItems(prev => [e.detail, ...prev]);
    window.addEventListener("nueva-solicitud", handler);
    return () => window.removeEventListener("nueva-solicitud", handler);
  }, []);

  const filtered = filter === "todas" ? items : items.filter(i => i.estado === filter);

  const changeEstado = (id, nuevoEstado) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, estado: nuevoEstado } : it));
  };

  const handleDelete = (id) => {
    if (!confirm("¿Eliminar esta solicitud?")) return;
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const startEditComment = (item) => {
    setEditComment(item.id);
    setCommentDraft(item.comentario_admin || "");
  };

  const saveComment = (id) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, comentario_admin: commentDraft } : it));
    setEditComment(null);
  };

  // ── Columns (dynamic based on admin role) ──────────────────────────────────
  const COLS = [
    { key: "usuario",          label: "Usuario",      width: "12%" },
    { key: "pantalla",         label: "Pantalla",     width: "14%" },
    { key: "fecha",            label: "Fecha",        width: "8%"  },
    { key: "estado",           label: "Estado",       width: "11%" },
    { key: "detalle",          label: "Detalle" },
    { key: "comentario_admin", label: "Resp. admin",  width: "16%" },
    ...(isAdmin ? [{ key: "acciones", label: "", width: "4%" }] : []),
  ];

  return (
    <>
      <PageHeader
        title="Solicitudes"
        subtitle="Envía y consulta peticiones, errores y sugerencias de mejora"
        action={
          <BtnPrimary onClick={() => open(prevScreenLabel)}>
            <Icon name="plus" size={15} color="#fff" /> Nueva solicitud
          </BtnPrimary>
        }
      />

      {/* ── Filter strip ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[{ value: "todas", label: "Todas" }, ...ESTADOS].map(e => {
          const active = filter === e.value;
          return (
            <button key={e.value} onClick={() => setFilter(e.value)} style={{
              padding: "5px 14px", borderRadius: 20, cursor: "pointer",
              border: active ? "none" : `1px solid ${COLORS.border}`,
              background: active ? COLORS.red : COLORS.white,
              color: active ? "#fff" : COLORS.grayLight,
              fontFamily: H, fontWeight: 700, fontSize: 12,
              transition: "all 0.15s",
            }}>{e.label}</button>
          );
        })}
        <span style={{ marginLeft: "auto", fontSize: 12, color: COLORS.grayLight, fontFamily: B, alignSelf: "center" }}>
          {filtered.length} {filtered.length === 1 ? "solicitud" : "solicitudes"}
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <Card style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {COLS.map(c => (
                <th key={c.key} style={{ ...thStyle, width: c.width }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLS.length} style={{ ...tdStyle, textAlign: "center", padding: 32, color: COLORS.grayLight }}>
                  No hay solicitudes{filter !== "todas" ? " con este estado" : ""}.
                </td>
              </tr>
            )}
            {filtered.map((item, i) => {
              const est = estadoMap[item.estado];
              return (
                <tr key={item.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FCFCFC" }}>
                  <td style={tdStyle}>{item.usuario}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{item.pantalla}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{item.fecha}</td>

                  {/* Estado — select for IT, badge for others */}
                  <td style={tdStyle}>
                    {isAdmin ? (
                      <select
                        value={item.estado}
                        onChange={e => changeEstado(item.id, e.target.value)}
                        style={{
                          padding: "3px 6px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                          fontFamily: H, border: `1px solid ${COLORS.border}`,
                          background: est?.bg ?? "#eee", color: est?.color ?? "#333",
                          cursor: "pointer", outline: "none",
                        }}
                      >
                        {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                      </select>
                    ) : (
                      <Badge label={est?.label ?? item.estado} bg={est?.bg ?? "#eee"} color={est?.color ?? "#333"} />
                    )}
                  </td>

                  <td style={{ ...tdStyle, lineHeight: 1.5 }}>{item.detalle}</td>

                  {/* Comentario admin — editable for IT, read-only for others */}
                  <td style={{ ...tdStyle, fontSize: 12 }}>
                    {isAdmin && editComment === item.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <textarea
                          style={{ ...inputStyle, fontSize: 12, minHeight: 50, resize: "vertical" }}
                          value={commentDraft}
                          onChange={e => setCommentDraft(e.target.value)}
                          autoFocus
                        />
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          <button onClick={() => setEditComment(null)} style={{ padding: "3px 8px", fontSize: 11, border: `1px solid ${COLORS.border}`, borderRadius: 4, background: "#fff", cursor: "pointer", color: COLORS.grayLight, fontFamily: B }}>Cancelar</button>
                          <button onClick={() => saveComment(item.id)} style={{ padding: "3px 8px", fontSize: 11, border: "none", borderRadius: 4, background: COLORS.red, color: "#fff", cursor: "pointer", fontWeight: 700, fontFamily: H }}>Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{ color: item.comentario_admin ? COLORS.gray : COLORS.grayLight, fontStyle: item.comentario_admin ? "normal" : "italic", cursor: isAdmin ? "pointer" : "default" }}
                        onClick={isAdmin ? () => startEditComment(item) : undefined}
                        title={isAdmin ? "Clic para editar" : undefined}
                      >
                        {item.comentario_admin || (isAdmin ? "Añadir comentario..." : "—")}
                      </div>
                    )}
                  </td>

                  {/* Delete — IT only */}
                  {isAdmin && (
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Eliminar solicitud"
                        style={{ background: "none", border: "1px solid #FCC", borderRadius: 5, padding: "4px 7px", cursor: "pointer" }}
                      >
                        <Icon name="trash" size={13} color={COLORS.red} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
