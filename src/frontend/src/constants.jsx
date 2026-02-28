// ─── Shared constants, utilities and base components ─────────────────────────

export const COLORS = {
  red:       "#A91E22",
  redDark:   "#7A1518",
  gray:      "#3D3D3D",
  grayLight: "#6B6B6B",
  bg:        "#F4F4F4",
  white:     "#FFFFFF",
  border:    "#E2E2E2",
  sidebar:   "#ac2523",
};

export const H = "'Nunito Sans','Avenir Next','Avenir','Trebuchet MS',sans-serif";
export const B = "'Nunito Sans','Avenir Next','Avenir',system-ui,sans-serif";

export const API = import.meta.env.VITE_API_URL ?? "";
export const apiFetch = (url, opts = {}) =>
  fetch(`${API}${url}`, { credentials: "include", ...opts });

export const getInitials = (name) =>
  (name || "U").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

export const ROLE_LABELS = { admin: "Admin", auditor: "Auditor", user: "Usuario" };

// ─── Icon component ───────────────────────────────────────────────────────────
export const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const d = {
    dashboard:    <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    changelog:    <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></>,
    admin:        <><circle cx="9" cy="7" r="4"/><path d="M3 21c0-4 2.7-7 6-7"/><rect x="14" y="13" width="7" height="6" rx="1"/><path d="M15 13v-1.5a2.5 2.5 0 0 1 5 0V13"/></>,
    profile:      <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>,
    plus:         <><path d="M12 5v14M5 12h14"/></>,
    edit:         <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash:        <><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    shield:       <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    check:        <><polyline points="20 6 9 17 4 12"/></>,
    search:       <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></>,
    strategy:     <><path d="M2 20h20M6 20V10l6-8 6 8v10"/><path d="M12 20v-6"/></>,
    risk:         <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    operations:   <><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></>,
    talent:       <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    support:      <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
    improve:      <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    chevron:      <><polyline points="9 18 15 12 9 6"/></>,
    folder:       <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>,
    monitor:      <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
    warning:      <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    lock:         <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    eye:          <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    arrowLeft:    <><polyline points="15 18 9 12 15 6"/></>,
    arrowRight:   <><polyline points="9 18 15 12 9 6"/></>,
    x:            <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    kanban:       <><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="8" rx="1"/></>,
    briefcase:    <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></>,
    clock:        <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    upload:       <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    chart:        <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {d[name] ?? null}
    </svg>
  );
};

// ─── Page header helper ───────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, action }) => (
  <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.gray, fontFamily: H, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ color: COLORS.grayLight, marginTop: 4, fontSize: 13, fontFamily: B }}>{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ─── Badge component ──────────────────────────────────────────────────────────
export const Badge = ({ label, bg, color }) => (
  <span style={{ padding: "3px 10px", borderRadius: 20, background: bg, color, fontSize: 11, fontWeight: 800, fontFamily: H, whiteSpace: "nowrap" }}>
    {label}
  </span>
);

// ─── Card wrapper ─────────────────────────────────────────────────────────────
export const Card = ({ children, style = {} }) => (
  <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, ...style }}>
    {children}
  </div>
);

// ─── Primary button ───────────────────────────────────────────────────────────
export const BtnPrimary = ({ children, onClick, disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    display: "flex", alignItems: "center", gap: 7,
    padding: "9px 17px", background: disabled ? "#CCC" : COLORS.red,
    border: "none", borderRadius: 6, color: "#fff", cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 800, fontSize: 13, fontFamily: H, ...style
  }}>
    {children}
  </button>
);

// ─── Input style ─────────────────────────────────────────────────────────────
export const inputStyle = {
  width: "100%", padding: "8px 10px",
  border: `1px solid ${COLORS.border}`, borderRadius: 6,
  fontSize: 13, color: COLORS.gray, background: COLORS.white,
  outline: "none", boxSizing: "border-box", fontFamily: B,
};
