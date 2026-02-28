import { useState, useContext, useEffect } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, Badge, BtnPrimary } from "../../constants.jsx";
import { CompanyContext } from "../../App.jsx";

const ROLES    = ["IT", "Dirección", "Calidad", "Partners", "Managers", "Colaborador", "Auditor"];
const EMPRESAS = ["GMS", "GMP"];
const MARCAS   = ["EPUNTO", "LIQUID", "THE LIQUID FINANCE"];

const ROL_CFG = {
  "IT":          { bg: "#F3E5F5", color: "#6A1B9A" },
  "Dirección":   { bg: "#FFEBEE", color: "#C62828" },
  "Calidad":     { bg: "#E8F5E9", color: "#2E7D32" },
  "Partners":    { bg: "#E3F2FD", color: "#1565C0" },
  "Managers":    { bg: "#FFF3E0", color: "#E65100" },
  "Colaborador": { bg: "#F5F5F5", color: "#555555" },
  "Auditor":     { bg: "#E8EAF6", color: "#3949AB" },
};

// Backend UserAccessRead → frontend row
function fromApi(u) {
  return {
    id:      u.id,
    email:   u.email,
    nombre:  u.name ?? "—",
    estado:  u.activo === 1 ? "Activo" : "Inactivo",
    ultima:  u.last_login
      ? new Date(u.last_login).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
      : "—",
    // Role in the requested tenant context
    rol:     u.role     ?? "—",
    empresa: u.company_id ?? "—",
    marca:   u.brand_id   ?? "—",
    // All tenant assignments
    tenants: (u.tenants ?? []).map(t => ({
      id:         t.id,
      company_id: t.company_id,
      brand_id:   t.brand_id,
      role:       t.role,
      activo:     t.activo,
    })),
  };
}

// Frontend form → backend UserAccessCreate payload
function toApi(form) {
  const body = {
    email:   form.email.trim(),
    name:    form.nombre.trim() || null,
    activo:  form.estado === "Activo" ? 1 : 0,
    tenants: form.tenants,
  };
  if (form.password) body.password = form.password;
  return body;
}

const EMPTY_TENANT = (company, brand) => ({ company_id: company, brand_id: brand, role: "Colaborador", activo: 1 });
const EMPTY_FORM   = (company, brand) => ({
  email: "", nombre: "", password: "", estado: "Activo",
  tenants: [EMPTY_TENANT(company, brand)],
});

const inp = {
  padding: "7px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6,
  fontSize: 12, color: COLORS.gray, background: COLORS.white,
  outline: "none", boxSizing: "border-box", fontFamily: B, width: "100%",
};
const sel = { ...inp, appearance: "none" };
const lbl = {
  display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight,
  marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H,
};

