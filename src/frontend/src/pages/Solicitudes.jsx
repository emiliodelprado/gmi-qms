import { useState, useEffect, useCallback, useContext } from "react";
import { COLORS, H, B, Icon, PageHeader, Badge, Card, BtnPrimary, inputStyle, apiFetch } from "../constants.jsx";
import { SolicitudContext } from "../contexts.jsx";

// ── Roles that can manage solicitudes ────────────────────────────────────────
const ADMIN_ROLES = new Set(["IT", "admin", "Calidad", "Dirección"]);

// ── Status config ────────────────────────────────────────────────────────────
const ESTADOS = [
  { value: "enviada",    label: "Enviada",    bg: "#E3F2FD", color: "#1565C0" },
  { value: "leida",      label: "Leída",      bg: "#ECEFF1", color: "#546E7A" },
  { value: "en_proceso", label: "En proceso", bg: "#FFF3E0", color: "#E65100" },
  { value: "resuelta",   label: "Resuelta",   bg: "#E8F5E9", color: "#2E7D32" },
  { value: "descartada", label: "Descartada", bg: "#FCE4EC", color: "#C62828" },
];
const estadoMap = Object.fromEntries(ESTADOS.map(e => [e.value, e]));

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
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("todas");
  const [editComment, setEditComment] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const { open, prevScreenLabel, user } = useContext(SolicitudContext);

  const isAdmin = ADMIN_ROLES.has(user?.role);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/solicitudes");
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Refresh when a new solicitud is created from the drawer
  useEffect(() => {
    const handler = () => fetchItems();
    window.addEventListener("solicitudes-refresh", handler);
    return () => window.removeEventListener("solicitudes-refresh", handler);
  }, [fetchItems]);

  const filtered = filter === "todas" ? items : items.filter(i => i.estado === filter);

  const changeEstado = async (id, nuevoEstado) => {
    try {
      const res = await apiFetch(`/api/solicitudes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error();
      setItems(prev => prev.map(it => it.id === id ? { ...it, estado: nuevoEstado } : it));
    } catch {
      alert("Error al cambiar el estado.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta solicitud?")) return;
    try {
      const res = await apiFetch(`/api/solicitudes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems(prev => prev.filter(it => it.id !== id));
    } catch {
      alert("Error al eliminar la solicitud.");
    }
  };

  const startEditComment = (item) => {
    setEditComment(item.id);
    setCommentDraft(item.comentario_admin || "");
  };

  const saveComment = async (id) => {
    try {
      const res = await apiFetch(`/api/solicitudes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comentario_admin: commentDraft }),
      });
      if (!res.ok) throw new Error();
      setItems(prev => prev.map(it => it.id === id ? { ...it, comentario_admin: commentDraft } : it));
      setEditComment(null);
    } catch {
      alert("Error al guardar el comentario.");
    }
  };

  // ── Columns (dynamic based on admin role) ──────────────────────────────────
  const COLS = [
    { key: "user_name",        label: "Usuario",      width: "12%" },
    { key: "pantalla",         label: "Pantalla",     width: "14%" },
    { key: "created_at",       label: "Fecha",        width: "8%"  },
    { key: "estado",           label: "Estado",       width: "11%" },
    { key: "detalle",          label: "Detalle" },
    { key: "comentario_admin", label: "Resp. admin",  width: "16%" },
    ...(isAdmin ? [{ key: "acciones", label: "", width: "4%" }] : []),
  ];

  const fmtDate = (ts) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

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
          {loading ? "Cargando…" : `${filtered.length} ${filtered.length === 1 ? "solicitud" : "solicitudes"}`}
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
            {loading ? (
              <tr>
                <td colSpan={COLS.length} style={{ ...tdStyle, textAlign: "center", padding: 32, color: COLORS.grayLight }}>
                  Cargando solicitudes…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} style={{ ...tdStyle, textAlign: "center", padding: 32, color: COLORS.grayLight }}>
                  No hay solicitudes{filter !== "todas" ? " con este estado" : ""}.
                </td>
              </tr>
            ) : filtered.map((item, i) => {
              const est = estadoMap[item.estado];
              return (
                <tr key={item.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FCFCFC" }}>
                  <td style={tdStyle}>{item.user_name}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{item.pantalla}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{fmtDate(item.created_at)}</td>

                  {/* Estado — select for admin, badge for others */}
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

                  {/* Comentario admin — editable for admin, read-only for others */}
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

                  {/* Delete — admin only */}
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
