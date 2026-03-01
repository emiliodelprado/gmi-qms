import { useState, useEffect, useCallback } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, Badge, BtnPrimary, inputStyle } from "../../constants.jsx";

const TIPOS = ["Grupo", "Entidad Legal", "Marca"];

const TIPO_CFG = {
  "Grupo":         { bg: "#F5E6E6", color: COLORS.red,   icon: "strategy"  },
  "Entidad Legal": { bg: "#E3F2FD", color: "#1565C0",    icon: "briefcase" },
  "Marca":         { bg: "#F0F4F0", color: "#2E7D32",    icon: "operations"},
};

function buildTree(flat) {
  const map = {};
  flat.forEach(e => { map[e.id] = { ...e, children: [] }; });
  const roots = [];
  flat.forEach(e => {
    if (e.parent_id && map[e.parent_id]) map[e.parent_id].children.push(map[e.id]);
    else roots.push(map[e.id]);
  });
  const sort = ns => {
    ns.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    ns.forEach(n => sort(n.children));
  };
  sort(roots);
  return roots;
}

const BLANK = { tipo: "Marca", label: "", code: "", parent_id: null, activo: 1, sort_order: 0, denominacion_social: "", domicilio_social: "", nif: "" };

const labelStyle = {
  fontSize: 10, fontWeight: 800, color: COLORS.grayLight,
  textTransform: "uppercase", letterSpacing: "0.08em",
  fontFamily: H, display: "block", marginBottom: 6,
};