export default function AdmUsers() {
  const { company, brand } = useContext(CompanyContext);

  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [apiError,   setApiError]   = useState(null);
  const [search,     setSearch]     = useState("");
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM(company, brand));
  const [formError,  setFormError]  = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [resetId,    setResetId]    = useState(null);
  const [resetSent,  setResetSent]  = useState(false);
  const [resetToken, setResetToken] = useState(null);

  // X-Tenant headers for every API call
  const tenantHeaders = {
    "X-Tenant-Company": company,
    "X-Tenant-Brand":   brand,
  };

  useEffect(() => { loadUsers(); }, [company, brand]);  // eslint-disable-line

  async function loadUsers() {
    setLoading(true);
    setApiError(null);
    try {
      const r = await fetch(
        `/api/adm/users?company_id=${encodeURIComponent(company)}&brand_id=${encodeURIComponent(brand)}`,
        { credentials: "include", headers: tenantHeaders },
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setUsers((await r.json()).map(fromApi));
    } catch (e) {
      setApiError("No se pudo conectar con el servidor: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  const visible      = users.filter(u => !search ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.nombre.toLowerCase().includes(search.toLowerCase())
  );
  const totalActivos = users.filter(u => u.estado === "Activo").length;

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM(company, brand));
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      email:   u.email,
      nombre:  u.nombre === "—" ? "" : u.nombre,
      password: "",
      estado:  u.estado,
      tenants: u.tenants.length > 0
        ? u.tenants.map(t => ({ company_id: t.company_id, brand_id: t.brand_id, role: t.role, activo: t.activo }))
        : [EMPTY_TENANT(company, brand)],
    });
    setFormError(null);
    setShowForm(true);
  };

  // Tenant list helpers
  const updateTenant = (i, key, val) => setForm(p => {
    const tenants = [...p.tenants];
    tenants[i] = { ...tenants[i], [key]: val };
    return { ...p, tenants };
  });
  const removeTenant = (i) => setForm(p => ({ ...p, tenants: p.tenants.filter((_, j) => j !== i) }));
  const addTenant    = ()  => setForm(p => ({ ...p, tenants: [...p.tenants, EMPTY_TENANT(company, brand)] }));

  const handleSave = async () => {
    if (!form.email.trim())        { setFormError("El email es obligatorio"); return; }
    if (!editing && !form.password.trim()) { setFormError("La contraseña es obligatoria para nuevos usuarios"); return; }
    if (form.tenants.length === 0) { setFormError("El usuario debe tener al menos un acceso asignado"); return; }
    setSaving(true);
    setFormError(null);
    try {
      const url    = editing ? `/api/adm/users/${editing.id}` : "/api/adm/users";
      const method = editing ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...tenantHeaders },
        body: JSON.stringify(toApi(form)),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${r.status}`);
      }
      setShowForm(false);
      await loadUsers();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(`¿Eliminar el usuario ${u.email}?`)) return;
    await fetch(`/api/adm/users/${u.id}`, {
      method: "DELETE", credentials: "include", headers: tenantHeaders,
    });
    setUsers(prev => prev.filter(x => x.id !== u.id));
  };

  const handleToggleEstado = async (u) => {
    const newActivo = u.estado === "Activo" ? 0 : 1;
    await fetch(`/api/adm/users/${u.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...tenantHeaders },
      body: JSON.stringify({
        email:   u.email,
        name:    u.nombre === "—" ? null : u.nombre,
        activo:  newActivo,
        tenants: u.tenants,
      }),
    });
    setUsers(prev => prev.map(x => x.id === u.id
      ? { ...x, estado: newActivo === 1 ? "Activo" : "Inactivo" }
      : x
    ));
  };

  const handleReset = async () => {
    const r = await fetch(`/api/adm/users/${resetId}/reset-password`, {
      method: "POST", credentials: "include", headers: tenantHeaders,
    });
    if (r.ok) {
      const data = await r.json();
      setResetToken(data.token ?? null);
      setResetSent(true);
    }
  };

  const closeReset = () => { setResetId(null); setResetSent(false); setResetToken(null); };
  const resetUser  = resetId ? users.find(u => u.id === resetId) : null;

  return (
    <div>
      <PageHeader
        title="Gestión de Usuarios On-premise"
        subtitle={`Usuarios con acceso a ${company} · ${brand} — Argon2id`}
        action={<BtnPrimary onClick={openNew}><Icon name="plus" size={14} color="#fff" /> Nuevo usuario</BtnPrimary>}
      />

      {/* Context banner */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#F8F0FF", borderRadius: 20, border: "1px solid #D1A8F0" }}>
          <Icon name="lock" size={12} color="#6A1B9A" />
          <span style={{ fontSize: 11, fontWeight: 800, color: "#6A1B9A", fontFamily: H }}>Filtro activo:</span>
          <span style={{ fontSize: 11, color: "#6A1B9A", fontFamily: B }}>{company} · {brand}</span>
        </div>
        {!loading && (
          <span style={{ fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>
            {totalActivos} usuario{totalActivos !== 1 ? "s" : ""} activos
          </span>
        )}
        <button onClick={loadUsers} title="Recargar" style={{ marginLeft: "auto", background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>
          <Icon name="refresh" size={12} color={COLORS.grayLight} /> Recargar
        </button>
      </div>

      {apiError && (
        <div style={{ marginBottom: 16, padding: "12px 16px", background: "#FFF0F0", border: "1px solid #F5CCCC", borderRadius: 8, fontSize: 13, color: COLORS.red, fontFamily: B }}>
          {apiError}
        </div>
      )}

      {/* ── Modal: new / edit ────────────────────────────────────────────────── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: COLORS.white, borderRadius: 12, width: 560, maxHeight: "90vh", overflowY: "auto", padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>
              {editing ? "Editar usuario" : "Nuevo usuario on-premise"}
            </h2>

            {/* Email + Nombre */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Email (login) *</label>
                <input style={inp} type="email" placeholder="usuario@gmiberia.com"
                  value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Nombre completo</label>
                <input style={inp} type="text" placeholder="Nombre y apellidos"
                  value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
              </div>
            </div>

            {/* Password + Estado */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={lbl}>{editing ? "Nueva contraseña (vacío = sin cambios)" : "Contraseña *"}</label>
                <input style={inp} type="password" placeholder="Mínimo 12 caracteres"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Estado de la cuenta</label>
                <select style={sel} value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            {/* ── Tenant list ────────────────────────────────────────────── */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <label style={{ ...lbl, margin: 0 }}>Accesos (empresa · marca · rol)</label>
                <button onClick={addTenant} style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: COLORS.gray, fontFamily: B, display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="plus" size={11} color={COLORS.gray} /> Añadir acceso
                </button>
              </div>

              {form.tenants.length === 0 && (
                <div style={{ padding: "12px 14px", background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 6, fontSize: 12, color: "#92400E", fontFamily: B }}>
                  Añade al menos un acceso para el usuario.
                </div>
              )}

              {form.tenants.map((t, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1.2fr auto", gap: 8, marginBottom: 8, alignItems: "center", padding: "10px 12px", background: "#FAFAFA", borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
                  <div>
                    <label style={{ ...lbl, marginBottom: 3 }}>Empresa</label>
                    <select style={sel} value={t.company_id} onChange={e => updateTenant(i, "company_id", e.target.value)}>
                      {EMPRESAS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...lbl, marginBottom: 3 }}>Marca</label>
                    <select style={sel} value={t.brand_id} onChange={e => updateTenant(i, "brand_id", e.target.value)}>
                      {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...lbl, marginBottom: 3 }}>Rol</label>
                    <select style={sel} value={t.role} onChange={e => updateTenant(i, "role", e.target.value)}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <button onClick={() => removeTenant(i)} title="Quitar acceso"
                    style={{ alignSelf: "flex-end", background: "none", border: "1px solid #FCC", borderRadius: 6, padding: "6px 9px", cursor: "pointer", marginBottom: 1 }}>
                    <Icon name="trash" size={12} color={COLORS.red} />
                  </button>
                </div>
              ))}
            </div>

            {formError && (
              <div style={{ marginBottom: 12, padding: "8px 12px", background: "#FFF0F0", border: "1px solid #F5CCCC", borderRadius: 6, fontSize: 13, color: COLORS.red, fontFamily: B }}>
                {formError}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "9px 18px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, color: COLORS.grayLight, fontFamily: B }}>Cancelar</button>
              <BtnPrimary onClick={handleSave} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset password modal ──────────────────────────────────────────── */}
      {resetId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: COLORS.white, borderRadius: 12, width: 420, padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Icon name="lock" size={20} color="#E65100" />
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>Restablecer contraseña</h2>
            {resetSent ? (
              <>
                <p style={{ fontSize: 13, color: "#2E7D32", fontFamily: B, margin: "0 0 12px" }}>
                  Token generado para <strong>{resetUser?.email}</strong>.
                </p>
                {resetToken && (
                  <div style={{ background: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontFamily: "monospace", fontSize: 12, wordBreak: "break-all", color: "#111" }}>
                    <span style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 4, fontFamily: H }}>TOKEN (DEV_MODE):</span>
                    {resetToken}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <BtnPrimary onClick={closeReset}>Cerrar</BtnPrimary>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: COLORS.grayLight, fontFamily: B, margin: "0 0 20px" }}>
                  Se generará un token de reset para <strong>{resetUser?.email}</strong>. Expira en 24 horas.
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={closeReset} style={{ padding: "9px 18px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, color: COLORS.grayLight, fontFamily: B }}>Cancelar</button>
                  <button onClick={handleReset} style={{ padding: "9px 20px", border: "none", borderRadius: 6, background: "#E65100", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: H, display: "flex", alignItems: "center", gap: 7 }}>
                    <Icon name="lock" size={14} color="#fff" /> Generar token
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <input
          placeholder="Buscar por email o nombre…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: "7px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 12, color: COLORS.gray, background: COLORS.white, outline: "none", fontFamily: B, width: 280 }}
        />
        {!loading && (
          <span style={{ fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>
            {visible.length} resultado{visible.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <Card style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: COLORS.grayLight, fontFamily: B }}>Cargando usuarios…</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAFA" }}>
                {["Email", "Nombre", "Rol en este contexto", "Accesos totales", "Estado", "Última conexión", "Acciones"].map(h => (
                  <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `2px solid ${COLORS.border}`, fontFamily: H, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((u, i) => {
                const rc      = ROL_CFG[u.rol] ?? { bg: "#EEE", color: "#555" };
                const inactivo = u.estado === "Inactivo";
                return (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FCFCFC", opacity: inactivo ? 0.65 : 1 }}>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: COLORS.gray, fontFamily: B }}>{u.email}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: COLORS.grayLight, fontFamily: B }}>{u.nombre}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <Badge label={u.rol} bg={rc.bg} color={rc.color} />
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {u.tenants.slice(0, 3).map((t, j) => {
                          const trc = ROL_CFG[t.role] ?? { bg: "#EEE", color: "#555" };
                          return (
                            <span key={j} title={`${t.company_id}·${t.brand_id}: ${t.role}`}
                              style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: trc.bg, color: trc.color, fontFamily: H, fontWeight: 800, border: `1px solid ${trc.color}22` }}>
                              {t.company_id}·{t.brand_id.slice(0, 3)}
                            </span>
                          );
                        })}
                        {u.tenants.length > 3 && (
                          <span style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: B, alignSelf: "center" }}>+{u.tenants.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <button onClick={() => handleToggleEstado(u)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <Badge label={u.estado} bg={inactivo ? "#F5F5F5" : "#E8F5E9"} color={inactivo ? "#AAA" : "#2E7D32"} />
                      </button>
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 11, color: COLORS.grayLight, fontFamily: "monospace", whiteSpace: "nowrap" }}>{u.ultima}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(u)} title="Editar" style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: "4px 9px", cursor: "pointer" }}>
                          <Icon name="edit" size={13} color={COLORS.grayLight} />
                        </button>
                        <button onClick={() => setResetId(u.id)} title="Reset password" style={{ background: "none", border: "1px solid #FFD8A8", borderRadius: 5, padding: "4px 9px", cursor: "pointer" }}>
                          <Icon name="lock" size={13} color="#E65100" />
                        </button>
                        <button onClick={() => handleDelete(u)} title="Eliminar" style={{ background: "none", border: "1px solid #FCC", borderRadius: 5, padding: "4px 9px", cursor: "pointer" }}>
                          <Icon name="trash" size={13} color={COLORS.red} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && visible.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: COLORS.grayLight, fontFamily: B }}>
            Sin usuarios con acceso a <strong>{company} · {brand}</strong>.
          </div>
        )}
      </Card>
    </div>
  );
}
