import { useState } from "react";
import { COLORS, H, B, apiFetch } from "../constants.jsx";

export default function Login() {
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
        window.location.href = "/";
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
        {/* Logo / título */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: COLORS.red,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 12,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div style={{ fontFamily: H, fontWeight: 800, fontSize: 20, color: COLORS.gray }}>
            GMI QMS
          </div>
          <div style={{ color: COLORS.grayLight, fontSize: 13, marginTop: 4 }}>
            Sistema de Gestión de Calidad
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
      </div>
    </div>
  );
}
