import { useState, useEffect } from "react";
import { COLORS, H, B, Card, PageHeader, BtnPrimary, Icon, apiFetch } from "../../constants.jsx";

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

// ─── 33 pantallas ─────────────────────────────────────────────────────────────
const SCREENS = [
  // EST
  { id: "v-exe",      mod: "EST", label: "Vista Ejecutiva"          },
  { id: "v-obj",      mod: "EST", label: "Estado de Objetivos"      },
  { id: "v-dafo",     mod: "EST", label: "Matriz DAFO/CAME"         },
  { id: "v-org",      mod: "EST", label: "Organigrama"              },
  { id: "v-proc",     mod: "EST", label: "Listado de Procesos"      },
  { id: "v-part",     mod: "EST", label: "Partes Interesadas"       },
  { id: "v-pol",      mod: "EST", label: "Política de Calidad"      },
  // RSG
  { id: "v-calc",     mod: "RSG", label: "Calculadora de Riesgos"   },
  { id: "v-map9",     mod: "RSG", label: "Mapa ISO 9001"            },
  { id: "v-map27",    mod: "RSG", label: "Mapa ISO 27001"           },
  { id: "v-plan",     mod: "RSG", label: "Plan de Acciones"         },
  // OPE
  { id: "v-oft",      mod: "OPE", label: "Master de Ofertas"        },
  { id: "v-ent",      mod: "OPE", label: "Seguimiento Entregables"  },
  // TAL
  { id: "v-perf",     mod: "TAL", label: "Ficha Colaborador"        },
  { id: "v-for",      mod: "TAL", label: "Gestión de Formación"     },
  { id: "v-chck",     mod: "TAL", label: "Checklist Bienvenida"     },
  // SOP
  { id: "v-maes",     mod: "SOP", label: "Listado Maestro Doc."     },
  { id: "v-prov",     mod: "SOP", label: "Proveedores"              },
  { id: "v-dig",      mod: "SOP", label: "Activos de Información"   },
  { id: "v-equ",      mod: "SOP", label: "Equipamiento"             },
  // MEJ
  { id: "v-aud",      mod: "MEJ", label: "Planificación Auditorías" },
  { id: "v-nc",       mod: "MEJ", label: "Gestión de NC"            },
  { id: "v-canal",    mod: "MEJ", label: "Canal de Denuncias"       },
  // ADM
  { id: "v-estr",     mod: "ADM", label: "Estructura Corporativa"   },
  { id: "v-depart",   mod: "ADM", label: "Departamentos"            },
  { id: "v-puestos",  mod: "ADM", label: "Puestos"                  },
  { id: "v-edproc",   mod: "ADM", label: "Editor de Procesos"       },
  { id: "v-user",     mod: "ADM", label: "Gestión de Usuarios"      },
  { id: "v-roles",    mod: "ADM", label: "Roles y Permisos"         },
  { id: "v-log",      mod: "ADM", label: "Registro de Actividad"    },
  { id: "v-auth",     mod: "ADM", label: "Métodos de Autenticación" },
  { id: "v-ui",       mod: "ADM", label: "Personalización UI"       },
  { id: "v-regional", mod: "ADM", label: "Configuración Regional"   },
];

const PERMS = ["—", "R", "R/W"];

const PERM_CFG = {
  "—":   { bg: "#F5F5F5", color: "#BBBBBB" },
  "R":   { bg: "#E3F2FD", color: "#1565C0" },
  "R/W": { bg: "#E8F5E9", color: "#2E7D32" },
};

const MOD_COLORS = {
  EST: COLORS.red, RSG: "#E65100", OPE: "#1565C0",
  TAL: "#6A1B9A",  SOP: "#2E7D32", MEJ: "#00695C", ADM: "#424242",
};

