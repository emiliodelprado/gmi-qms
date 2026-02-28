import { useState } from "react";
import { COLORS, H, B, Card, PageHeader, BtnPrimary, Icon } from "../../constants.jsx";

// ─── 7 roles ──────────────────────────────────────────────────────────────────
const ROLES = ["IT", "Dirección", "Calidad", "Partners", "Managers", "Colaborador", "Auditor"];

const ROL_CFG = {
  "IT":          { bg: "#F3E5F5", color: "#6A1B9A" },
  "Dirección":   { bg: "#FFEBEE", color: "#C62828" },
  "Calidad":     { bg: "#E8F5E9", color: "#2E7D32" },
  "Partners":    { bg: "#E3F2FD", color: "#1565C0" },
  "Managers":    { bg: "#FFF3E0", color: "#E65100" },
  "Colaborador": { bg: "#F5F5F5", color: "#555555" },
  "Auditor":     { bg: "#E8EAF6", color: "#3949AB" },
};

// ─── 29 pantallas del spec (sin HOME que es landing) ──────────────────────────
const SCREENS = [
  // EST
  { id: "v-exe",    mod: "EST", path: "/est/dash/v-exe",    label: "Vista Ejecutiva"             },
  { id: "v-obj",    mod: "EST", path: "/est/dash/v-obj",    label: "Estado de Objetivos"         },
  { id: "v-dafo",   mod: "EST", path: "/est/cont/v-dafo",   label: "Matriz DAFO/CAME"            },
  { id: "v-org",    mod: "EST", path: "/est/cont/v-org",    label: "Organigrama"                 },
  { id: "v-proc",   mod: "EST", path: "/est/cont/v-proc",   label: "Listado de Procesos"         },
  { id: "v-part",   mod: "EST", path: "/est/cont/v-part",   label: "Partes Interesadas"          },
  // RSG
  { id: "v-calc",   mod: "RSG", path: "/rsg/evar/v-calc",   label: "Calculadora de Riesgos"      },
  { id: "v-map9",   mod: "RSG", path: "/rsg/map/v-map9",    label: "Mapa ISO 9001"               },
  { id: "v-map27",  mod: "RSG", path: "/rsg/map/v-map27",   label: "Mapa ISO 27001"              },
  { id: "v-plan",   mod: "RSG", path: "/rsg/trat/v-plan",   label: "Plan de Acciones"            },
  // OPE
  { id: "v-oft",    mod: "OPE", path: "/ope/com/v-oft",     label: "Master de Ofertas"           },
  { id: "v-ent",    mod: "OPE", path: "/ope/prj/v-ent",     label: "Seguimiento Entregables"     },
  // TAL
  { id: "v-perf",   mod: "TAL", path: "/tal/emp/v-perf",    label: "Ficha Colaborador"           },
  { id: "v-for",    mod: "TAL", path: "/tal/for/v-for",     label: "Gestión de Formación"        },
  { id: "v-chck",   mod: "TAL", path: "/tal/onb/v-chck",    label: "Checklist Bienvenida"        },
  // SOP
  { id: "v-maes",   mod: "SOP", path: "/sop/doc/v-maes",    label: "Listado Maestro Doc."        },
  { id: "v-prov",   mod: "SOP", path: "/sop/prov/v-prov",   label: "Proveedores"                 },
  { id: "v-dig",    mod: "SOP", path: "/sop/act/v-dig",     label: "Activos de Información"      },
  { id: "v-equ",    mod: "SOP", path: "/sop/equ/v-equ",     label: "Equipamiento"                },
  // MEJ
  { id: "v-aud",    mod: "MEJ", path: "/mej/aud/v-aud",     label: "Planificación Auditorías"    },
  { id: "v-nc",     mod: "MEJ", path: "/mej/nc/v-nc",       label: "Gestión de NC"               },
  { id: "v-canal",  mod: "MEJ", path: "/mej/eti/v-canal",   label: "Canal de Denuncias"          },
  // ADM
  { id: "v-estr",   mod: "ADM", path: "/adm/org/v-estr",    label: "Estructura Corporativa"      },
  { id: "v-edproc", mod: "ADM", path: "/adm/proc/v-edproc", label: "Editor de Procesos"          },
  { id: "v-user",   mod: "ADM", path: "/adm/acc/v-user",    label: "Gestión de Usuarios"         },
  { id: "v-roles",  mod: "ADM", path: "/adm/acc/v-roles",   label: "Roles y Permisos"            },
  { id: "v-log",    mod: "ADM", path: "/adm/acc/v-log",     label: "Registro de Actividad"       },
  { id: "v-auth",   mod: "ADM", path: "/adm/sec/v-auth",    label: "Métodos de Autenticación"    },
  { id: "v-ui",     mod: "ADM", path: "/adm/ui/v-ui",       label: "Personalización UI"          },
];

