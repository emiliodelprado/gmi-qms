import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { COLORS, H, B, Icon, getInitials, ROLE_LABELS } from "../constants.jsx";

// ─── Navigation tree ──────────────────────────────────────────────────────────
const NAV_MODULES = [
  {
    id: "est", code: "EST", label: "Estrategia", icon: "strategy",
    fns: [
      { id: "dash", code: "DASH", label: "Dashboard", screens: [
        { id: "v-exe", label: "Vista Ejecutiva",     path: "/est/dash/v-exe" },
        { id: "v-obj", label: "Estado de Objetivos", path: "/est/dash/v-obj" },
      ]},
      { id: "cont", code: "CONT", label: "Contexto", screens: [
        { id: "v-dafo", label: "Matriz DAFO/CAME",   path: "/est/cont/v-dafo" },
        { id: "v-part", label: "Partes Interesadas", path: "/est/cont/v-part" },
      ]},
    ],
  },
  {
    id: "rsg", code: "RSG", label: "Riesgos", icon: "risk",
    fns: [
      { id: "evar", code: "EVAR", label: "Evaluación", screens: [
        { id: "v-calc", label: "Calculadora de Riesgos", path: "/rsg/evar/v-calc" },
      ]},
      { id: "trat", code: "TRAT", label: "Tratamiento", screens: [
        { id: "v-plan", label: "Plan de Acciones",       path: "/rsg/trat/v-plan" },
      ]},
    ],
  },
  {
    id: "ope", code: "OPE", label: "Operaciones", icon: "operations",
    fns: [
      { id: "com", code: "COM", label: "Comercial", screens: [
        { id: "v-oft", label: "Master de Ofertas",         path: "/ope/com/v-oft" },
      ]},
      { id: "prj", code: "PRJ", label: "Proyectos", screens: [
        { id: "v-ent", label: "Seguimiento de Entregables", path: "/ope/prj/v-ent" },
      ]},
    ],
  },
  {
    id: "tal", code: "TAL", label: "Talento", icon: "talent",
    fns: [
      { id: "emp", code: "EMP", label: "Empleados", screens: [
        { id: "v-perf", label: "Ficha Colaborador",   path: "/tal/emp/v-perf" },
      ]},
      { id: "onb", code: "ONB", label: "Onboarding", screens: [
        { id: "v-chck", label: "Checklist Bienvenida", path: "/tal/onb/v-chck" },
      ]},
    ],
  },
  {
    id: "sop", code: "SOP", label: "Soporte", icon: "support",
    fns: [
      { id: "doc", code: "DOC", label: "Documentos", screens: [
        { id: "v-maes", label: "Listado Maestro", path: "/sop/doc/v-maes" },
      ]},
      { id: "inf", code: "INF", label: "Infraestructura", screens: [
        { id: "v-inv", label: "Inventario IT",    path: "/sop/inf/v-inv" },
      ]},
    ],
  },
  {
    id: "mej", code: "MEJ", label: "Mejora", icon: "improve",
    fns: [
      { id: "nc", code: "NC", label: "No Conformidades", screens: [
        { id: "v-nc",    label: "Gestión de NC",   path: "/mej/nc/v-nc" },
      ]},
      { id: "eti", code: "ETI", label: "Ética", screens: [
        { id: "v-canal", label: "Canal de Denuncias", path: "/mej/eti/v-canal" },
      ]},
    ],
  },
];

