import { useNavigate } from "react-router-dom";
import { COLORS, H, B } from "../constants.jsx";

const _appVersion = "0.1.0";
const _buildDate  = import.meta.env.BUILD_DATE
  ? new Date(import.meta.env.BUILD_DATE).toLocaleString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
  : "—";
const _appRev = import.meta.env.VITE_GIT_COMMIT ?? "dev";

export default function AppFooter() {
  const navigate = useNavigate();
  return (
    <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "8px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.bg, flexShrink: 0 }}>
      <span style={{ fontSize: 10, color: "#B0B0B0", fontFamily: B }}>
        <strong style={{ color: "#999", letterSpacing: "0.04em", fontFamily: H }}>GMI Quality Management System</strong>
      </span>
      <button onClick={() => navigate("/novedades")}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#C0C0C0", fontFamily: "monospace", letterSpacing: "0.04em", padding: 0 }}>
        v{_appVersion}&nbsp;&nbsp;·&nbsp;&nbsp;rev {_appRev}&nbsp;&nbsp;·&nbsp;&nbsp;build {_buildDate}
      </button>
    </div>
  );
}
