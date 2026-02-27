import { useLocation, useNavigate } from "react-router-dom";
import { COLORS, H, B, getInitials, ROLE_LABELS } from "../constants.jsx";

const PAGE_TITLES = {
  "/est/dash/v-exe":  "Vista Ejecutiva",
  "/est/dash/v-obj":  "Estado de Objetivos",
  "/est/cont/v-dafo": "Matriz DAFO / CAME",
  "/est/cont/v-part": "Partes Interesadas",
  "/rsg/evar/v-calc": "Calculadora de Riesgos",
  "/rsg/trat/v-plan": "Plan de Acciones",
  "/ope/com/v-oft":   "Master de Ofertas",
  "/ope/prj/v-ent":   "Seguimiento de Entregables",
  "/tal/emp/v-perf":  "Ficha Colaborador",
  "/tal/onb/v-chck":  "Checklist de Bienvenida",
  "/sop/doc/v-maes":  "Listado Maestro de Documentos",
  "/sop/doc/v-proc":  "Mapa de Procesos",
  "/sop/inf/v-inv":   "Inventario IT",
  "/mej/nc/v-nc":     "Gestión de No Conformidades",
  "/mej/eti/v-canal": "Canal de Denuncias",
  "/admin/usuarios":  "Gestión de Usuarios",
  "/perfil":          "Mi Perfil",
  "/novedades":       "Novedades",
};

const COMPANIES = ["GMS", "GMP"];
const BRANDS    = ["EPUNTO", "LIQUID", "THE LIQUID FINANCE"];

const selStyle = {
  padding: "5px 28px 5px 10px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 700,
  fontFamily: H,
  color: COLORS.gray,
  background: `${COLORS.white} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236B6B6B' strokeWidth='2.5' strokeLinecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 8px center`,
  cursor: "pointer",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
};

export default function TopBar({ user, company, brand, setCompany, setBrand }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const title     = PAGE_TITLES[location.pathname] ?? "";
  const displayName = user?.name || user?.email || "Usuario";

  return (
    <div style={{
      background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`,
      padding: "0 24px", height: 52,
      display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
    }}>
      {/* Left: selectors + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <select style={selStyle} value={company} onChange={e => setCompany(e.target.value)}>
          {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={selStyle} value={brand} onChange={e => setBrand(e.target.value)}>
          {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        {title && (
          <>
            <span style={{ color: COLORS.border, fontSize: 16 }}>·</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>
              {title}
            </span>
          </>
        )}
      </div>

      {/* Right: user button */}
      <button onClick={() => navigate("/perfil")}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "1px solid transparent", cursor: "pointer", padding: "5px 10px 5px 6px", borderRadius: 8 }}
        onMouseEnter={e => { e.currentTarget.style.background = "#F5F5F5"; e.currentTarget.style.borderColor = COLORS.border; }}
        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: COLORS.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", fontFamily: H }}>
          {getInitials(displayName)}
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray, fontFamily: H, lineHeight: 1.3 }}>{displayName}</div>
          <div style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: B }}>{ROLE_LABELS[user?.role] || ""}</div>
        </div>
      </button>
    </div>
  );
}
