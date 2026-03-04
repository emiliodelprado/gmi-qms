import { useState, useEffect, useContext } from "react";
import { COLORS, H, B, Icon, apiFetch } from "../../constants.jsx";
import { PermissionsContext } from "../../contexts.jsx";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(nombre, apellidos) {
  const a = (nombre || "").charAt(0).toUpperCase();
  const b = (apellidos || "").charAt(0).toUpperCase();
  return (a + b) || "?";
}

function avatarColor(str) {
  const PALETTE = ["#1565C0","#6A1B9A","#2E7D32","#E65100","#00695C","#424242","#C62828","#0277BD"];
  let hash = 0;
  for (const ch of str) hash = (hash * 31 + ch.charCodeAt(0)) & 0xFFFFFFFF;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function buildTree(entities) {
  const byId  = {};
  entities.forEach(e => { byId[e.id] = { ...e, children: [] }; });
  const roots = [];
  entities.forEach(e => {
    if (e.parent_id && byId[e.parent_id]) byId[e.parent_id].children.push(byId[e.id]);
    else roots.push(byId[e.id]);
  });
  return roots;
}

/** Aggregate all puestos from all entity_assignments into a flat unique list. */
function allPuestos(collab) {
  const seen = new Set();
  const result = [];
  for (const ea of (collab.entity_assignments || [])) {
    for (const p of (ea.puestos || [])) {
      if (!seen.has(p.id)) { seen.add(p.id); result.push(p); }
    }
  }
  return result;
}

const SCOPE_LABELS = { grupo: "Grupo", entidad: "Entidad", marca: "Marca" };

// ─── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button
      role="switch" aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: 38, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
        background: on ? COLORS.red : "#CBD5E0",
        position: "relative", flexShrink: 0, transition: "background 0.15s",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: on ? 18 : 3,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

// ─── Inline position pills (per-entity) ──────────────────────────────────────
function PuestoPills({ positions, selected, onChange }) {
  const toggle = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    onChange([...s]);
  };
  if (!positions.length) return (
    <span style={{ color: COLORS.grayLight, fontFamily: B, fontSize: 11 }}>Sin puestos disponibles</span>
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {positions.filter(p => p.activo).map(p => {
        const on = selected.includes(p.id);
        return (
          <button key={p.id} type="button" onClick={() => toggle(p.id)} style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "3px 10px", borderRadius: 16, cursor: "pointer",
            border: `1px solid ${on ? COLORS.red : COLORS.border}`,
            background: on ? "#FFF0F0" : COLORS.white,
            fontFamily: B, fontSize: 11,
            color: on ? COLORS.red : COLORS.grayLight,
            transition: "all 0.1s",
          }}>
            {on && <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.red, flexShrink: 0 }} />}
            {p.nombre}
          </button>
        );
      })}
    </div>
  );
}

