import { useState, useEffect } from "react";
import { COLORS, H, B, apiFetch, getInitials } from "../constants.jsx";

// ─── Role color map ───────────────────────────────────────────────────────────
const ROLE_COLOR = {
  IT:         COLORS.red,
  Dirección:  "#7B1FA2",
  Calidad:    "#1565C0",
  Partners:   "#E65100",
  Managers:   "#2E7D32",
  Colaborador:"#455A64",
  Auditor:    "#00695C",
};
const roleColor = (role) => ROLE_COLOR[role] ?? COLORS.grayLight;

// ─── Redirect to the originally-requested URL (or /home) after login ──────────
function redirectAfterLogin() {
  const url = sessionStorage.getItem("qms_return_url") || "/home";
  sessionStorage.removeItem("qms_return_url");
  window.location.href = url;
}

// ─── Dev login page ───────────────────────────────────────────────────────────
function DevLogin() {
  const [users,   setUsers]   = useState([]);
  const [fetching, setFetching] = useState(true);
  const [signing, setSigning] = useState(null); // user id being logged in

  useEffect(() => {
    apiFetch("/auth/dev-users")
      .then(r => r.ok ? r.json() : [])
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setFetching(false));
  }, []);

  const loginAs = async (userId) => {
    setSigning(userId);
    try {
      await apiFetch(`/auth/dev-login/user/${userId}`);
      redirectAfterLogin();
    } catch {
      setSigning(null);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#F4F4F4", fontFamily: B,
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: "40px 36px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)", width: 420, maxWidth: "94vw",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src="/logo.png" alt="GMI" style={{ width: 120, marginBottom: 12, display: "inline-block" }} />
          <div style={{ fontFamily: H, fontWeight: 800, fontSize: 16, color: COLORS.gray }}>
            Quality Management System
          </div>
          <div style={{
            display: "inline-block", marginTop: 6, padding: "2px 10px",
            background: "#FFF3CD", border: "1px solid #FFD54F",
            borderRadius: 20, fontSize: 11, fontWeight: 800,
            color: "#7B5800", letterSpacing: "0.06em", fontFamily: H,
          }}>
            DEV MODE
          </div>
        </div>

        <p style={{ fontSize: 12, color: COLORS.grayLight, marginBottom: 14, textAlign: "center", fontFamily: B }}>
          Selecciona un usuario para entrar
        </p>

        {/* User list */}
        {fetching ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: COLORS.grayLight, fontSize: 13, fontFamily: B }}>
            Cargando usuarios…
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: COLORS.grayLight, fontSize: 13, fontFamily: B }}>
            No hay usuarios en la base de datos.<br />Ejecuta <code>seed_dev.py</code>.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
            {users.map(u => {
              const busy  = signing === u.id;
              const roles = u.tenants.map(t => t.role);
              const firstRole = roles[0] ?? "—";
              const color = roleColor(firstRole);
              const initials = getInitials(u.name);

              return (
                <button
                  key={u.id}
                  onClick={() => loginAs(u.id)}
                  disabled={signing !== null}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", border: `1.5px solid ${COLORS.border}`,
                    borderRadius: 10, background: busy ? "#F9F9F9" : "#fff",
                    cursor: signing !== null ? "not-allowed" : "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                    opacity: signing !== null && !busy ? 0.45 : 1,
                    textAlign: "left", width: "100%",
                  }}
                  onMouseEnter={e => { if (!signing) e.currentTarget.style.borderColor = color; }}
                  onMouseLeave={e => { if (!signing) e.currentTarget.style.borderColor = COLORS.border; }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: busy ? COLORS.border : color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: "#fff", fontFamily: H,
                    flexShrink: 0, transition: "background 0.15s",
                  }}>
                    {busy ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
                        </path>
                      </svg>
                    ) : initials}
                  </div>

                  {/* Info */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: H, fontWeight: 700, fontSize: 13, color: COLORS.gray, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.grayLight, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {u.email}
                    </div>
                  </div>

                  {/* Role badges */}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 4, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {[...new Set(roles)].slice(0, 2).map(r => (
                      <span key={r} style={{
                        padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 800,
                        background: roleColor(r) + "18", color: roleColor(r), fontFamily: H,
                      }}>{r}</span>
                    ))}
                    {roles.length > 2 && (
                      <span style={{ padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: "#F0F0F0", color: COLORS.grayLight, fontFamily: H }}>
                        +{roles.length - 2}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <p style={{ marginTop: 20, fontSize: 11, color: COLORS.grayLight, textAlign: "center", fontFamily: B, lineHeight: 1.5 }}>
          En producción se usará autenticación real (local o SAML).
        </p>
      </div>
    </div>
  );
}

// ─── Production login page ────────────────────────────────────────────────────
function ProdLogin() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/local/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        redirectAfterLogin();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Credenciales incorrectas");
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: COLORS.bg, fontFamily: B,
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "48px 40px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)", width: 360, maxWidth: "90vw",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/logo.png" alt="GMI" style={{ width: 130, marginBottom: 12, display: "inline-block" }} />
          <div style={{ fontFamily: H, fontWeight: 800, fontSize: 16, color: COLORS.gray }}>
            Quality Management System
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray, display: "block", marginBottom: 6 }}>
              Correo electrónico
            </label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: `1px solid ${COLORS.border}`, fontSize: 14,
                fontFamily: B, outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray, display: "block", marginBottom: 6 }}>
              Contraseña
            </label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: `1px solid ${COLORS.border}`, fontSize: 14,
                fontFamily: B, outline: "none",
              }}
            />
          </div>

          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
              padding: "10px 12px", fontSize: 13, color: "#B91C1C", marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: "100%", padding: "11px", borderRadius: 8,
              background: loading ? COLORS.border : COLORS.red,
              color: "#fff", fontFamily: H, fontWeight: 700, fontSize: 14,
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {loading ? "Accediendo…" : "Iniciar sesión"}
          </button>
        </form>

        {/* SSO divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "24px 0 20px" }}>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          <span style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, whiteSpace: "nowrap" }}>
            o accede con tu cuenta corporativa
          </span>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>

        <a
          href="/auth/login"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            width: "100%", padding: "10px", borderRadius: 8,
            border: `1.5px solid ${COLORS.border}`,
            background: "#fff", color: COLORS.gray,
            fontFamily: H, fontWeight: 700, fontSize: 14,
            textDecoration: "none", cursor: "pointer",
            transition: "border-color 0.15s, background 0.15s",
            boxSizing: "border-box",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.red; e.currentTarget.style.background = "#FEF2F2"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = "#fff"; }}
        >
          {/* OneLogin shield icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6L12 2z" fill="#D32F2F" opacity="0.15"/>
            <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6L12 2z" stroke="#D32F2F" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="2.5" fill="#D32F2F"/>
          </svg>
          Acceder con OneLogin (SSO)
        </a>
      </div>
    </div>
  );
}

// ─── Entry point: dev vs prod ─────────────────────────────────────────────────
export default function Login() {
  return import.meta.env.DEV ? <DevLogin /> : <ProdLogin />;
}
