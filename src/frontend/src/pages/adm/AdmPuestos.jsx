import { useState, useEffect, useContext } from "react";
import { COLORS, H, B, Icon, apiFetch } from "../../constants.jsx";
import { PermissionsContext } from "../../contexts.jsx";

const EMPTY = { nombre: "", departamento_ids: [], descripcion: "", requisitos: "", activo: 1 };

// ─── Multi-select checkboxes for departments ───────────────────────────────────
function DeptCheckboxes({ departments, selected, onChange }) {
  const toggle = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    onChange([...s]);
  };
  if (!departments.length) return (
    <p style={{ fontFamily: B, fontSize: 12, color: COLORS.grayLight }}>Sin departamentos creados.</p>
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {departments.filter(d => d.activo).map(d => {
        const on = selected.includes(d.id);
        return (
          <button key={d.id} type="button" onClick={() => toggle(d.id)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 20, cursor: "pointer",
            border: `1px solid ${on ? COLORS.red : COLORS.border}`,
            background: on ? "#FFF0F0" : COLORS.white,
            fontFamily: B, fontSize: 12,
            color: on ? COLORS.red : COLORS.grayLight,
            transition: "all 0.1s",
          }}>
            {on && <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.red, flexShrink: 0 }} />}
            {d.nombre}
          </button>
        );
      })}
    </div>
  );
}

