import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "";
const apiFetch = (url, opts = {}) =>
  fetch(`${API}${url}`, { credentials: "include", ...opts });

// ─── ROUTING ──────────────────────────────────────────────────────────────────
const ROUTE_MAP = {
  dashboard: "/",
  changelog: "/novedades",
  admin:     "/admin/usuarios",
  profile:   "/perfil",
};

const PATH_TO_ID = Object.fromEntries(
  Object.entries(ROUTE_MAP).map(([id, path]) => [path, id])
);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const COLORS = {
  red:       "#A91E22",
  redDark:   "#7A1518",
  gray:      "#3D3D3D",
  grayLight: "#6B6B6B",
  bg:        "#F4F4F4",
  white:     "#FFFFFF",
  border:    "#E2E2E2",
  sidebar:   "#1A1A1A",
};

const H = "'Nunito Sans','Avenir Next','Avenir','Trebuchet MS',sans-serif";
const B = "'Nunito Sans','Avenir Next','Avenir',system-ui,sans-serif";

const getInitials = (name) =>
  (name || "U").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

const ROLE_LABELS = { admin: "Admin", auditor: "Auditor", user: "Usuario" };

// ─── HOOKS ────────────────────────────────────────────────────────────────────
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

// ─── LOGO ────────────────────────────────────────────────────────────────────
const GmiLogo = () => (
  <img src="/logo.png" alt="GMI" style={{ width: "100%", display: "block", borderRadius: 4 }} />
);

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const d = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    changelog: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></>,
    admin:     <><circle cx="9" cy="7" r="4"/><path d="M3 21c0-4 2.7-7 6-7"/><rect x="14" y="13" width="7" height="6" rx="1"/><path d="M15 13v-1.5a2.5 2.5 0 0 1 5 0V13"/></>,
    profile:   <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>,
    plus:      <><path d="M12 5v14M5 12h14"/></>,
    edit:      <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash:     <><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    shield:    <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    check:     <><polyline points="20 6 9 17 4 12"/></>,
    search:    <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d[name]}
    </svg>
  );
};

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard",  icon: "dashboard" },
  { id: "changelog", label: "Novedades",  icon: "changelog" },
  { id: "admin",     label: "Usuarios",   icon: "admin",    adminOnly: true },
  { id: "profile",   label: "Mi Perfil",  icon: "profile" },
];

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const Sidebar = ({ user }) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const active    = PATH_TO_ID[location.pathname] ?? "dashboard";
  const [mini, setMini] = useState(() => localStorage.getItem("qms_sidebar_mini") === "1");

  const toggleMini = () => setMini(m => {
    const next = !m;
    localStorage.setItem("qms_sidebar_mini", next ? "1" : "0");
    return next;
  });

  const visibleNav = NAV.filter(item => !item.adminOnly || user?.role === "admin");

  const btnStyle = (on) => ({
    width: "100%", display: "flex", alignItems: "center",
    gap: mini ? 0 : 10,
    padding: mini ? "10px 0" : "10px 12px",
    justifyContent: mini ? "center" : "flex-start",
    marginBottom: 3, border: "none", cursor: "pointer", borderRadius: 6,
    background: on ? COLORS.red : "transparent",
    color: "#fff", fontFamily: H, fontSize: 14, fontWeight: on ? 700 : 500,
    transition: "all 0.15s",
  });

  return (
    <div style={{
      width: mini ? 56 : 224, minHeight: "100vh", background: COLORS.sidebar,
      display: "flex", flexDirection: "column", flexShrink: 0,
      transition: "width 0.2s ease", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: mini ? "14px 6px 12px" : "14px 14px 12px", borderBottom: "1px solid #2A2A2A" }}>
        <div style={{ display: "flex", alignItems: "center", gap: mini ? 0 : 10, justifyContent: mini ? "center" : "flex-start" }}>
          <div style={{ width: 44, flexShrink: 0 }}><GmiLogo /></div>
          {!mini && (
            <div style={{ fontSize: 9, color: "#fff", letterSpacing: "0.11em", textTransform: "uppercase", fontFamily: H, fontWeight: 800, lineHeight: 1.35, flex: 1 }}>
              Quality<br />Management<br />System
            </div>
          )}
          <button onClick={toggleMini} title={mini ? "Expandir" : "Colapsar"}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", opacity: 0.6 }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: mini ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: mini ? "12px 4px" : "12px 9px" }}>
        {visibleNav.map(item => {
          const on = active === item.id;
          return (
            <button key={item.id} onClick={() => navigate(ROUTE_MAP[item.id])}
              title={mini ? item.label : undefined}
              style={btnStyle(on)}
              onMouseEnter={e => { if (!on) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}>
              <Icon name={item.icon} size={16} color="#fff" />
              {!mini && item.label}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      {!mini && (
        <div style={{ padding: "12px 9px", borderTop: "1px solid #2A2A2A" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: COLORS.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0, fontFamily: H }}>
              {getInitials(user?.name || user?.email || "U")}
            </div>
            <div>
              <div style={{ color: "#DDD", fontSize: 12, fontWeight: 700, fontFamily: H }}>{user?.name || user?.email}</div>
              <div style={{ color: "#555", fontSize: 10, fontFamily: B }}>{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: "Dashboard",
  changelog: "Novedades",
  admin:     "Gestión de Usuarios",
  profile:   "Mi Perfil",
};

const TopBar = ({ user }) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const active    = PATH_TO_ID[location.pathname] ?? "dashboard";
  const displayName = user?.name || user?.email || "Usuario";

  return (
    <div style={{
      background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`,
      padding: "0 30px", height: 52,
      display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
    }}>
      <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>
        {PAGE_TITLES[active] || ""}
      </span>
      <button onClick={() => navigate(ROUTE_MAP.profile)}
        style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: `1px solid transparent`, cursor: "pointer", padding: "5px 10px 5px 6px", borderRadius: 8 }}
        onMouseEnter={e => { e.currentTarget.style.background = "#F5F5F5"; e.currentTarget.style.borderColor = COLORS.border; }}
        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: COLORS.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", fontFamily: H }}>
          {getInitials(displayName)}
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray, fontFamily: H, lineHeight: 1.3 }}>{displayName}</div>
          <div style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: B }}>{ROLE_LABELS[user?.role] || ""}</div>
        </div>
      </button>
    </div>
  );
};

// ─── METRIC CARD ─────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, sub, icon, accentBg }) => (
  <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "18px 20px", flex: 1, minWidth: 165 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 10, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 5, fontWeight: 800, fontFamily: H }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: "#AAA", marginTop: 3, fontFamily: B }}>{sub}</div>}
      </div>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: accentBg || "#F5E6E6", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={16} color={COLORS.red} />
      </div>
    </div>
  </div>
);

// ─── APP FOOTER ───────────────────────────────────────────────────────────────
const _appVersion = "0.1.0";
const _buildDate  = import.meta.env.BUILD_DATE
  ? new Date(import.meta.env.BUILD_DATE).toLocaleString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
  : "—";
const _appRev = import.meta.env.VITE_GIT_COMMIT ?? "dev";

const AppFooter = () => {
  const navigate = useNavigate();
  return (
    <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "9px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.bg, flexShrink: 0 }}>
      <span style={{ fontSize: 10, color: "#B0B0B0", fontFamily: B }}>
        <strong style={{ color: "#999", letterSpacing: "0.04em", fontFamily: H }}>GMI Quality Management System</strong>
      </span>
      <button onClick={() => navigate(ROUTE_MAP.changelog)}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#C0C0C0", fontFamily: "monospace", letterSpacing: "0.04em", padding: 0 }}>
        v{_appVersion}&nbsp;&nbsp;·&nbsp;&nbsp;rev {_appRev}&nbsp;&nbsp;·&nbsp;&nbsp;build {_buildDate}
      </button>
    </div>
  );
};

// ─── PAGES ────────────────────────────────────────────────────────────────────

// Dashboard
const Dashboard = ({ user }) => (
  <div>
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.gray, fontFamily: H, margin: 0 }}>Dashboard</h1>
      <p style={{ color: COLORS.grayLight, marginTop: 4, fontSize: 14, fontFamily: B }}>
        Bienvenido al GMI Quality Management System
      </p>
    </div>
    <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
      <MetricCard label="Módulos Activos"   value="—" sub="próximamente" icon="check"   accentBg="#E8F5E9" />
      <MetricCard label="Procesos"          value="—" sub="próximamente" icon="shield"  accentBg="#F5E6E6" />
      <MetricCard label="Auditorías"        value="—" sub="próximamente" icon="search"  accentBg="#E3F2FD" />
      <MetricCard label="Usuarios Activos"  value="—" sub="próximamente" icon="profile" accentBg="#FFF3E0" />
    </div>
    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "28px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🚀</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.gray, fontFamily: H, marginBottom: 8 }}>Sistema en construcción</div>
      <div style={{ fontSize: 13, color: COLORS.grayLight, fontFamily: B }}>Los módulos del QMS se irán añadiendo progresivamente.</div>
    </div>
  </div>
);

// Novedades / Changelog
const CHANGELOG = [
  {
    version: "0.1.0",
    date: "2026-02-27",
    changes: [
      "Lanzamiento inicial del GMI Quality Management System",
      "Autenticación SSO via OneLogin SAML 2.0",
      "Panel de administración de usuarios con roles: Admin, Auditor, Usuario",
      "Sistema de novedades y registro de versiones",
    ],
  },
];

const ReleaseNotes = () => (
  <div>
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.gray, fontFamily: H, margin: 0 }}>Novedades</h1>
      <p style={{ color: COLORS.grayLight, marginTop: 4, fontSize: 14, fontFamily: B }}>Historial de versiones y cambios</p>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {CHANGELOG.map((release, i) => (
        <div key={release.version} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "14px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12, background: i === 0 ? "#FFF8F8" : COLORS.white }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: i === 0 ? COLORS.red : COLORS.gray, fontFamily: H }}>
              v{release.version}
            </div>
            {i === 0 && (
              <div style={{ fontSize: 10, fontWeight: 800, background: COLORS.red, color: "#fff", borderRadius: 4, padding: "2px 7px", fontFamily: H, letterSpacing: "0.06em" }}>
                ACTUAL
              </div>
            )}
            <div style={{ fontSize: 12, color: COLORS.grayLight, fontFamily: B, marginLeft: "auto" }}>
              {release.date}
            </div>
          </div>
          <ul style={{ margin: 0, padding: "14px 24px 16px 40px", display: "flex", flexDirection: "column", gap: 7 }}>
            {release.changes.map((c, j) => (
              <li key={j} style={{ fontSize: 13, color: COLORS.gray, fontFamily: B, lineHeight: 1.5 }}>{c}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
);

// Admin – User Management
const AdminUsers = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({ email: "", name: "", role: "user" });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  const load = () => {
    setLoading(true);
    apiFetch("/api/admin/users")
      .then(r => r.json())
      .then(data => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ email: "", name: "", role: "user" }); setError(null); setShowForm(true); };
  const openEdit = (u) => { setEditing(u); setForm({ email: u.email, name: u.name || "", role: u.role }); setError(null); setShowForm(true); };

  const handleSave = async () => {
    if (!form.email.trim()) { setError("El email es obligatorio"); return; }
    setSaving(true); setError(null);
    const url    = editing ? `/api/admin/users/${editing.id}` : "/api/admin/users";
    const method = editing ? "PUT" : "POST";
    const r = await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!r.ok) { const e = await r.json().catch(() => ({})); setError(e.detail || "Error al guardar"); setSaving(false); return; }
    setSaving(false); setShowForm(false); load();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
    load();
  };

  const inp = { width: "100%", padding: "8px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, color: COLORS.gray, background: COLORS.white, outline: "none", boxSizing: "border-box", fontFamily: B };
  const ROLE_COLORS = { admin: { bg: "#F5E6E6", text: COLORS.red }, auditor: { bg: "#E3F2FD", text: "#1565C0" }, user: { bg: "#F0F4F0", text: "#2E7D32" } };

  return (
    <div>
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: COLORS.white, borderRadius: 10, width: 440, padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>
              {editing ? "Editar usuario" : "Nuevo usuario"}
            </h2>
            {[
              { label: "Email *", key: "email", type: "email", placeholder: "usuario@gmiberia.com" },
              { label: "Nombre", key: "name",  type: "text",  placeholder: "Nombre completo" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>{f.label}</label>
                <input style={inp} type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>Rol</label>
              <select style={{ ...inp, appearance: "none" }} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="admin">Admin</option>
                <option value="auditor">Auditor</option>
                <option value="user">Usuario</option>
              </select>
            </div>
            {error && <div style={{ marginBottom: 12, padding: "8px 12px", background: "#FFF0F0", border: "1px solid #F5CCCC", borderRadius: 6, fontSize: 13, color: COLORS.red, fontFamily: B }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "9px 18px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, color: COLORS.grayLight, fontFamily: B }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: "9px 20px", border: "none", borderRadius: 6, background: saving ? "#CCC" : COLORS.red, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 800, fontFamily: H }}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.gray, fontFamily: H, margin: 0 }}>Usuarios</h1>
          <p style={{ color: COLORS.grayLight, marginTop: 4, fontSize: 14, fontFamily: B }}>{users.length} usuarios con acceso al sistema</p>
        </div>
        <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 17px", background: COLORS.red, border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 13, fontFamily: H }}>
          <Icon name="plus" size={15} color="#fff" /> Nuevo usuario
        </button>
      </div>

      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 34, textAlign: "center", color: COLORS.grayLight, fontSize: 14, fontFamily: B }}>Cargando...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 34, textAlign: "center", color: COLORS.grayLight, fontSize: 14, fontFamily: B }}>No hay usuarios. Añade el primero.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9F9F9" }}>
                {["Email", "Nombre", "Rol", "Acciones"].map(h => (
                  <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `2px solid ${COLORS.border}`, fontFamily: H, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const rc = ROLE_COLORS[u.role] || { bg: "#EEE", text: "#555" };
                return (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FCFCFC" }}>
                    <td style={{ padding: "11px 18px", fontSize: 13, color: COLORS.gray, fontFamily: B }}>{u.email}</td>
                    <td style={{ padding: "11px 18px", fontSize: 13, color: COLORS.grayLight, fontFamily: B }}>{u.name || "—"}</td>
                    <td style={{ padding: "11px 18px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, background: rc.bg, color: rc.text, fontSize: 11, fontWeight: 800, fontFamily: H }}>{ROLE_LABELS[u.role] || u.role}</span>
                    </td>
                    <td style={{ padding: "11px 18px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(u)} style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: "4px 9px", cursor: "pointer" }}>
                          <Icon name="edit" size={13} color={COLORS.grayLight} />
                        </button>
                        <button onClick={() => handleDelete(u.id)} style={{ background: "none", border: "1px solid #FCC", borderRadius: 5, padding: "4px 9px", cursor: "pointer" }}>
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
      </div>
    </div>
  );
};

// Profile
const Profile = ({ user }) => {
  const ROLE_COLORS = { admin: { bg: "#F5E6E6", text: COLORS.red }, auditor: { bg: "#E3F2FD", text: "#1565C0" }, user: { bg: "#F0F4F0", text: "#2E7D32" } };
  const Row = ({ label, value, mono }) => (
    <div style={{ display: "flex", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
      <div style={{ width: 160, flexShrink: 0, fontSize: 10, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.07em", paddingTop: 2, fontFamily: H }}>{label}</div>
      <div style={{ fontSize: 13, color: COLORS.gray, fontFamily: mono ? "monospace" : B, fontWeight: mono ? 600 : 400 }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.gray, fontFamily: H, margin: 0 }}>Mi Perfil</h1>
        <p style={{ color: COLORS.grayLight, marginTop: 4, fontSize: 14, fontFamily: B }}>Datos de identidad y acceso via SSO</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", background: `linear-gradient(135deg,${COLORS.red},${COLORS.redDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: H }}>
              {getInitials(user?.name || user?.email || "U")}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{user?.name || "—"}</div>
              <div style={{ fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>Quality Management System</div>
            </div>
          </div>
          <Row label="User ID" value={user?.user_id || "—"} mono />
          <Row label="Email"   value={user?.email   || "—"} />
        </div>

        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
            <Icon name="shield" size={16} color={COLORS.red} />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>Autenticación SSO</h3>
          </div>
          <div style={{ background: "#1A1A1A", borderRadius: 8, padding: 14, marginBottom: 16, fontFamily: "monospace", fontSize: 12, lineHeight: 1.75 }}>
            <div style={{ color: "#555", marginBottom: 4 }}>// SAML 2.0 Attributes</div>
            <div><span style={{ color: "#61DAFB" }}>userID: </span><span style={{ color: "#FFF" }}>"{user?.user_id}"</span></div>
            <div><span style={{ color: "#61DAFB" }}>email: </span><span style={{ color: "#FFF" }}>"{user?.email}"</span></div>
            <div><span style={{ color: "#61DAFB" }}>role: </span><span style={{ color: "#A8FF78" }}>"{user?.role}"</span></div>
          </div>
          <div>
            {user?.role && (() => {
              const c = ROLE_COLORS[user.role] || { bg: "#EEE", text: "#555" };
              return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, background: c.bg, color: c.text, fontSize: 11, fontWeight: 800, fontFamily: H }}>{ROLE_LABELS[user.role] || user.role}</span>;
            })()}
          </div>
        </div>
      </div>
      <div style={{ background: "#FFF8F8", border: "1px solid #F5CCCC", borderRadius: 10, padding: "12px 16px", marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name="shield" size={14} color={COLORS.red} />
        <span style={{ fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>
          Sesión gestionada por <strong style={{ color: COLORS.gray }}>OneLogin SAML 2.0</strong>. Los datos provienen directamente del Identity Provider.
        </span>
      </div>
    </div>
  );
};

// Not Found
const NotFound = () => (
  <div style={{ textAlign: "center", paddingTop: 80 }}>
    <div style={{ fontSize: 48, fontWeight: 800, color: COLORS.red, fontFamily: H }}>404</div>
    <div style={{ fontSize: 16, color: COLORS.grayLight, fontFamily: B, marginTop: 8 }}>Página no encontrada</div>
  </div>
);

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
const Layout = ({ user }) => (
  <div style={{ display: "flex", minHeight: "100vh" }}>
    <Sidebar user={user} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <TopBar user={user} />
      <main style={{ flex: 1, padding: "28px 30px", overflow: "auto" }}>
        <Routes>
          <Route path="/"            element={<Dashboard user={user} />} />
          <Route path="/novedades"   element={<ReleaseNotes />} />
          <Route path="/admin/usuarios" element={<AdminUsers />} />
          <Route path="/perfil"      element={<Profile user={user} />} />
          <Route path="*"            element={<NotFound />} />
        </Routes>
      </main>
      <AppFooter />
    </div>
  </div>
);

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F4F4F4" }}>
      <div style={{ color: COLORS.red, fontFamily: "Nunito Sans, sans-serif", fontSize: 18 }}>Cargando...</div>
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
        `}</style>
        <Layout user={user} />
      </>
    </BrowserRouter>
  );
}