const SYSTEM_NAV = [
  { id: "admin",     label: "Usuarios",  icon: "admin",    path: "/admin/usuarios", adminOnly: true },
  { id: "profile",   label: "Mi Perfil", icon: "profile",  path: "/perfil" },
  { id: "changelog", label: "Novedades", icon: "changelog", path: "/novedades" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function findModuleAndFnForPath(path) {
  for (const mod of NAV_MODULES) {
    for (const fn of mod.fns) {
      for (const sc of fn.screens) {
        if (sc.path === path) return { modId: mod.id, fnId: fn.id };
      }
    }
  }
  return null;
}

// ─── Sidebar component ────────────────────────────────────────────────────────
export default function Sidebar({ user }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const [mini, setMini] = useState(() => localStorage.getItem("qms_sidebar_mini") === "1");
  const [openMods, setOpenMods] = useState(new Set(["est"]));
  const [openFns,  setOpenFns]  = useState(new Set(["dash"]));

  // Auto-expand current module/fn on route change
  useEffect(() => {
    const found = findModuleAndFnForPath(location.pathname);
    if (found) {
      setOpenMods(prev => new Set([...prev, found.modId]));
      setOpenFns(prev  => new Set([...prev, found.fnId]));
    }
  }, [location.pathname]);

  const toggleMini = () => setMini(m => {
    const next = !m;
    localStorage.setItem("qms_sidebar_mini", next ? "1" : "0");
    return next;
  });

  const toggleMod = (id) => setOpenMods(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const toggleFn = (id) => setOpenFns(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const isScreenActive = (path) => location.pathname === path;
  const visibleSystem  = SYSTEM_NAV.filter(it => !it.adminOnly || user?.role === "admin");

  return (
    <div style={{
      width: mini ? 52 : 220, minHeight: "100vh",
      background: COLORS.sidebar, display: "flex", flexDirection: "column",
      flexShrink: 0, transition: "width 0.2s ease", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: mini ? "14px 6px 12px" : "14px 12px 12px", borderBottom: "1px solid #2A2A2A" }}>
        <div style={{ display: "flex", alignItems: "center", gap: mini ? 0 : 8, justifyContent: mini ? "center" : "flex-start" }}>
          <div style={{ width: 38, flexShrink: 0 }}>
            <img src="/logo.png" alt="GMI" style={{ width: "100%", display: "block", borderRadius: 3 }} />
          </div>
          {!mini && (
            <div style={{ fontSize: 8, color: "#fff", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: H, fontWeight: 800, lineHeight: 1.4, flex: 1 }}>
              Quality<br />Management<br />System
            </div>
          )}
          <button onClick={toggleMini} title={mini ? "Expandir" : "Colapsar"}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", opacity: 0.45 }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0.45"}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: mini ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: mini ? "10px 4px" : "10px 8px", overflowY: "auto", overflowX: "hidden" }}>
        {NAV_MODULES.map(mod => {
          const modOpen = openMods.has(mod.id);
          // Is any screen in this module active?
          const modActive = mod.fns.some(fn => fn.screens.some(sc => isScreenActive(sc.path)));

          return (
            <div key={mod.id} style={{ marginBottom: 2 }}>
              {/* Level 1: Module */}
              <button
                onClick={() => mini ? navigate(mod.fns[0].screens[0].path) : toggleMod(mod.id)}
                title={mini ? mod.label : undefined}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  gap: mini ? 0 : 8, padding: mini ? "9px 0" : "8px 10px",
                  justifyContent: mini ? "center" : "flex-start",
                  border: "none", cursor: "pointer", borderRadius: 6,
                  background: modActive && mini ? COLORS.red : modActive ? "rgba(169,30,34,0.15)" : "transparent",
                  color: "#fff", fontFamily: H, fontSize: 12, fontWeight: 700,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { if (!modActive) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                onMouseLeave={e => { if (!modActive) e.currentTarget.style.background = "transparent"; }}>
                <Icon name={mod.icon} size={15} color={modActive ? COLORS.red : "#888"} />
                {!mini && (
                  <>
                    <span style={{ flex: 1, textAlign: "left", color: modActive ? "#fff" : "#AAA" }}>{mod.label}</span>
                    <span style={{ fontSize: 9, color: "#555", fontFamily: "monospace", marginRight: 4 }}>{mod.code}</span>
                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: modOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </>
                )}
              </button>

              {/* Level 2 & 3 — only when expanded and not mini */}
              {!mini && modOpen && mod.fns.map(fn => {
                const fnOpen = openFns.has(fn.id);
                const fnActive = fn.screens.some(sc => isScreenActive(sc.path));

                return (
                  <div key={fn.id} style={{ marginLeft: 8, marginTop: 1 }}>
                    {/* Level 2: Function */}
                    <button
                      onClick={() => toggleFn(fn.id)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 8px", border: "none", cursor: "pointer", borderRadius: 5,
                        background: "transparent", fontFamily: H, fontSize: 11, fontWeight: 700,
                        color: fnActive ? "#DDD" : "#666", transition: "background 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: fnOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <span style={{ flex: 1, textAlign: "left" }}>{fn.label}</span>
                      <span style={{ fontSize: 8, color: "#444", fontFamily: "monospace" }}>{fn.code}</span>
                    </button>

                    {/* Level 3: Screens */}
                    {fnOpen && fn.screens.map(sc => {
                      const active = isScreenActive(sc.path);
                      return (
                        <button key={sc.id}
                          onClick={() => navigate(sc.path)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 0,
                            padding: "5px 8px 5px 22px", border: "none", cursor: "pointer", borderRadius: 5,
                            background: active ? COLORS.red : "transparent",
                            color: active ? "#fff" : "#666", fontFamily: B, fontSize: 11, fontWeight: active ? 700 : 400,
                            transition: "background 0.15s", textAlign: "left",
                          }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: active ? "#fff" : "#444", marginRight: 8, flexShrink: 0 }} />
                          {sc.label}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Divider */}
        <div style={{ height: 1, background: "#2A2A2A", margin: "10px 4px" }} />

        {/* System nav */}
        {visibleSystem.map(it => {
          const active = location.pathname.startsWith(it.path);
          return (
            <button key={it.id}
              onClick={() => navigate(it.path)}
              title={mini ? it.label : undefined}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                gap: mini ? 0 : 8, padding: mini ? "9px 0" : "7px 10px",
                justifyContent: mini ? "center" : "flex-start",
                border: "none", cursor: "pointer", borderRadius: 6,
                background: active ? COLORS.red : "transparent",
                color: "#fff", fontFamily: H, fontSize: 12, fontWeight: active ? 700 : 500,
                transition: "background 0.15s", marginBottom: 2,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
              <Icon name={it.icon} size={14} color={active ? "#fff" : "#666"} />
              {!mini && <span style={{ color: active ? "#fff" : "#AAA" }}>{it.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      {!mini && (
        <div style={{ padding: "10px 8px", borderTop: "1px solid #2A2A2A" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: COLORS.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0, fontFamily: H }}>
              {getInitials(user?.name || user?.email || "U")}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#CCC", fontSize: 11, fontWeight: 700, fontFamily: H, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || user?.email}</div>
              <div style={{ color: "#555", fontSize: 10, fontFamily: B }}>{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
