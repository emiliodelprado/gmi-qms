import { useState, useEffect, createContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { COLORS, H, B, apiFetch, getInitials, ROLE_LABELS, Icon } from "./constants.jsx";

import Sidebar    from "./components/Sidebar.jsx";
import TopBar     from "./components/TopBar.jsx";
import AppFooter  from "./components/AppFooter.jsx";

// EST
import DashEjecutivo  from "./pages/est/DashEjecutivo.jsx";
import DashObjetivos  from "./pages/est/DashObjetivos.jsx";
import ContDafo       from "./pages/est/ContDafo.jsx";
import ContPartes     from "./pages/est/ContPartes.jsx";
// RSG
import EvalCalculadora from "./pages/rsg/EvalCalculadora.jsx";
import TratPlan        from "./pages/rsg/TratPlan.jsx";
// OPE
import ComOfertas      from "./pages/ope/ComOfertas.jsx";
import PrjEntregables  from "./pages/ope/PrjEntregables.jsx";
// TAL
import EmpPerfil       from "./pages/tal/EmpPerfil.jsx";
import OnbChecklist    from "./pages/tal/OnbChecklist.jsx";
// SOP
import DocMaestro      from "./pages/sop/DocMaestro.jsx";
import DocProcesos     from "./pages/sop/DocProcesos.jsx";
import InfInventario   from "./pages/sop/InfInventario.jsx";
// MEJ
import NcGestion       from "./pages/mej/NcGestion.jsx";
import EtiCanal        from "./pages/mej/EtiCanal.jsx";

// ─── Context ──────────────────────────────────────────────────────────────────
export const CompanyContext = createContext({ company: "GMS", brand: "EPUNTO", setCompany: () => {}, setBrand: () => {} });

// ─── Auth hook ────────────────────────────────────────────────────────────────
function useAuth() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiFetch("/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => { setUser(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  return { user, loading };
}

// ─── Admin Users (keeping existing) ──────────────────────────────────────────
const AdminUsers = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({ email: "", name: "", role: "user" });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  const inp = { width: "100%", padding: "8px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, color: COLORS.gray, background: COLORS.white, outline: "none", boxSizing: "border-box", fontFamily: B };
  const ROLE_COLORS = { admin: { bg: "#F5E6E6", text: COLORS.red }, auditor: { bg: "#E3F2FD", text: "#1565C0" }, user: { bg: "#F0F4F0", text: "#2E7D32" } };

  const load = () => {
    setLoading(true);
    apiFetch("/api/admin/users").then(r => r.json()).then(data => { setUsers(data); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setEditing(null); setForm({ email: "", name: "", role: "user" }); setError(null); setShowForm(true); };
  const openEdit = (u) => { setEditing(u); setForm({ email: u.email, name: u.name || "", role: u.role }); setError(null); setShowForm(true); };

  const handleSave = async () => {
    if (!form.email.trim()) { setError("El email es obligatorio"); return; }
    setSaving(true); setError(null);
    const url = editing ? `/api/admin/users/${editing.id}` : "/api/admin/users";
    const method = editing ? "PUT" : "POST";
    const r = await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!r.ok) { const e = await r.json().catch(() => ({})); setError(e.detail || "Error"); setSaving(false); return; }
    setSaving(false); setShowForm(false); load();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: COLORS.white, borderRadius: 10, width: 440, padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{editing ? "Editar usuario" : "Nuevo usuario"}</h2>
            {[{ label: "Email *", key: "email", type: "email", placeholder: "usuario@gmiberia.com" }, { label: "Nombre", key: "name", type: "text", placeholder: "Nombre completo" }].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>{f.label}</label>
                <input style={inp} type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>Rol</label>
              <select style={{ ...inp, appearance: "none" }} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="admin">Admin</option><option value="auditor">Auditor</option><option value="user">Usuario</option>
              </select>
            </div>
            {error && <div style={{ marginBottom: 12, padding: "8px 12px", background: "#FFF0F0", border: "1px solid #F5CCCC", borderRadius: 6, fontSize: 13, color: COLORS.red, fontFamily: B }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "9px 18px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, color: COLORS.grayLight, fontFamily: B }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: "9px 20px", border: "none", borderRadius: 6, background: saving ? "#CCC" : COLORS.red, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 800, fontFamily: H }}>{saving ? "Guardando..." : "Guardar"}</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.gray, fontFamily: H, margin: 0 }}>Usuarios</h1>
          <p style={{ color: COLORS.grayLight, marginTop: 4, fontSize: 13, fontFamily: B }}>{users.length} usuarios con acceso al sistema</p>
        </div>
        <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 17px", background: COLORS.red, border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 13, fontFamily: H }}>
          <Icon name="plus" size={15} color="#fff" /> Nuevo usuario
        </button>
      </div>
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 34, textAlign: "center", color: COLORS.grayLight, fontFamily: B }}>Cargando...</div> : users.length === 0 ? <div style={{ padding: 34, textAlign: "center", color: COLORS.grayLight, fontFamily: B }}>No hay usuarios.</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#F9F9F9" }}>
              {["Email","Nombre","Rol","Acciones"].map(h => <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `2px solid ${COLORS.border}`, fontFamily: H, whiteSpace: "nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {users.map((u, i) => {
                const rc = ROLE_COLORS[u.role] || { bg: "#EEE", text: "#555" };
                return <tr key={u.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FCFCFC" }}>
                  <td style={{ padding: "11px 18px", fontSize: 13, color: COLORS.gray, fontFamily: B }}>{u.email}</td>
                  <td style={{ padding: "11px 18px", fontSize: 13, color: COLORS.grayLight, fontFamily: B }}>{u.name || "—"}</td>
                  <td style={{ padding: "11px 18px" }}><span style={{ padding: "3px 10px", borderRadius: 20, background: rc.bg, color: rc.text, fontSize: 11, fontWeight: 800, fontFamily: H }}>{ROLE_LABELS[u.role] || u.role}</span></td>
                  <td style={{ padding: "11px 18px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(u)} style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: "4px 9px", cursor: "pointer" }}><Icon name="edit" size={13} color={COLORS.grayLight} /></button>
                      <button onClick={() => handleDelete(u.id)} style={{ background: "none", border: "1px solid #FCC", borderRadius: 5, padding: "4px 9px", cursor: "pointer" }}><Icon name="trash" size={13} color={COLORS.red} /></button>
                    </div>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ─── Profile page ─────────────────────────────────────────────────────────────
const Profile = ({ user }) => {
  const ROLE_COLORS = { admin: { bg: "#F5E6E6", text: COLORS.red }, auditor: { bg: "#E3F2FD", text: "#1565C0" }, user: { bg: "#F0F4F0", text: "#2E7D32" } };
  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.gray, fontFamily: H, margin: 0 }}>Mi Perfil</h1>
        <p style={{ color: COLORS.grayLight, marginTop: 4, fontSize: 13, fontFamily: B }}>Identidad y acceso via SSO</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", background: `linear-gradient(135deg,${COLORS.red},${COLORS.redDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: H }}>{getInitials(user?.name || user?.email || "U")}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{user?.name || "—"}</div>
              <div style={{ fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>Quality Management System</div>
            </div>
          </div>
          {[["User ID", user?.user_id || "—"], ["Email", user?.email || "—"]].map(([l,v]) => (
            <div key={l} style={{ display: "flex", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ width: 120, fontSize: 10, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>{l}</div>
              <div style={{ fontSize: 13, color: COLORS.gray, fontFamily: B }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 22 }}>
          <div style={{ background: "#1A1A1A", borderRadius: 8, padding: 14, fontFamily: "monospace", fontSize: 12, lineHeight: 1.75 }}>
            <div style={{ color: "#555", marginBottom: 4 }}>{"// SAML 2.0 Attributes"}</div>
            <div><span style={{ color: "#61DAFB" }}>userID: </span><span style={{ color: "#FFF" }}>"{user?.user_id}"</span></div>
            <div><span style={{ color: "#61DAFB" }}>email: </span><span style={{ color: "#FFF" }}>"{user?.email}"</span></div>
            <div><span style={{ color: "#61DAFB" }}>role: </span><span style={{ color: "#A8FF78" }}>"{user?.role}"</span></div>
          </div>
          {user?.role && (() => { const c = ROLE_COLORS[user.role] || { bg: "#EEE", text: "#555" }; return <span style={{ display: "inline-block", marginTop: 12, padding: "3px 10px", borderRadius: 20, background: c.bg, color: c.text, fontSize: 11, fontWeight: 800, fontFamily: H }}>{ROLE_LABELS[user.role] || user.role}</span>; })()}
        </div>
      </div>
    </div>
  );
};

// ─── Changelog ────────────────────────────────────────────────────────────────
const CHANGELOG = [
  { version: "0.1.0", date: "2026-02-27", changes: ["Lanzamiento inicial del GMI Quality Management System", "Autenticación SSO via OneLogin SAML 2.0", "Panel de administración de usuarios con roles", "Sistema de novedades", "Módulos EST, RSG, OPE, TAL, SOP, MEJ con 14 pantallas"] },
];
const ReleaseNotes = () => (
  <div>
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.gray, fontFamily: H, margin: 0 }}>Novedades</h1>
      <p style={{ color: COLORS.grayLight, marginTop: 4, fontSize: 13, fontFamily: B }}>Historial de versiones y cambios</p>
    </div>
    {CHANGELOG.map((r, i) => (
      <div key={r.version} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12, background: i === 0 ? "#FFF8F8" : COLORS.white }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: i === 0 ? COLORS.red : COLORS.gray, fontFamily: H }}>v{r.version}</div>
          {i === 0 && <span style={{ fontSize: 10, fontWeight: 800, background: COLORS.red, color: "#fff", borderRadius: 4, padding: "2px 7px", fontFamily: H }}>ACTUAL</span>}
          <div style={{ fontSize: 12, color: COLORS.grayLight, fontFamily: B, marginLeft: "auto" }}>{r.date}</div>
        </div>
        <ul style={{ margin: 0, padding: "14px 24px 16px 40px" }}>
          {r.changes.map((c, j) => <li key={j} style={{ fontSize: 13, color: COLORS.gray, fontFamily: B, lineHeight: 1.6, marginBottom: 4 }}>{c}</li>)}
        </ul>
      </div>
    ))}
  </div>
);

// ─── Layout ───────────────────────────────────────────────────────────────────
const Layout = ({ user }) => {
  const [company, setCompany] = useState("GMS");
  const [brand,   setBrand]   = useState("EPUNTO");

  return (
    <CompanyContext.Provider value={{ company, brand, setCompany, setBrand }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar user={user} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <TopBar user={user} company={company} brand={brand} setCompany={setCompany} setBrand={setBrand} />
          <main style={{ flex: 1, padding: "28px 30px", overflow: "auto", background: COLORS.bg }}>
            <Routes>
              <Route path="/"                  element={<Navigate to="/est/dash/v-exe" replace />} />
              <Route path="/est/dash/v-exe"    element={<DashEjecutivo />} />
              <Route path="/est/dash/v-obj"    element={<DashObjetivos />} />
              <Route path="/est/cont/v-dafo"   element={<ContDafo />} />
              <Route path="/est/cont/v-part"   element={<ContPartes />} />
              <Route path="/rsg/evar/v-calc"   element={<EvalCalculadora />} />
              <Route path="/rsg/trat/v-plan"   element={<TratPlan />} />
              <Route path="/ope/com/v-oft"     element={<ComOfertas />} />
              <Route path="/ope/prj/v-ent"     element={<PrjEntregables />} />
              <Route path="/tal/emp/v-perf"    element={<EmpPerfil />} />
              <Route path="/tal/onb/v-chck"    element={<OnbChecklist />} />
              <Route path="/sop/doc/v-maes"    element={<DocMaestro />} />
              <Route path="/sop/doc/v-proc"    element={<DocProcesos />} />
              <Route path="/sop/inf/v-inv"     element={<InfInventario />} />
              <Route path="/mej/nc/v-nc"       element={<NcGestion />} />
              <Route path="/mej/eti/v-canal"   element={<EtiCanal />} />
              <Route path="/admin/usuarios"    element={<AdminUsers />} />
              <Route path="/perfil"            element={<Profile user={user} />} />
              <Route path="/novedades"         element={<ReleaseNotes />} />
            </Routes>
          </main>
          <AppFooter />
        </div>
      </div>
    </CompanyContext.Provider>
  );
};

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F4F4F4" }}>
      <div style={{ color: COLORS.red, fontFamily: "'Nunito Sans', sans-serif", fontSize: 18, fontWeight: 800 }}>Cargando…</div>
    </div>
  );

  if (!user) {
    if (window.location.pathname !== "/auth/login") window.location.href = "/auth/login";
    return null;
  }

  return (
    <BrowserRouter>
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,400;0,6..12,500;0,6..12,600;0,6..12,700;0,6..12,800&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Nunito Sans','Avenir Next','Avenir',system-ui,sans-serif; background: ${COLORS.bg}; }
          button:focus { outline: 2px solid ${COLORS.red}; outline-offset: 2px; }
          input:focus, select:focus, textarea:focus { border-color: ${COLORS.red} !important; box-shadow: 0 0 0 3px rgba(169,30,34,0.12); }
          ::-webkit-scrollbar { width: 5px; height: 5px; }
          ::-webkit-scrollbar-track { background: #F0F0F0; }
          ::-webkit-scrollbar-thumb { background: #CCC; border-radius: 3px; }
          input[type="range"]::-webkit-slider-thumb { width: 18px; height: 18px; }
        `}</style>
        <Layout user={user} />
      </>
    </BrowserRouter>
  );
}