// ─── Default matrix (used when DB is empty / first run) ───────────────────────
function initMatrix() {
  const m = {};
  SCREENS.forEach(sc => {
    m[sc.id] = {};
    ROLES.forEach(role => {
      let perm = "—";

      if (role === "IT") {
        perm = "R/W";

      } else if (role === "Dirección") {
        if (["v-exe","v-obj","v-dafo","v-org","v-proc","v-part","v-pol"].includes(sc.id)) perm = "R/W";
        else if (["v-calc","v-map9","v-map27","v-plan"].includes(sc.id))                  perm = "R";
        else if (["v-oft","v-ent"].includes(sc.id))                                       perm = "R";
        else if (["v-perf","v-for"].includes(sc.id))                                      perm = "R";
        else if (["v-maes","v-prov"].includes(sc.id))                                     perm = "R";
        else if (["v-aud","v-nc"].includes(sc.id))                                        perm = "R";
        else if (["v-estr","v-depart","v-puestos","v-ui"].includes(sc.id))                perm = "R/W";

      } else if (role === "Calidad") {
        if (["v-exe","v-obj","v-dafo","v-proc","v-part","v-pol"].includes(sc.id))         perm = "R/W";
        else if (["v-org"].includes(sc.id))                                               perm = "R";
        else if (["v-calc","v-map9","v-map27","v-plan"].includes(sc.id))                  perm = "R/W";
        else if (["v-oft","v-ent"].includes(sc.id))                                       perm = "R";
        else if (["v-perf","v-for","v-chck"].includes(sc.id))                             perm = "R/W";
        else if (["v-maes","v-prov","v-dig","v-equ"].includes(sc.id))                     perm = "R/W";
        else if (["v-aud","v-nc","v-canal"].includes(sc.id))                              perm = "R/W";
        else if (["v-estr","v-depart","v-puestos","v-edproc","v-user","v-roles","v-log"].includes(sc.id)) perm = "R/W";
        else if (["v-regional"].includes(sc.id))                                         perm = "R";

      } else if (role === "Partners") {
        if (["v-oft","v-ent"].includes(sc.id))                                            perm = "R/W";
        else if (["v-exe"].includes(sc.id))                                               perm = "R";
        else if (["v-maes"].includes(sc.id))                                              perm = "R";

      } else if (role === "Managers") {
        if (["v-exe","v-obj"].includes(sc.id))                                            perm = "R";
        else if (["v-pol"].includes(sc.id))                                               perm = "R";
        else if (["v-calc","v-plan"].includes(sc.id))                                     perm = "R";
        else if (["v-oft","v-ent"].includes(sc.id))                                       perm = "R/W";
        else if (["v-perf","v-for","v-chck"].includes(sc.id))                             perm = "R/W";
        else if (["v-maes","v-prov","v-equ"].includes(sc.id))                             perm = "R";
        else if (["v-aud","v-nc"].includes(sc.id))                                        perm = "R";
        else if (["v-depart","v-puestos"].includes(sc.id))                                perm = "R";

      } else if (role === "Colaborador") {
        if (["v-pol"].includes(sc.id))                                                    perm = "R";
        else if (["v-perf"].includes(sc.id))                                              perm = "R/W";
        else if (["v-chck"].includes(sc.id))                                              perm = "R/W";
        else if (["v-maes"].includes(sc.id))                                              perm = "R";
        else if (["v-for"].includes(sc.id))                                               perm = "R";

      } else if (role === "Auditor") {
        if (["v-aud","v-nc"].includes(sc.id))                                             perm = "R/W";
        else if (["v-canal","v-user","v-roles","v-auth","v-regional"].includes(sc.id))    perm = "—";
        else                                                                              perm = "R";
      }

      m[sc.id][role] = perm;
    });
  });
  return m;
}

// ─── Convert flat API rows → matrix object ────────────────────────────────────
function rowsToMatrix(rows) {
  const m = initMatrix();          // start with defaults for any missing cells
  rows.forEach(r => {
    if (m[r.screen_id]) {
      m[r.screen_id][r.role] = r.permission;
    }
  });
  return m;
}

