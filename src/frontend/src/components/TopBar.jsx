import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { COLORS, H, B, getInitials, ROLE_LABELS } from "../constants.jsx";

const PAGE_TITLES = {
  "/home":            "Inicio",
  "/est/dash/v-exe":  "Vista Ejecutiva",
  "/est/dash/v-obj":  "Estado de Objetivos",
  "/est/cont/v-dafo": "Matriz DAFO / CAME",
  "/est/cont/v-org":  "Organigrama",
  "/est/cont/v-proc": "Listado de Procesos",
  "/est/cont/v-part": "Partes Interesadas",
  "/rsg/evar/v-calc":  "Calculadora de Riesgos",
  "/rsg/map/v-map9":   "Mapa ISO 9001",
  "/rsg/map/v-map27":  "Mapa ISO 27001",
  "/rsg/trat/v-plan":  "Plan de Acciones",
  "/ope/com/v-oft":   "Master de Ofertas",
  "/ope/prj/v-ent":   "Seguimiento de Entregables",
  "/tal/emp/v-perf":  "Ficha Colaborador",
  "/tal/for/v-for":   "Gestión de Formación",
  "/tal/onb/v-chck":  "Checklist de Bienvenida",
  "/sop/doc/v-maes":  "Listado Maestro de Documentos",
  "/sop/prov/v-prov": "Homologación y Evaluación de Proveedores",
  "/sop/act/v-dig":   "Inventario de Activos Digitales",
  "/sop/equ/v-equ":   "Gestión de Equipamiento",
  "/mej/aud/v-aud":      "Planificación de Auditorías",
  "/mej/nc/v-nc":        "Gestión de No Conformidades",
  "/mej/eti/v-canal":    "Canal de Denuncias",
  "/adm/org/v-estr":     "Estructura Corporativa",
  "/adm/proc/v-edproc":  "Editor de Procesos",
  "/adm/acc/v-user":     "Gestión de Usuarios On-premise",
  "/adm/acc/v-roles":    "Matriz de Roles y Permisos",
  "/adm/acc/v-log":      "Registro de Actividad",
  "/adm/sec/v-auth":     "Métodos de Autenticación",
  "/adm/ui/v-ui":        "Personalización de Interfaz",
  "/admin/usuarios":     "Gestión de Usuarios",
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
  const location    = useLocation();
  const navigate    = useNavigate();
  const title       = PAGE_TITLES[location.pathname] ?? "";
  const displayName = user?.name || user?.email || "Usuario";

  const [open,    setOpen]    = useState(false);
  const [profile, setProfile] = useState(null);   // data from /auth/me
  const dropRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Fetch real profile when dropdown opens
  useEffect(() => {
    if (!open) return;
    fetch("/auth/me", {
      credentials: "include",
      headers: {
        "X-Tenant-Company": company,
        "X-Tenant-Brand":   brand,
      },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setProfile(data); })
      .catch(() => {});
  }, [open, company, brand]);

  const info = profile ?? user;   // fall back to prop while loading

  const handleLogout = async () => {
    await fetch("/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  };

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

      {/* Right: user button + dropdown */}
      <div style={{ position: "relative" }} ref={dropRef}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: open ? "#F5F5F5" : "none",
            border: `1px solid ${open ? COLORS.border : "transparent"}`,
            cursor: "pointer", padding: "5px 10px 5px 6px", borderRadius: 8,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#F5F5F5"; e.currentTarget.style.borderColor = COLORS.border; }}
          onMouseLeave={e => { if (!open) { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; } }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: COLORS.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", fontFamily: H }}>
            {getInitials(displayName)}
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray, fontFamily: H, lineHeight: 1.3 }}>{displayName}</div>
            <div style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: B }}>{ROLE_LABELS[user?.role] || user?.role || ""}</div>
          </div>
          {/* Chevron */}
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={COLORS.grayLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", marginLeft: 2 }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown panel */}
        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            width: 280, background: COLORS.white,
            border: `1px solid ${COLORS.border}`, borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 200, overflow: "hidden",
          }}>
            {/* Profile header */}
            <div style={{ padding: "20px 20px 16px", background: "#FAFAFA", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: COLORS.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: H, flexShrink: 0 }}>
                  {getInitials(info?.name || info?.email || "U")}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.gray, fontFamily: H, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {info?.name || "—"}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {info?.email || "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile fields */}
            <div style={{ padding: "14px 20px" }}>
              {[
                { label: "Rol",     value: ROLE_LABELS[info?.role] || info?.role },
                { label: "Empresa", value: info?.company_id },
                { label: "Marca",   value: info?.brand_id },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray, fontFamily: H }}>{value || "—"}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
              <button
                onClick={() => { setOpen(false); navigate("/perfil"); }}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", border: "none", background: "none", cursor: "pointer", borderRadius: 7, width: "100%", textAlign: "left", fontSize: 13, color: COLORS.gray, fontFamily: B }}
                onMouseEnter={e => e.currentTarget.style.background = "#F5F5F5"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Mi perfil
              </button>
              <button
                onClick={handleLogout}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", border: "none", background: "none", cursor: "pointer", borderRadius: 7, width: "100%", textAlign: "left", fontSize: 13, color: COLORS.red, fontFamily: B }}
                onMouseEnter={e => e.currentTarget.style.background = "#FFF0F0"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