// ─── Entity assignments panel (edit mode) ────────────────────────────────────
function EntityAssignmentsEdit({ allEntities, assignments, onChange, positions, collaborators, currentCollabId }) {
  const roots = buildTree(allEntities);

  // Helper: get assignment for an entity
  const getAssign = (entityId) => assignments.find(a => a.entity_id === entityId);

  const toggleEntity = (entityId) => {
    const existing = getAssign(entityId);
    if (existing) {
      onChange(assignments.filter(a => a.entity_id !== entityId));
    } else {
      onChange([...assignments, { entity_id: entityId, supervisor_id: "", position_ids: [] }]);
    }
  };

  const updateAssign = (entityId, field, value) => {
    onChange(assignments.map(a =>
      a.entity_id === entityId ? { ...a, [field]: value } : a
    ));
  };

  const supervisorOptions = collaborators.filter(c => c.id !== currentCollabId && c.activo);

  const inp = {
    width: "100%", padding: "6px 8px", border: `1px solid ${COLORS.border}`,
    borderRadius: 5, fontFamily: B, fontSize: 12, color: COLORS.gray,
    background: COLORS.white, boxSizing: "border-box",
  };
  const miniLbl = {
    fontSize: 10, fontFamily: H, fontWeight: 700, color: COLORS.grayLight,
    textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3,
  };

  const renderNode = (node, depth = 0) => {
    if (node.tipo === "Grupo") {
      return (
        <div key={node.id}>
          <div style={{ fontSize: 10, fontFamily: H, fontWeight: 800, color: COLORS.grayLight,
            textTransform: "uppercase", letterSpacing: "0.07em", padding: "8px 0 4px",
            borderTop: `1px solid ${COLORS.border}`, marginTop: 8,
          }}>{node.label}</div>
          {node.children.map(ch => renderNode(ch, depth + 1))}
        </div>
      );
    }

    const assign = getAssign(node.id);
    const isSelected = !!assign;
    const indentPx = depth <= 1 ? 0 : (depth - 1) * 16;

    return (
      <div key={node.id}>
        <div style={{ paddingLeft: indentPx }}>
          {/* Entity header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
            <Toggle on={isSelected} onChange={() => toggleEntity(node.id)} />
            <span style={{
              fontFamily: node.tipo === "Entidad Legal" ? H : B,
              fontWeight: node.tipo === "Entidad Legal" ? 700 : 400,
              fontSize: 13, color: isSelected ? COLORS.gray : COLORS.grayLight,
            }}>
              {node.label}
              <span style={{ fontSize: 10, color: COLORS.grayLight, marginLeft: 6, fontFamily: "monospace" }}>
                {node.code}
              </span>
            </span>
            <span style={{
              fontSize: 10, fontFamily: H, fontWeight: 700, marginLeft: "auto",
              color: node.tipo === "Entidad Legal" ? "#1565C0" : "#6A1B9A",
              background: node.tipo === "Entidad Legal" ? "#E3F2FD" : "#F3E5F5",
              padding: "1px 7px", borderRadius: 10,
            }}>{node.tipo === "Entidad Legal" ? "Entidad" : "Marca"}</span>
          </div>

          {/* Per-entity details (only if activated) */}
          {isSelected && (
            <div style={{
              marginLeft: 48, marginBottom: 10, padding: "10px 14px",
              background: "#FAFAFA", borderRadius: 8, border: `1px solid ${COLORS.border}`,
            }}>
              <div style={{ marginBottom: 8 }}>
                <div style={miniLbl}>Supervisor</div>
                <select style={inp} value={assign.supervisor_id || ""}
                  onChange={e => updateAssign(node.id, "supervisor_id", e.target.value)}>
                  <option value="">— Sin supervisor —</option>
                  {supervisorOptions.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.apellidos}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={miniLbl}>Puestos</div>
                <PuestoPills
                  positions={positions}
                  selected={assign.position_ids || []}
                  onChange={ids => updateAssign(node.id, "position_ids", ids)}
                />
              </div>
            </div>
          )}
        </div>
        {node.children.map(ch => renderNode(ch, depth + 1))}
      </div>
    );
  };

  if (!allEntities.length) return (
    <p style={{ color: COLORS.grayLight, fontFamily: B, fontSize: 12 }}>Sin entidades corporativas.</p>
  );

  return <div>{roots.map(r => renderNode(r, 0))}</div>;
}