// ─── Convert matrix object → flat API rows ────────────────────────────────────
function matrixToRows(matrix) {
  const rows = [];
  SCREENS.forEach(sc => {
    ROLES.forEach(role => {
      rows.push({ role, screen_id: sc.id, permission: matrix[sc.id][role] });
    });
  });
  return rows;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdmRoles() {
  const [matrix,  setMatrix]  = useState(initMatrix);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  // Load from API on mount
  useEffect(() => {
    apiFetch("/api/adm/role-permissions")
      .then(r => r.ok ? r.json() : [])
      .then(rows => {
        if (rows.length > 0) setMatrix(rowsToMatrix(rows));
        // If empty (first run), keep initMatrix() defaults
      })
      .catch(() => {/* keep defaults */})
      .finally(() => setLoading(false));
  }, []);

  const cycle = (scId, role) => {
    setMatrix(prev => {
      const cur  = prev[scId][role];
      const next = PERMS[(PERMS.indexOf(cur) + 1) % PERMS.length];
      return { ...prev, [scId]: { ...prev[scId], [role]: next } };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch("/api/adm/role-permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: matrixToRows(matrix) }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const mods = [...new Set(SCREENS.map(s => s.mod))];

  return (
    <div>
      <PageHeader
        title="Matriz de Roles y Permisos"
        subtitle="Haz clic en una celda para cambiar el nivel de acceso · — Sin acceso · R Lectura · R/W Lectura y escritura"
      />

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

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: COLORS.grayLight, fontFamily: B }}>
          Cargando permisos…
        </div>
      ) : (
        <Card style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: "#FAFAFA" }}>
                <th style={{
                  padding: "10px 16px", textAlign: "left", fontSize: 10,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  color: COLORS.grayLight, fontWeight: 800,
                  borderBottom: `2px solid ${COLORS.border}`, fontFamily: H,
                  minWidth: 220, position: "sticky", left: 0, background: "#FAFAFA", zIndex: 2,
                }}>
                  Pantalla
                </th>
                {ROLES.map(r => {
                  const cfg = ROL_CFG[r];
                  return (
                    <th key={r} style={{
                      padding: "10px 10px", textAlign: "center", fontSize: 10,
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      color: cfg.color, fontWeight: 800,
                      borderBottom: `2px solid ${COLORS.border}`, fontFamily: H,
                      whiteSpace: "nowrap", minWidth: 80,
                    }}>
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
                  <tr key={`sep-${mod}`}>
                    <td colSpan={ROLES.length + 1} style={{
                      padding: "6px 16px",
                      background: modColor + "12",
                      borderBottom: `1px solid ${modColor}30`,
                      borderTop: `1px solid ${modColor}30`,
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: modColor, fontFamily: "monospace", letterSpacing: "0.12em" }}>
                        {mod}
                      </span>
                    </td>
                  </tr>,
                  ...modScreens.map((sc, i) => {
                    const rowBg = i % 2 === 0 ? COLORS.white : "#FCFCFC";
                    return (
                      <tr key={sc.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: rowBg }}>
                        <td style={{ padding: "8px 16px", fontSize: 12, color: COLORS.gray, fontFamily: B, position: "sticky", left: 0, background: rowBg, zIndex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, background: modColor + "18", color: modColor, borderRadius: 3, padding: "2px 5px", fontFamily: "monospace", flexShrink: 0 }}>
                              {sc.id.toUpperCase()}
                            </span>
                            <span>{sc.label}</span>
                          </div>
                        </td>
                        {ROLES.map(role => {
                          const perm = matrix[sc.id]?.[role] ?? "—";
                          const pcfg = PERM_CFG[perm];
                          return (
                            <td key={role} style={{ padding: "7px 10px", textAlign: "center" }}>
                              <button
                                onClick={() => cycle(sc.id, role)}
                                title={`${role} → ${PERMS[(PERMS.indexOf(perm) + 1) % PERMS.length]}`}
                                style={{
                                  padding: "3px 10px", borderRadius: 20,
                                  background: pcfg.bg, color: pcfg.color,
                                  fontSize: 10, fontWeight: 800, fontFamily: H,
                                  border: `1px solid ${pcfg.color}33`,
                                  cursor: "pointer", minWidth: 36,
                                  transition: "opacity 0.1s",
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
      )}

      {/* Save bar */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 18 }}>
        <BtnPrimary onClick={handleSave} disabled={saving || loading}>
          <Icon name="check" size={14} color="#fff" />
          {saving ? "Guardando…" : "Guardar matriz"}
        </BtnPrimary>

        {saved && (
          <span style={{ fontSize: 12, color: "#2E7D32", fontFamily: B }}>
            Permisos guardados correctamente
          </span>
        )}
        {error && (
          <span style={{ fontSize: 12, color: COLORS.red, fontFamily: B }}>{error}</span>
        )}

        <span style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, marginLeft: "auto" }}>
          {ROLES.length} roles · {SCREENS.length} pantallas · {ROLES.length * SCREENS.length} celdas
        </span>
      </div>
    </div>
  );
}