function Modal({ pos, departments, onClose, onSaved }) {
  const [form, setForm] = useState(pos ? {
    ...pos,
    departamento_ids: pos.departamento_ids || [],
  } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.nombre.trim()) { setErr("El nombre del puesto es obligatorio."); return; }
    setSaving(true); setErr("");
    try {
      const method = pos ? "PUT" : "POST";
      const url    = pos ? `/api/adm/positions/${pos.id}` : "/api/adm/positions";
      const res    = await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); setErr(d.detail || "Error al guardar"); return; }
      onSaved(await res.json());
    } catch { setErr("Error de conexión"); }
    finally  { setSaving(false); }
  };

  const inp = {
    width: "100%", padding: "8px 10px", border: `1px solid ${COLORS.border}`,
    borderRadius: 6, fontFamily: B, fontSize: 13, color: COLORS.gray,
    background: COLORS.white, boxSizing: "border-box",
  };
  const ta = { ...inp, resize: "vertical", minHeight: 90 };
  const lbl = { display: "block", fontSize: 11, fontWeight: 700, fontFamily: H,
    color: COLORS.grayLight, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: COLORS.white, borderRadius: 12, padding: 28,
        width: 560, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: H, fontWeight: 800, fontSize: 16, color: COLORS.gray }}>
            {pos ? "Editar puesto" : "Nuevo puesto"}
          </span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: COLORS.grayLight }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={lbl}>Nombre del puesto *</label>
            <input style={inp} value={form.nombre} onChange={e => set("nombre", e.target.value)}
              placeholder="ej. Responsable de Calidad" autoFocus />
          </div>
          <div>
            <label style={lbl}>Departamentos</label>
            <DeptCheckboxes
              departments={departments}
              selected={form.departamento_ids}
              onChange={ids => set("departamento_ids", ids)}
            />
          </div>
          <div>
            <label style={lbl}>Descripción de objetivos y funciones</label>
            <textarea style={ta} value={form.descripcion || ""} onChange={e => set("descripcion", e.target.value)}
              placeholder="Describe los objetivos principales y las funciones del puesto..." />
          </div>
          <div>
            <label style={lbl}>Requisitos</label>
            <textarea style={ta} value={form.requisitos || ""} onChange={e => set("requisitos", e.target.value)}
              placeholder="Formación requerida, experiencia, competencias..." />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ ...lbl, margin: 0 }}>Estado</label>
            <select style={{ ...inp, width: "auto" }} value={form.activo} onChange={e => set("activo", Number(e.target.value))}>
              <option value={1}>Activo</option>
              <option value={0}>Inactivo</option>
            </select>
          </div>
        </div>

        {err && <p style={{ color: "#c62828", fontSize: 12, marginTop: 12, fontFamily: B }}>{err}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
          <button onClick={onClose} style={{
            padding: "9px 18px", border: `1px solid ${COLORS.border}`,
            borderRadius: 6, background: COLORS.white, color: COLORS.grayLight,
            cursor: "pointer", fontFamily: H, fontWeight: 700, fontSize: 13,
          }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "9px 22px", border: "none", borderRadius: 6,
            background: saving ? COLORS.border : COLORS.red, color: "#fff",
            cursor: saving ? "not-allowed" : "pointer", fontFamily: H, fontWeight: 700, fontSize: 13,
          }}>{saving ? "Guardando…" : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdmPuestos() {
  const perms    = useContext(PermissionsContext);
  const [items,  setItems]  = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal,  setModal]  = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const canWrite = (() => { const p = perms?.["v-puestos"]; return p === undefined || p === "R/W"; })();

  const load = () => {
    setLoading(true);
    Promise.all([
      apiFetch("/api/adm/positions").then(r => r.json()),
      apiFetch("/api/adm/departments").then(r => r.json()),
    ])
      .then(([positions, depts]) => {
        setItems(Array.isArray(positions) ? positions : []);
        setDepartments(Array.isArray(depts) ? depts : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q) ||
      (p.departamentos || []).some(d => d.nombre.toLowerCase().includes(q))
    );
  });

  const handleSaved = (saved) => {
    setItems(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      return idx >= 0 ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev];
    });
    setModal(null);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await apiFetch(`/api/adm/positions/${toDelete.id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setItems(prev => prev.filter(p => p.id !== toDelete.id));
        setToDelete(null);
      }
    } catch {}
  };

  const truncate = (s, n = 80) => !s ? "—" : s.length > n ? s.slice(0, n) + "…" : s;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.gray, fontFamily: H, margin: 0 }}>
            Catálogo de Puestos
          </h1>
          <p style={{ color: COLORS.grayLight, marginTop: 4, fontSize: 13, fontFamily: B, margin: "4px 0 0" }}>
            Catálogo global de puestos para todos los colaboradores
          </p>
        </div>
        {canWrite && (
          <button onClick={() => setModal({})} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 18px", border: "none", borderRadius: 7,
            background: COLORS.red, color: "#fff", cursor: "pointer",
            fontFamily: H, fontWeight: 700, fontSize: 13,
          }}>
            <Icon name="add" size={14} color="#fff" />
            Nuevo puesto
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar puesto o departamento…"
          style={{
            padding: "8px 12px", border: `1px solid ${COLORS.border}`,
            borderRadius: 7, fontFamily: B, fontSize: 13, width: 300,
            color: COLORS.gray, background: COLORS.white,
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: COLORS.bg }}>
              {["Nombre", "Departamentos", "Descripción / Objetivos", "Requisitos", "Estado", ""].map(h => (
                <th key={h} style={{
                  padding: "10px 14px", textAlign: "left", fontSize: 11,
                  fontFamily: H, fontWeight: 800, color: COLORS.grayLight,
                  textTransform: "uppercase", letterSpacing: "0.04em",
                  borderBottom: `1px solid ${COLORS.border}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: COLORS.grayLight, fontFamily: B }}>
                Cargando…
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: COLORS.grayLight, fontFamily: B }}>
                {search ? "Sin resultados" : "No hay puestos definidos. Crea el primero."}
              </td></tr>
            ) : filtered.map((pos, i) => (
              <tr key={pos.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : COLORS.bg }}>
                <td style={{ padding: "12px 14px", fontFamily: H, fontWeight: 700, fontSize: 13, color: COLORS.gray }}>
                  {pos.nombre}
                </td>
                <td style={{ padding: "12px 14px", fontFamily: B, fontSize: 12, color: COLORS.grayLight, maxWidth: 180 }}>
                  {(pos.departamentos || []).length > 0
                    ? (pos.departamentos || []).map(d => d.nombre).join(", ")
                    : "—"}
                </td>
                <td style={{ padding: "12px 14px", fontFamily: B, fontSize: 12, color: COLORS.grayLight, maxWidth: 200 }}>
                  {truncate(pos.descripcion)}
                </td>
                <td style={{ padding: "12px 14px", fontFamily: B, fontSize: 12, color: COLORS.grayLight, maxWidth: 180 }}>
                  {truncate(pos.requisitos)}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <span style={{
                    display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11,
                    fontFamily: H, fontWeight: 700,
                    background: pos.activo ? "#E8F5E9" : "#FFEBEE",
                    color: pos.activo ? "#2E7D32" : "#C62828",
                  }}>
                    {pos.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                  {canWrite && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setModal({ pos })} title="Editar" style={{
                        padding: "5px 10px", border: `1px solid ${COLORS.border}`,
                        borderRadius: 5, background: COLORS.white, cursor: "pointer",
                        fontSize: 12, fontFamily: H, color: COLORS.grayLight,
                      }}>Editar</button>
                      <button onClick={() => setToDelete(pos)} title="Eliminar" style={{
                        padding: "5px 10px", border: "1px solid #FFCDD2",
                        borderRadius: 5, background: "#FFF8F8", cursor: "pointer",
                        fontSize: 12, fontFamily: H, color: "#C62828",
                      }}>Eliminar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit modal */}
      {modal !== null && (
        <Modal
          pos={modal.pos || null}
          departments={departments}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {toDelete && (
        <div onClick={() => setToDelete(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: COLORS.white, borderRadius: 10, padding: 28,
            width: 380, boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          }}>
            <p style={{ fontFamily: H, fontWeight: 700, color: COLORS.gray, marginBottom: 8 }}>
              ¿Eliminar puesto?
            </p>
            <p style={{ fontFamily: B, fontSize: 13, color: COLORS.grayLight }}>
              Se eliminará <strong>{toDelete.nombre}</strong>. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setToDelete(null)} style={{
                padding: "8px 16px", border: `1px solid ${COLORS.border}`,
                borderRadius: 6, background: COLORS.white, cursor: "pointer",
                fontFamily: H, fontWeight: 700, fontSize: 13, color: COLORS.grayLight,
              }}>Cancelar</button>
              <button onClick={handleDelete} style={{
                padding: "8px 16px", border: "none", borderRadius: 6,
                background: "#C62828", color: "#fff", cursor: "pointer",
                fontFamily: H, fontWeight: 700, fontSize: 13,
              }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