// ─── Entity assignments panel (read-only, for detail) ────────────────────────
function EntityAssignmentsReadOnly({ allEntities, assignments }) {
  const roots = buildTree(allEntities);
  const assignMap = {};
  for (const a of assignments) assignMap[a.entity_id] = a;

  const renderNode = (node, depth = 0) => {
    if (node.tipo === "Grupo") {
      return (
        <div key={node.id}>
          <div style={{ fontSize: 10, fontFamily: H, fontWeight: 800, color: COLORS.grayLight,
            textTransform: "uppercase", letterSpacing: "0.07em", padding: "8px 0 4px",
            borderTop: `1px solid ${COLORS.border}`, marginTop: 8,
          }}>{node.label}</div>
          {node.children.map(ch => renderNode(ch, depth + 1))}
        </div>
      );
    }

    const assign = assignMap[node.id];
    const isSelected = !!assign;
    const indentPx = depth <= 1 ? 0 : (depth - 1) * 16;

    return (
      <div key={node.id}>
        <div style={{ paddingLeft: indentPx }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
            <span style={{
              width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
              background: isSelected ? COLORS.red : "#CBD5E0",
            }} />
            <span style={{
              fontFamily: node.tipo === "Entidad Legal" ? H : B,
              fontWeight: node.tipo === "Entidad Legal" ? 700 : 400,
              fontSize: 13, color: isSelected ? COLORS.gray : COLORS.grayLight,
            }}>
              {node.label}
              <span style={{ fontSize: 10, color: COLORS.grayLight, marginLeft: 6, fontFamily: "monospace" }}>
                {node.code}
              </span>
            </span>
            <span style={{
              fontSize: 10, fontFamily: H, fontWeight: 700, marginLeft: "auto",
              color: node.tipo === "Entidad Legal" ? "#1565C0" : "#6A1B9A",
              background: node.tipo === "Entidad Legal" ? "#E3F2FD" : "#F3E5F5",
              padding: "1px 7px", borderRadius: 10,
            }}>{node.tipo === "Entidad Legal" ? "Entidad" : "Marca"}</span>
          </div>

          {isSelected && (
            <div style={{
              marginLeft: 20, marginBottom: 6, paddingLeft: 12,
              borderLeft: `2px solid ${COLORS.border}`, fontSize: 12, fontFamily: B,
            }}>
              <div style={{ color: COLORS.grayLight, marginBottom: 2 }}>
                <span style={{ fontFamily: H, fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>Supervisor: </span>
                {assign.supervisor_nombre || "—"}
              </div>
              <div style={{ color: COLORS.grayLight }}>
                <span style={{ fontFamily: H, fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>Puestos: </span>
                {(assign.puestos || []).map(p => p.nombre).join(", ") || "—"}
              </div>
            </div>
          )}
        </div>
        {node.children.map(ch => renderNode(ch, depth + 1))}
      </div>
    );
  };

  if (!allEntities.length) return (
    <p style={{ color: COLORS.grayLight, fontFamily: B, fontSize: 12 }}>Sin entidades corporativas.</p>
  );

  return <div>{roots.map(r => renderNode(r, 0))}</div>;
}

// ─── Access matrix ─────────────────────────────────────────────────────────────
function AccessMatrix({ tenants }) {
  if (!tenants.length) return (
    <p style={{ color: COLORS.grayLight, fontFamily: B, fontSize: 12 }}>Sin accesos asignados.</p>
  );
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr style={{ background: COLORS.bg }}>
          {["Ámbito", "Empresa", "Marca", "Rol"].map(h => (
            <th key={h} style={{
              padding: "7px 10px", textAlign: "left", fontFamily: H, fontWeight: 700,
              fontSize: 10, color: COLORS.grayLight, textTransform: "uppercase",
              letterSpacing: "0.05em", borderBottom: `1px solid ${COLORS.border}`,
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tenants.map(t => (
          <tr key={t.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <td style={{ padding: "7px 10px", fontFamily: B, color: COLORS.grayLight }}>
              {SCOPE_LABELS[t.scope] || t.scope}
            </td>
            <td style={{ padding: "7px 10px", fontFamily: H, fontWeight: 700, color: COLORS.gray }}>
              {t.company_id || "—"}
            </td>
            <td style={{ padding: "7px 10px", fontFamily: B, color: COLORS.grayLight }}>
              {t.brand_id || "—"}
            </td>
            <td style={{ padding: "7px 10px" }}>
              <span style={{
                display: "inline-block", padding: "2px 8px", borderRadius: 10,
                fontSize: 11, fontFamily: H, fontWeight: 700,
                background: "#FFF3E0", color: "#E65100",
              }}>{t.role}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Create/Edit modal ─────────────────────────────────────────────────────────
function CollabModal({ collab, positions, collaborators, users, allEntities, onClose, onSaved }) {
  const isNew = !collab;
  const [form, setForm] = useState(isNew ? {
    nombre: "", apellidos: "", identificador_hrms: "", enlace_hrms: "",
    user_id: "", activo: 1,
    entity_assignments: [],
  } : {
    nombre:             collab.nombre,
    apellidos:          collab.apellidos,
    identificador_hrms: collab.identificador_hrms || "",
    enlace_hrms:        collab.enlace_hrms || "",
    user_id:            collab.user_id || "",
    activo:             collab.activo,
    entity_assignments: (collab.entity_assignments || []).map(ea => ({
      entity_id:     ea.entity_id,
      supervisor_id: ea.supervisor_id || "",
      position_ids:  ea.position_ids || [],
    })),
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const linkedUser = users.find(u => u.id === Number(form.user_id));

  const handleSave = async () => {
    if (!form.nombre.trim())    { setErr("El nombre es obligatorio.");       return; }
    if (!form.apellidos.trim()) { setErr("Los apellidos son obligatorios."); return; }
    setSaving(true); setErr("");
    try {
      const payload = {
        nombre:             form.nombre.trim(),
        apellidos:          form.apellidos.trim(),
        identificador_hrms: form.identificador_hrms || null,
        enlace_hrms:        form.enlace_hrms || null,
        user_id:            form.user_id ? Number(form.user_id) : null,
        activo:             form.activo,
        entity_assignments: form.entity_assignments.map(ea => ({
          entity_id:     ea.entity_id,
          supervisor_id: ea.supervisor_id ? Number(ea.supervisor_id) : null,
          position_ids:  ea.position_ids,
        })),
      };
      const method = isNew ? "POST" : "PUT";
      const url    = isNew ? "/api/tal/collaborators" : `/api/tal/collaborators/${collab.id}`;
      const res    = await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
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
  const lbl = {
    display: "block", fontSize: 11, fontWeight: 700, fontFamily: H,
    color: COLORS.grayLight, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em",
  };
  const sectionHdr = (t) => (
    <div style={{ fontFamily: H, fontWeight: 800, fontSize: 11, color: COLORS.grayLight,
      textTransform: "uppercase", letterSpacing: "0.07em",
      borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 6, marginBottom: 14, marginTop: 16,
    }}>{t}</div>
  );

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: COLORS.white, borderRadius: 12, padding: 28,
        width: 640, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: H, fontWeight: 800, fontSize: 16, color: COLORS.gray }}>
            {isNew ? "Nuevo colaborador" : "Editar colaborador"}
          </span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: COLORS.grayLight }}>×</button>
        </div>

        {sectionHdr("Datos personales")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
          <div>
            <label style={lbl}>Nombre *</label>
            <input style={inp} value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Nombre" />
          </div>
          <div>
            <label style={lbl}>Apellidos *</label>
            <input style={inp} value={form.apellidos} onChange={e => set("apellidos", e.target.value)} placeholder="Apellidos" />
          </div>
          <div>
            <label style={lbl}>ID HRMS</label>
            <input style={inp} value={form.identificador_hrms} onChange={e => set("identificador_hrms", e.target.value)} placeholder="ej. EMP-00123" />
          </div>
          <div>
            <label style={lbl}>Enlace HRMS</label>
            <input style={inp} value={form.enlace_hrms} onChange={e => set("enlace_hrms", e.target.value)} placeholder="https://…" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
          <div>
            <label style={lbl}>Estado</label>
            <select style={inp} value={form.activo} onChange={e => set("activo", Number(e.target.value))}>
              <option value={1}>Activo</option>
              <option value={0}>Inactivo</option>
            </select>
          </div>
        </div>

        {sectionHdr("Empresas / Marcas — Puestos y supervisores")}
        <p style={{ fontFamily: B, fontSize: 11, color: COLORS.grayLight, marginBottom: 10 }}>
          Activa las entidades o marcas donde trabaja este colaborador. Para cada una puedes asignar puestos y supervisor.
        </p>
        <EntityAssignmentsEdit
          allEntities={allEntities}
          assignments={form.entity_assignments}
          onChange={ea => set("entity_assignments", ea)}
          positions={positions}
          collaborators={collaborators}
          currentCollabId={collab?.id}
        />

        {sectionHdr("Usuario del sistema (opcional)")}
        <div style={{ marginBottom: 8 }}>
          <label style={lbl}>Vincular con usuario</label>
          <select style={inp} value={form.user_id} onChange={e => set("user_id", e.target.value)}>
            <option value="">— Sin vincular —</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name ? `${u.name} (${u.email})` : u.email}</option>
            ))}
          </select>
        </div>
        {linkedUser && (
          <div style={{ marginBottom: 4 }}>
            <p style={{ fontFamily: B, fontSize: 11, color: COLORS.grayLight, marginBottom: 6 }}>
              Accesos del usuario vinculado:
            </p>
            <AccessMatrix tenants={linkedUser.tenants || []} />
          </div>
        )}

        {err && <p style={{ color: "#c62828", fontSize: 12, marginTop: 8, fontFamily: B }}>{err}</p>}

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

// ─── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({ collab, allEntities, canWrite, onEdit, onDelete }) {
  const color = avatarColor(collab.nombre + collab.apellidos);
  const puestosList = allPuestos(collab);

  const Field = ({ label, value, isLink }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontFamily: H, fontWeight: 700, color: COLORS.grayLight,
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{label}</div>
      {isLink && value
        ? <a href={value} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: B, fontSize: 13, color: COLORS.red }}>{value}</a>
        : <div style={{ fontFamily: B, fontSize: 13, color: COLORS.gray }}>{value || "—"}</div>
      }
    </div>
  );

  const sectionTitle = (t) => (
    <div style={{ fontFamily: H, fontWeight: 800, fontSize: 11, color: COLORS.grayLight,
      textTransform: "uppercase", letterSpacing: "0.07em",
      borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 6, marginBottom: 14, marginTop: 20,
    }}>{t}</div>
  );

  return (
    <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: color,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontFamily: H, fontWeight: 800, fontSize: 20, flexShrink: 0,
        }}>
          {initials(collab.nombre, collab.apellidos)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: H, fontWeight: 800, fontSize: 18, color: COLORS.gray }}>
            {collab.nombre} {collab.apellidos}
          </div>
          <div style={{ fontFamily: B, fontSize: 13, color: COLORS.grayLight, marginTop: 2 }}>
            {puestosList.map(p => p.nombre).join(", ") || "—"}
          </div>
        </div>
        <span style={{
          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontFamily: H, fontWeight: 700,
          background: collab.activo ? "#E8F5E9" : "#FFEBEE",
          color: collab.activo ? "#2E7D32" : "#C62828",
        }}>{collab.activo ? "Activo" : "Inactivo"}</span>
      </div>

      {/* Actions */}
      {canWrite && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={onEdit} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 16px", border: `1px solid ${COLORS.border}`,
            borderRadius: 6, background: COLORS.white, cursor: "pointer",
            fontFamily: H, fontWeight: 700, fontSize: 12, color: COLORS.gray,
          }}>Editar ficha</button>
          <button onClick={onDelete} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", border: "1px solid #FFCDD2",
            borderRadius: 6, background: "#FFF8F8", cursor: "pointer",
            fontFamily: H, fontWeight: 700, fontSize: 12, color: "#C62828",
          }}>Eliminar</button>
        </div>
      )}

      {sectionTitle("Datos personales")}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <Field label="Nombre"     value={collab.nombre} />
        <Field label="Apellidos"  value={collab.apellidos} />
        <Field label="ID HRMS"    value={collab.identificador_hrms} />
        <Field label="Enlace HRMS" value={collab.enlace_hrms} isLink />
      </div>

      {sectionTitle("Empresas / Marcas — Puestos y supervisores")}
      {(collab.entity_assignments || []).length === 0
        ? <p style={{ fontFamily: B, fontSize: 13, color: COLORS.grayLight }}>Sin asociaciones definidas.</p>
        : <EntityAssignmentsReadOnly allEntities={allEntities} assignments={collab.entity_assignments} />
      }

      {sectionTitle("Usuario del sistema")}
      {collab.user_id ? (
        <div>
          <div style={{ fontFamily: B, fontSize: 13, color: COLORS.gray, marginBottom: 10 }}>
            <strong>{collab.user_name || collab.user_email}</strong>
            {collab.user_name && <span style={{ color: COLORS.grayLight }}> · {collab.user_email}</span>}
          </div>
          <p style={{ fontFamily: B, fontSize: 11, color: COLORS.grayLight, marginBottom: 6 }}>
            Accesos totales ({collab.user_tenants.length}):
          </p>
          <AccessMatrix tenants={collab.user_tenants} />
        </div>
      ) : (
        <p style={{ fontFamily: B, fontSize: 13, color: COLORS.grayLight }}>Sin usuario del sistema vinculado.</p>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function EmpPerfil() {
  const perms    = useContext(PermissionsContext);
  const canWrite = (() => { const p = perms?.["v-perf"]; return p === undefined || p === "R/W"; })();

  const [collabs,      setCollabs]      = useState([]);
  const [positions,    setPositions]    = useState([]);
  const [allEntities,  setAllEntities]  = useState([]);
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState(null);
  const [search,       setSearch]       = useState("");
  const [filterActivo, setFilterActivo] = useState(1);   // 1 | 0 | null
  const [modal,        setModal]        = useState(null); // null | {} | { collab }
  const [toDelete,     setToDelete]     = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, pRes, eRes] = await Promise.all([
        apiFetch("/api/tal/collaborators"),
        apiFetch("/api/adm/positions"),
        apiFetch("/api/adm/structure"),
      ]);
      const cs = cRes.ok ? await cRes.json() : [];
      const ps = pRes.ok ? await pRes.json() : [];
      const es = eRes.ok ? await eRes.json() : [];
      setCollabs(Array.isArray(cs) ? cs : []);
      setPositions(Array.isArray(ps) ? ps : []);
      setAllEntities(Array.isArray(es) ? es.filter(e => e.tipo !== "Grupo") : []);
    } catch {}
    finally { setLoading(false); }
  };

  const loadUsers = async () => {
    if (!canWrite) return;
    try {
      const res = await apiFetch("/api/adm/users");
      if (res.ok) { const d = await res.json(); setUsers(Array.isArray(d) ? d : []); }
    } catch {}
  };

  useEffect(() => { load(); loadUsers(); }, []);

  const filtered = collabs.filter(c => {
    if (filterActivo !== null && c.activo !== filterActivo) return false;
    if (search) {
      const q = search.toLowerCase();
      const puestos = allPuestos(c);
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.apellidos.toLowerCase().includes(q) ||
        puestos.some(p => p.nombre.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSaved = (saved) => {
    setCollabs(prev => {
      const idx = prev.findIndex(c => c.id === saved.id);
      return idx >= 0 ? prev.map(c => c.id === saved.id ? saved : c) : [saved, ...prev];
    });
    if (selected?.id === saved.id) setSelected(saved);
    setModal(null);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await apiFetch(`/api/tal/collaborators/${toDelete.id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setCollabs(prev => prev.filter(c => c.id !== toDelete.id));
        if (selected?.id === toDelete.id) setSelected(null);
        setToDelete(null);
      }
    } catch {}
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.gray, fontFamily: H, margin: 0 }}>
            Ficha Colaborador
          </h1>
          <p style={{ color: COLORS.grayLight, fontSize: 13, fontFamily: B, margin: "4px 0 0" }}>
            Gestión del equipo humano y sus accesos
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
            Nuevo colaborador
          </button>
        )}
      </div>

      {/* Two-panel layout */}
      <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* Left: list */}
        <div style={{
          width: 280, flexShrink: 0, background: COLORS.white,
          borderRadius: 10, border: `1px solid ${COLORS.border}`,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ padding: "14px 14px 10px", borderBottom: `1px solid ${COLORS.border}` }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar…"
              style={{
                width: "100%", padding: "7px 10px", border: `1px solid ${COLORS.border}`,
                borderRadius: 6, fontFamily: B, fontSize: 12, color: COLORS.gray,
                background: COLORS.bg, boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {[{ label: "Activos", v: 1 }, { label: "Inactivos", v: 0 }, { label: "Todos", v: null }].map(opt => (
                <button key={String(opt.v)} onClick={() => setFilterActivo(opt.v)} style={{
                  flex: 1, padding: "4px 0", cursor: "pointer",
                  border: `1px solid ${filterActivo === opt.v ? COLORS.red : COLORS.border}`,
                  borderRadius: 5,
                  background: filterActivo === opt.v ? "#FFF0F0" : COLORS.white,
                  color: filterActivo === opt.v ? COLORS.red : COLORS.grayLight,
                  fontFamily: H, fontWeight: 700, fontSize: 10,
                }}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: "center", color: COLORS.grayLight, fontFamily: B, fontSize: 12 }}>Cargando…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: COLORS.grayLight, fontFamily: B, fontSize: 12 }}>
                {search ? "Sin resultados" : "No hay colaboradores"}
              </div>
            ) : filtered.map(c => {
              const isActive = selected?.id === c.id;
              const col = avatarColor(c.nombre + c.apellidos);
              const puestos = allPuestos(c);
              return (
                <button key={c.id} onClick={() => setSelected(c)} style={{
                  width: "100%", textAlign: "left", border: "none", cursor: "pointer",
                  padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
                  background: isActive ? "#FFF0F0" : "transparent",
                  borderLeft: isActive ? `3px solid ${COLORS.red}` : "3px solid transparent",
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", background: col, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontFamily: H, fontWeight: 700, fontSize: 13,
                  }}>{initials(c.nombre, c.apellidos)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: H, fontWeight: 700, fontSize: 13, color: COLORS.gray,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.nombre} {c.apellidos}
                    </div>
                    <div style={{ fontFamily: B, fontSize: 11, color: COLORS.grayLight,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {puestos.map(p => p.nombre).join(", ") || "Sin puesto"}
                    </div>
                  </div>
                  {!c.activo && (
                    <span style={{
                      marginLeft: "auto", fontSize: 10, fontFamily: H, fontWeight: 700,
                      color: "#C62828", background: "#FFEBEE", padding: "1px 6px", borderRadius: 8, flexShrink: 0,
                    }}>Inactivo</span>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ padding: "10px 14px", borderTop: `1px solid ${COLORS.border}`,
            fontFamily: B, fontSize: 11, color: COLORS.grayLight }}>
            {filtered.length} colaborador{filtered.length !== 1 ? "es" : ""}
          </div>
        </div>

        {/* Right: detail */}
        <div style={{
          flex: 1, background: COLORS.white, borderRadius: 10,
          border: `1px solid ${COLORS.border}`, overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>
          {selected ? (
            <DetailPanel
              collab={selected}
              allEntities={allEntities}
              canWrite={canWrite}
              onEdit={() => setModal({ collab: selected })}
              onDelete={() => setToDelete(selected)}
            />
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: COLORS.bg,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Icon name="talent" size={24} color={COLORS.border} />
              </div>
              <div style={{ fontFamily: H, fontWeight: 700, fontSize: 15, color: COLORS.gray, marginBottom: 6 }}>
                Selecciona un colaborador
              </div>
              <div style={{ fontFamily: B, fontSize: 13, color: COLORS.grayLight }}>
                Elige un colaborador de la lista para ver su ficha completa.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit modal */}
      {modal !== null && (
        <CollabModal
          collab={modal.collab || null}
          positions={positions}
          collaborators={collabs}
          users={users}
          allEntities={allEntities}
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
            background: COLORS.white, borderRadius: 10, padding: 28, width: 400,
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          }}>
            <p style={{ fontFamily: H, fontWeight: 700, color: COLORS.gray, marginBottom: 8 }}>
              ¿Eliminar colaborador?
            </p>
            <p style={{ fontFamily: B, fontSize: 13, color: COLORS.grayLight }}>
              Se desactivará la ficha de <strong>{toDelete.nombre} {toDelete.apellidos}</strong>.
              El usuario del sistema vinculado no se verá afectado.
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