function EntityModal({ initial, allEntities, onClose, onSaved }) {
  const isEdit = !!initial?.id;
  const [form, setForm]   = useState(isEdit ? { ...initial } : { ...BLANK, parent_id: initial?.parent_id ?? null });
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.label.trim() || !form.code.trim()) {
      setErr("Nombre y código son obligatorios.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const url = isEdit ? `/api/adm/structure/${initial.id}` : "/api/adm/structure";
      const res = await fetch(url, {
        method:      isEdit ? "PUT" : "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ ...form, parent_id: form.parent_id || null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.detail || "Error al guardar");
        return;
      }
      onSaved(await res.json());
    } catch {
      setErr("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  // Marcas cannot be parents; also exclude the entity itself (no self-reference)
  const candidates = allEntities.filter(e => e.id !== initial?.id && e.tipo !== "Marca");

  // Only one Grupo allowed; hide "Grupo" option if one already exists (unless editing that same one)
  const grupoExists = allEntities.some(e => e.tipo === "Grupo" && e.id !== initial?.id);
  const tiposAvail  = grupoExists ? TIPOS.filter(t => t !== "Grupo") : TIPOS;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()}>
      <Card style={{ width: 440, padding: 24 }}>
        <div style={{ fontFamily: H, fontWeight: 800, fontSize: 15, color: COLORS.gray, marginBottom: 20 }}>
          {isEdit ? "Editar entidad" : "Nueva entidad"}
        </div>

        {/* Tipo */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Tipo</label>
          <select
            value={tiposAvail.includes(form.tipo) ? form.tipo : tiposAvail[0]}
            onChange={e => {
              const t = e.target.value;
              setForm(f => ({ ...f, tipo: t, parent_id: t === "Grupo" ? null : f.parent_id }));
            }}
            style={{ ...inputStyle, width: "100%" }}
          >
            {tiposAvail.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Nombre */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Nombre</label>
          <input
            type="text"
            value={form.label}
            onChange={e => set("label", e.target.value)}
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
            placeholder="Ej. Global Manager Spain"
          />
        </div>

        {/* Código */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Código</label>
          <input
            type="text"
            value={form.code}
            onChange={e => set("code", e.target.value.toUpperCase())}
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box", fontFamily: "monospace" }}
            placeholder="Ej. GMS"
            maxLength={20}
          />
        </div>

        {/* Legal-entity specific fields */}
        {form.tipo === "Entidad Legal" && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Denominación social</label>
              <input
                type="text"
                value={form.denominacion_social ?? ""}
                onChange={e => set("denominacion_social", e.target.value)}
                style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                placeholder="Ej. Global Manager Spain S.L."
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Domicilio social</label>
              <input
                type="text"
                value={form.domicilio_social ?? ""}
                onChange={e => set("domicilio_social", e.target.value)}
                style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                placeholder="Ej. Calle Gran Vía, 28, 28013 Madrid"
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>NIF</label>
              <input
                type="text"
                value={form.nif ?? ""}
                onChange={e => set("nif", e.target.value.toUpperCase())}
                style={{ ...inputStyle, width: "100%", boxSizing: "border-box", fontFamily: "monospace" }}
                placeholder="Ej. B12345678"
                maxLength={20}
              />
            </div>
          </>
        )}

        {/* Entidad padre — oculto para Grupo (es la raíz máxima) */}
        {form.tipo !== "Grupo" && (
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Entidad padre</label>
            <select
              value={form.parent_id ?? ""}
              onChange={e => set("parent_id", e.target.value ? Number(e.target.value) : null)}
              style={{ ...inputStyle, width: "100%" }}
            >
              <option value="">— Sin padre (raíz) —</option>
              {candidates.map(c => (
                <option key={c.id} value={c.id}>{c.label} ({c.code})</option>
              ))}
            </select>
          </div>
        )}

        {/* Orden */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Orden</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={e => set("sort_order", Number(e.target.value))}
            style={{ ...inputStyle, width: 90, boxSizing: "border-box" }}
          />
        </div>

        {/* Activo */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            id="ent-activo"
            checked={form.activo === 1}
            onChange={e => set("activo", e.target.checked ? 1 : 0)}
          />
          <label htmlFor="ent-activo" style={{ fontSize: 12, fontFamily: B, color: COLORS.gray, cursor: "pointer" }}>
            Activo
          </label>
        </div>

        {err && (
          <div style={{
            marginBottom: 14, padding: "8px 12px",
            background: "#FFF0F0", border: `1px solid ${COLORS.red}`,
            borderRadius: 6, fontSize: 12, color: COLORS.red, fontFamily: B,
          }}>
            {err}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <BtnPrimary onClick={save} disabled={saving}>
            <Icon name="check" size={14} color="#fff" />
            {saving ? "Guardando…" : "Guardar"}
          </BtnPrimary>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 6,
              background: COLORS.white, cursor: "pointer", fontSize: 13, fontFamily: B, color: COLORS.gray,
            }}
          >
            Cancelar
          </button>
        </div>
      </Card>
      </div>
    </div>
  );
}

function TreeNode({ node, allFlat, onEdit, onAddChild, onDelete, depth = 0 }) {
  const [open, setOpen] = useState(true);
  const cfg = TIPO_CFG[node.tipo] ?? { bg: "#F0F0F0", color: "#555", icon: "folder" };
  const hasChildren = node.children?.length > 0;

  return (
    <div style={{ marginLeft: depth * 28 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", marginBottom: 6,
        background: node.activo ? COLORS.white : "#FAFAFA",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8, borderLeft: `4px solid ${node.activo ? cfg.color : COLORS.border}`,
        opacity: node.activo ? 1 : 0.6,
      }}>
        {/* Chevron */}
        <button
          onClick={() => hasChildren && setOpen(o => !o)}
          style={{
            background: "none", border: "none",
            cursor: hasChildren ? "pointer" : "default",
            padding: 0, width: 14, display: "flex", alignItems: "center",
          }}
        >
          {hasChildren && (
            <svg
              width={12} height={12} viewBox="0 0 24 24" fill="none"
              stroke={COLORS.grayLight} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </button>

        {/* Type icon */}
        <div style={{
          width: 32, height: 32, borderRadius: 7, background: cfg.bg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon name={cfg.icon} size={14} color={cfg.color} />
        </div>

        {/* Label */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{node.label}</div>
          <div style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: "monospace" }}>{node.code}</div>
        </div>

        <Badge label={node.tipo} bg={cfg.bg} color={cfg.color} />

        {/* Edit */}
        <button
          onClick={() => onEdit(node)}
          title="Editar"
          style={{
            background: "none", border: `1px solid ${COLORS.border}`,
            borderRadius: 5, padding: "4px 9px", cursor: "pointer",
          }}
        >
          <Icon name="edit" size={13} color={COLORS.grayLight} />
        </button>

        {/* Add child */}
        <button
          onClick={() => onAddChild(node.id)}
          title="Añadir entidad hija"
          style={{
            background: "#FFF8F8", border: "1px solid #F5CCCC",
            borderRadius: 5, padding: "4px 9px", cursor: "pointer",
          }}
        >
          <Icon name="plus" size={13} color={COLORS.red} />
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(node)}
          title="Eliminar"
          style={{
            background: "none", border: "1px solid #FFCDD2",
            borderRadius: 5, padding: "4px 9px", cursor: "pointer",
          }}
        >
          <Icon name="trash" size={13} color="#E53935" />
        </button>
      </div>

      {hasChildren && open && (
        <div>
          {node.children.map(ch => (
            <TreeNode
              key={ch.id}
              node={ch}
              allFlat={allFlat}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdmEstructura() {
  const [entities, setEntities] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);   // null | { entity?: obj, parentId?: int }
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/adm/structure", { credentials: "include" });
      if (r.ok) setEntities(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tree = buildTree(entities);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/adm/structure/${toDelete.id}`, { method: "DELETE", credentials: "include" });
    } finally {
      setDeleting(false);
      setToDelete(null);
      load();
    }
  };

  return (
    <div>
      <PageHeader
        title="Estructura Corporativa"
        subtitle="Árbol jerárquico editable: Grupo, Entidades Legales y Marcas"
        action={
          <BtnPrimary onClick={() => setModal({ entity: null, parentId: null })}>
            <Icon name="plus" size={14} color="#fff" />
            Nueva entidad
          </BtnPrimary>
        }
      />

      {loading ? (
        <div style={{ color: COLORS.grayLight, fontFamily: B, fontSize: 13 }}>Cargando estructura…</div>
      ) : tree.length === 0 ? (
        <Card style={{ padding: 32, textAlign: "center" }}>
          <div style={{ color: COLORS.grayLight, fontFamily: B, fontSize: 13 }}>
            No hay entidades. Crea la primera pulsando «Nueva entidad».
          </div>
        </Card>
      ) : (
        tree.map(node => (
          <TreeNode
            key={node.id}
            node={node}
            allFlat={entities}
            onEdit={node => setModal({ entity: node, parentId: null })}
            onAddChild={parentId => setModal({ entity: null, parentId })}
            onDelete={node => setToDelete(node)}
          />
        ))
      )}

      {/* Add / Edit modal */}
      {modal !== null && (
        <EntityModal
          initial={modal.entity ? { ...modal.entity } : { parent_id: modal.parentId ?? null }}
          allEntities={entities}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {/* Delete confirmation */}
      {toDelete && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setToDelete(null)}
        >
          <div onClick={e => e.stopPropagation()}>
          <Card style={{ width: 380, padding: 24 }}>
            <div style={{ fontFamily: H, fontWeight: 800, fontSize: 15, color: COLORS.gray, marginBottom: 10 }}>
              ¿Eliminar entidad?
            </div>
            <div style={{ fontSize: 13, fontFamily: B, color: COLORS.gray, marginBottom: 20, lineHeight: 1.6 }}>
              Se eliminará <strong>{toDelete.label}</strong> ({toDelete.code}).
              Las entidades hijas quedarán sin entidad padre.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "8px 18px", background: "#C62828", color: "#fff",
                  border: "none", borderRadius: 6, cursor: deleting ? "not-allowed" : "pointer",
                  fontSize: 13, fontFamily: B, fontWeight: 700, opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
              <button
                onClick={() => setToDelete(null)}
                style={{
                  padding: "8px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 6,
                  background: COLORS.white, cursor: "pointer", fontSize: 13, fontFamily: B, color: COLORS.gray,
                }}
              >
                Cancelar
              </button>
            </div>
          </Card>
          </div>
        </div>
      )}
    </div>
  );
}