const PERMS = ["—", "R", "R/W"];

const PERM_CFG = {
  "—":   { bg: "#F5F5F5", color: "#BBBBBB" },
  "R":   { bg: "#E3F2FD", color: "#1565C0" },
  "R/W": { bg: "#E8F5E9", color: "#2E7D32" },
};

const MOD_COLORS = {
  EST: COLORS.red,   RSG: "#E65100", OPE: "#1565C0",
  TAL: "#6A1B9A",   SOP: "#2E7D32", MEJ: "#00695C", ADM: "#424242",
};

// ─── Initial permission matrix ────────────────────────────────────────────────
// IT: full R/W everywhere (config + security focus)
// Dirección: R/W on strategic + executive; limited on ops details; — on user admin
// Calidad: R/W on quality-related; full ADM user/process/roles; — on security/UI
// Partners: R/W only on commercial/projects; R on limited screens
// Managers: R/W on OPE+TAL; R on EST+RSG+SOP+MEJ; — on ADM
// Colaborador: R on own profile + onboarding + docs; — on most
// Auditor: R everywhere; R/W only on audits and NC
function initMatrix() {
  const m = {};
  SCREENS.forEach(sc => {
    m[sc.id] = {};
    ROLES.forEach(role => {
      let perm = "—";

      if (role === "IT") {
        // Full access everywhere
        perm = "R/W";
      } else if (role === "Dirección") {
        if (["v-exe", "v-obj", "v-dafo", "v-org", "v-proc", "v-part"].includes(sc.id)) perm = "R/W";      // EST: full
        else if (["v-calc", "v-map9", "v-map27", "v-plan"].includes(sc.id))              perm = "R";        // RSG: read
        else if (["v-oft", "v-ent"].includes(sc.id))                                      perm = "R";        // OPE: read
        else if (["v-perf", "v-for"].includes(sc.id))                                     perm = "R";        // TAL: read
        else if (["v-maes", "v-prov"].includes(sc.id))                                    perm = "R";        // SOP: read
        else if (["v-aud", "v-nc"].includes(sc.id))                                       perm = "R";        // MEJ: read
        else if (["v-estr"].includes(sc.id))                                              perm = "R/W";      // ADM: structure
        else if (["v-ui"].includes(sc.id))                                                perm = "R/W";      // ADM: UI customization
        else                                                                               perm = "—";
      } else if (role === "Calidad") {
        if (["v-exe", "v-obj", "v-dafo", "v-proc", "v-part"].includes(sc.id))            perm = "R/W";      // EST: quality-relevant
        else if (["v-org"].includes(sc.id))                                               perm = "R";
        else if (["v-calc", "v-map9", "v-map27", "v-plan"].includes(sc.id))              perm = "R/W";      // RSG: full
        else if (["v-oft", "v-ent"].includes(sc.id))                                      perm = "R";        // OPE: read
        else if (["v-perf", "v-for", "v-chck"].includes(sc.id))                          perm = "R/W";      // TAL: full
        else if (["v-maes", "v-prov", "v-dig", "v-equ"].includes(sc.id))                perm = "R/W";      // SOP: full
        else if (["v-aud", "v-nc", "v-canal"].includes(sc.id))                           perm = "R/W";      // MEJ: full
        else if (["v-estr", "v-edproc", "v-user", "v-roles", "v-log"].includes(sc.id))  perm = "R/W";      // ADM: user mgmt + processes
        else                                                                               perm = "—";        // ADM sec/UI: no
      } else if (role === "Partners") {
        if (["v-oft", "v-ent"].includes(sc.id))                                           perm = "R/W";      // OPE: commercial access
        else if (["v-exe"].includes(sc.id))                                               perm = "R";        // EST: exec view only
        else if (["v-maes"].includes(sc.id))                                              perm = "R";        // SOP: docs read
        else                                                                               perm = "—";
      } else if (role === "Managers") {
        if (["v-exe", "v-obj"].includes(sc.id))                                           perm = "R";        // EST: exec read
        else if (["v-calc", "v-plan"].includes(sc.id))                                    perm = "R";        // RSG: read
        else if (["v-oft", "v-ent"].includes(sc.id))                                      perm = "R/W";      // OPE: full
        else if (["v-perf", "v-for", "v-chck"].includes(sc.id))                          perm = "R/W";      // TAL: full
        else if (["v-maes", "v-prov", "v-equ"].includes(sc.id))                          perm = "R";        // SOP: read
        else if (["v-aud", "v-nc"].includes(sc.id))                                       perm = "R";        // MEJ: read
        else                                                                               perm = "—";
      } else if (role === "Colaborador") {
        if (["v-perf"].includes(sc.id))                                                   perm = "R/W";      // own profile
        else if (["v-chck"].includes(sc.id))                                              perm = "R/W";      // onboarding
        else if (["v-maes"].includes(sc.id))                                              perm = "R";        // docs read
        else if (["v-for"].includes(sc.id))                                               perm = "R";        // training read
        else                                                                               perm = "—";
      } else if (role === "Auditor") {
        // Read everywhere, R/W on audits + NC
        if (["v-aud", "v-nc"].includes(sc.id))                                            perm = "R/W";
        else if (["v-canal"].includes(sc.id))                                             perm = "—";        // ethics channel: no auditor
        else if (["v-user", "v-roles", "v-auth"].includes(sc.id))                        perm = "—";        // no access to security admin
        else                                                                               perm = "R";
      }

      m[sc.id][role] = perm;
    });
  });
  return m;
}

export default function AdmRoles() {
  const [matrix, setMatrix] = useState(initMatrix);
  const [saved,  setSaved]  = useState(false);

  const cycle = (scId, role) => {
    setMatrix(prev => {
      const cur  = prev[scId][role];
      const next = PERMS[(PERMS.indexOf(cur) + 1) % PERMS.length];
      return { ...prev, [scId]: { ...prev[scId], [role]: next } };
    });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Group screens by module for visual separator rows
  const mods = [...new Set(SCREENS.map(s => s.mod))];

  return (
    <div>
      <PageHeader title="Matriz de Roles y Permisos" subtitle="Haz clic en una celda para cambiar el nivel de acceso · — Sin acceso · R Lectura · R/W Lectura y escritura" />

      {/* Role legend */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {ROLES.map(r => {
          const cfg = ROL_CFG[r];
          return (
            <div key={r} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.color}22` }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: cfg.color, fontFamily: H }}>{r}</span>
            </div>
          );
        })}
      </div>

      <Card style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ background: "#FAFAFA" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `2px solid ${COLORS.border}`, fontFamily: H, minWidth: 220, position: "sticky", left: 0, background: "#FAFAFA", zIndex: 2 }}>
                Pantalla
              </th>
              {ROLES.map(r => {
                const cfg = ROL_CFG[r];
                return (
                  <th key={r} style={{ padding: "10px 10px", textAlign: "center", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: cfg.color, fontWeight: 800, borderBottom: `2px solid ${COLORS.border}`, fontFamily: H, whiteSpace: "nowrap", minWidth: 80 }}>
                    {r}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {mods.map(mod => {
              const modScreens = SCREENS.filter(s => s.mod === mod);
              const modColor   = MOD_COLORS[mod] ?? "#555";
              return [
                // Module separator row
                <tr key={`sep-${mod}`}>
                  <td colSpan={ROLES.length + 1} style={{ padding: "6px 16px", background: modColor + "12", borderBottom: `1px solid ${modColor}30`, borderTop: `1px solid ${modColor}30` }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: modColor, fontFamily: "monospace", letterSpacing: "0.12em" }}>{mod}</span>
                  </td>
                </tr>,
                // Screen rows
                ...modScreens.map((sc, i) => {
                  const rowBg = i % 2 === 0 ? COLORS.white : "#FCFCFC";
                  return (
                    <tr key={sc.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: rowBg }}>
                      <td style={{ padding: "8px 16px", fontSize: 12, color: COLORS.gray, fontFamily: B, position: "sticky", left: 0, background: rowBg, zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, background: modColor + "18", color: modColor, borderRadius: 3, padding: "2px 5px", fontFamily: "monospace", flexShrink: 0 }}>{sc.id.toUpperCase()}</span>
                          <span>{sc.label}</span>
                        </div>
                      </td>
                      {ROLES.map(role => {
                        const perm = matrix[sc.id][role];
                        const pcfg = PERM_CFG[perm];
                        return (
                          <td key={role} style={{ padding: "7px 10px", textAlign: "center" }}>
                            <button
                              onClick={() => cycle(sc.id, role)}
                              title={`${role} → ${PERMS[(PERMS.indexOf(perm) + 1) % PERMS.length]}`}
                              style={{
                                padding: "3px 10px", borderRadius: 20, background: pcfg.bg, color: pcfg.color,
                                fontSize: 10, fontWeight: 800, fontFamily: H, border: `1px solid ${pcfg.color}33`,
                                cursor: "pointer", minWidth: 36, transition: "opacity 0.1s",
                              }}
                              onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                            >
                              {perm}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                }),
              ];
            })}
          </tbody>
        </table>
      </Card>

      {/* Save bar */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 18 }}>
        <BtnPrimary onClick={handleSave}>
          <Icon name="check" size={14} color="#fff" /> Guardar matriz
        </BtnPrimary>
        {saved && <span style={{ fontSize: 12, color: "#2E7D32", fontFamily: B }}>Permisos guardados correctamente</span>}
        <span style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, marginLeft: "auto" }}>
          {ROLES.length} roles · {SCREENS.length} pantallas · {ROLES.length * SCREENS.length} celdas
        </span>
      </div>
    </div>
  );
}
