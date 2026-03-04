import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { COLORS, H, B, getInitials, PageHeader, Card, apiFetch } from "../../constants.jsx";

// ── Constants ───────────────────────────────────────────────────────────────────
const NIVEL_LABELS = { 0: "Corporativo", 1: "Dirección", 2: "Área", 3: "Sección", 4: "Operacional" };
const NIVEL_COLORS = { 0: "#A91E22", 1: "#E65100", 2: "#1565C0", 3: "#2E7D32", 4: "#888888" };

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return `hsl(${Math.abs(h) % 360}, 45%, 45%)`;
}

// ── PersonCard ──────────────────────────────────────────────────────────────────
function PersonCard({ collab, assignment, supervisorName }) {
  const full = `${collab.nombre} ${collab.apellidos}`;
  const clr = avatarColor(full);
  const puestos = assignment.puestos || [];

  return (
    <div
      data-collab-id={collab.id}
      style={{
        background: "#fff", border: `1.5px solid ${COLORS.border}`, borderRadius: 10,
        padding: "12px 14px", minWidth: 155, maxWidth: 220, textAlign: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)", position: "relative",
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: `${clr}22`, border: `2px solid ${clr}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 8px", fontSize: 12, fontWeight: 800, color: clr, fontFamily: H,
      }}>
        {getInitials(full)}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.gray, fontFamily: H, lineHeight: 1.3 }}>
        {full}
      </div>
      {puestos.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center", marginTop: 6 }}>
          {puestos.map(p => (
            <span key={p.id} style={{
              fontSize: 9, fontWeight: 700, color: COLORS.grayLight,
              background: COLORS.bg, padding: "2px 7px", borderRadius: 8, fontFamily: B,
            }}>
              {p.nombre}
            </span>
          ))}
        </div>
      )}
      {supervisorName && (
        <div style={{
          fontSize: 9, color: COLORS.grayLight, fontFamily: B, marginTop: 6,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
        }}>
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke={COLORS.grayLight} strokeWidth="1.5">
            <path d="M5 8V2M2 5l3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {supervisorName}
        </div>
      )}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────────
export default function ContOrganigrama() {
  const [entities, setEntities]   = useState([]);
  const [entityId, setEntityId]   = useState(null);
  const [collabs, setCollabs]     = useState([]);
  const [depts, setDepts]         = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const containerRef              = useRef(null);
  const [lines, setLines]         = useState([]);
  const [svgSize, setSvgSize]     = useState({ w: 0, h: 0 });

  /* ── fetch ─────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    Promise.all([
      apiFetch("/api/adm/structure").then(r => r.ok ? r.json() : []),
      apiFetch("/api/tal/collaborators?activo=1").then(r => r.ok ? r.json() : []),
      apiFetch("/api/adm/departments").then(r => r.ok ? r.json() : []),
      apiFetch("/api/adm/positions").then(r => r.ok ? r.json() : []),
    ]).then(([ents, cols, deps, pos]) => {
      const selectable = ents.filter(e => e.tipo !== "Grupo" && e.activo);
      setEntities(selectable);
      setCollabs(cols);
      setDepts(deps);
      setPositions(pos);
      if (selectable.length) setEntityId(selectable[0].id);
    }).catch(() => setError("Error al cargar los datos."))
      .finally(() => setLoading(false));
  }, []);

  /* ── process ───────────────────────────────────────────────────────────────── */
  const chartData = useMemo(() => {
    if (!entityId) return { deptGroups: [], unassigned: [], supervisorPairs: [] };

    const posMap  = new Map();
    positions.forEach(p => posMap.set(p.id, p));
    const deptMap = new Map();
    depts.forEach(d => deptMap.set(d.id, d));

    // collaborators with an assignment in this entity
    const entityCollabs = [];
    collabs.forEach(c => {
      const ea = c.entity_assignments?.find(a => a.entity_id === entityId);
      if (ea) entityCollabs.push({ collab: c, assignment: ea });
    });

    // group by department
    const grouped    = new Map();
    const unassigned = [];

    entityCollabs.forEach(({ collab, assignment }) => {
      const deptIds = new Set();
      (assignment.position_ids || []).forEach(pid => {
        const p = posMap.get(pid);
        if (p) (p.departamento_ids || []).forEach(did => deptIds.add(did));
      });

      if (deptIds.size === 0) { unassigned.push({ collab, assignment }); return; }

      let bestDept = null, bestNivel = Infinity;
      deptIds.forEach(did => {
        const d = deptMap.get(did);
        if (d && d.nivel < bestNivel) { bestDept = d; bestNivel = d.nivel; }
      });

      if (bestDept) {
        if (!grouped.has(bestDept.id)) grouped.set(bestDept.id, []);
        grouped.get(bestDept.id).push({ collab, assignment });
      } else {
        unassigned.push({ collab, assignment });
      }
    });

    const deptGroups = [...grouped.entries()]
      .map(([id, members]) => ({ dept: deptMap.get(id), members }))
      .sort((a, b) => (a.dept.nivel - b.dept.nivel) || a.dept.nombre.localeCompare(b.dept.nombre));

    // supervisor → subordinate pairs (both must be in this entity)
    const idSet = new Set(entityCollabs.map(ec => ec.collab.id));
    const supervisorPairs = [];
    entityCollabs.forEach(({ collab, assignment }) => {
      if (assignment.supervisor_id && idSet.has(assignment.supervisor_id))
        supervisorPairs.push({ supId: assignment.supervisor_id, subId: collab.id });
    });

    return { deptGroups, unassigned, supervisorPairs };
  }, [entityId, collabs, depts, positions]);

  /* ── SVG lines ─────────────────────────────────────────────────────────────── */
  const updateLines = useCallback(() => {
    const ct = containerRef.current;
    if (!ct || !chartData.supervisorPairs?.length) { setLines([]); return; }

    setSvgSize({ w: ct.scrollWidth, h: ct.scrollHeight });
    const cr = ct.getBoundingClientRect();
    const nl = [];

    chartData.supervisorPairs.forEach(({ supId, subId }) => {
      const se = ct.querySelector(`[data-collab-id="${supId}"]`);
      const be = ct.querySelector(`[data-collab-id="${subId}"]`);
      if (!se || !be) return;
      const sr = se.getBoundingClientRect();
      const br = be.getBoundingClientRect();
      nl.push({
        x1: sr.left + sr.width / 2 - cr.left + ct.scrollLeft,
        y1: sr.bottom - cr.top + ct.scrollTop,
        x2: br.left + br.width / 2 - cr.left + ct.scrollLeft,
        y2: br.top - cr.top + ct.scrollTop,
      });
    });
    setLines(nl);
  }, [chartData.supervisorPairs]);

  useEffect(() => {
    const t = setTimeout(updateLines, 120);
    return () => clearTimeout(t);
  }, [updateLines, entityId]);

  useEffect(() => {
    const ct = containerRef.current;
    if (!ct) return;
    const ro = new ResizeObserver(updateLines);
    ro.observe(ct);
    window.addEventListener("resize", updateLines);
    return () => { ro.disconnect(); window.removeEventListener("resize", updateLines); };
  }, [updateLines]);

  /* ── render helpers ────────────────────────────────────────────────────────── */
  const selectedEntity = entities.find(e => e.id === entityId);
  const totalPersons =
    (chartData.deptGroups?.reduce((s, g) => s + g.members.length, 0) || 0) +
    (chartData.unassigned?.length || 0);

  const sel = {
    padding: "8px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 7,
    fontSize: 13, color: COLORS.gray, background: "#fff", outline: "none",
    fontFamily: B, cursor: "pointer", minWidth: 280,
  };

  return (
    <div>
      <PageHeader title="Organigrama" subtitle="Estructura organizacional por entidad" />

      {/* Selector + counter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{
          fontSize: 10, fontWeight: 800, color: COLORS.grayLight, fontFamily: H,
          textTransform: "uppercase", letterSpacing: "0.07em",
        }}>
          Entidad
        </span>
        <select style={sel} value={entityId || ""} onChange={e => setEntityId(Number(e.target.value))}>
          {entities.map(ent => (
            <option key={ent.id} value={ent.id}>
              {ent.label} ({ent.code}) — {ent.tipo}
            </option>
          ))}
        </select>
        {!loading && (
          <span style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>
            {totalPersons} {totalPersons === 1 ? "persona" : "personas"} · {chartData.deptGroups?.length || 0} dptos.
          </span>
        )}
      </div>

      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
          padding: "10px 14px", fontSize: 13, color: "#B91C1C", marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: COLORS.grayLight, fontFamily: B }}>
          Cargando organigrama…
        </div>
      ) : totalPersons === 0 ? (
        <Card style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: COLORS.grayLight, fontFamily: B }}>
            No hay colaboradores asignados a {selectedEntity?.label || "esta entidad"}.
          </div>
        </Card>
      ) : (
        <div ref={containerRef} style={{ position: "relative", overflowX: "auto" }}>
          {/* SVG connector lines */}
          {lines.length > 0 && (
            <svg
              style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 1 }}
              width={svgSize.w || "100%"}
              height={svgSize.h || "100%"}
            >
              {lines.map((l, i) => {
                const my = (l.y1 + l.y2) / 2;
                return (
                  <path key={i}
                    d={`M${l.x1},${l.y1} C${l.x1},${my} ${l.x2},${my} ${l.x2},${l.y2}`}
                    fill="none" stroke={`${COLORS.red}35`} strokeWidth={2} strokeDasharray="6 3"
                  />
                );
              })}
            </svg>
          )}

          {/* Department sections */}
          {chartData.deptGroups.map(({ dept, members }, idx) => {
            const nc = NIVEL_COLORS[dept.nivel] || NIVEL_COLORS[4];
            const nl = NIVEL_LABELS[dept.nivel] || `Nivel ${dept.nivel}`;
            const prevNivel = idx > 0 ? chartData.deptGroups[idx - 1].dept.nivel : null;
            const showHeader = dept.nivel !== prevNivel;

            return (
              <div key={dept.id}>
                {showHeader && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    margin: idx === 0 ? "0 0 12px" : "24px 0 12px",
                  }}>
                    <div style={{ width: 24, height: 2, background: nc, borderRadius: 1 }} />
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: nc, fontFamily: H,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                    }}>
                      Nivel {dept.nivel} · {nl}
                    </span>
                    <div style={{ flex: 1, height: 1, background: `${nc}30` }} />
                  </div>
                )}

                <div style={{
                  marginBottom: 12,
                  background: COLORS.white, border: `1px solid ${COLORS.border}`,
                  borderLeft: `4px solid ${nc}`, borderRadius: 10,
                  padding: "14px 16px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>
                      {dept.nombre}
                    </span>
                    <span style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: B }}>
                      ({members.length})
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    {members.map(({ collab, assignment }) => (
                      <PersonCard
                        key={collab.id}
                        collab={collab}
                        assignment={assignment}
                        supervisorName={assignment.supervisor_nombre}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Sin departamento */}
          {chartData.unassigned.length > 0 && (
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                margin: chartData.deptGroups.length ? "24px 0 12px" : "0 0 12px",
              }}>
                <div style={{ width: 24, height: 2, background: COLORS.border, borderRadius: 1 }} />
                <span style={{
                  fontSize: 10, fontWeight: 800, color: COLORS.grayLight, fontFamily: H,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                }}>
                  Sin departamento asignado
                </span>
                <div style={{ flex: 1, height: 1, background: COLORS.border }} />
              </div>
              <div style={{
                background: COLORS.white, border: `1px solid ${COLORS.border}`,
                borderLeft: `4px solid ${COLORS.border}`, borderRadius: 10,
                padding: "14px 16px",
              }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {chartData.unassigned.map(({ collab, assignment }) => (
                    <PersonCard
                      key={collab.id}
                      collab={collab}
                      assignment={assignment}
                      supervisorName={assignment.supervisor_nombre}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {!loading && totalPersons > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 16, padding: "10px 16px",
          background: COLORS.white, border: `1px solid ${COLORS.border}`,
          borderRadius: 8, marginTop: 16, flexWrap: "wrap",
        }}>
          <span style={{
            fontSize: 10, fontWeight: 800, color: COLORS.grayLight, fontFamily: H,
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            Leyenda
          </span>
          {Object.entries(NIVEL_LABELS).map(([n, label]) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: NIVEL_COLORS[n] }} />
              <span style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="20" height="10">
              <line x1="0" y1="5" x2="20" y2="5" stroke={`${COLORS.red}35`} strokeWidth={2} strokeDasharray="4 2" />
            </svg>
            <span style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>Supervisor → Subordinado</span>
          </div>
        </div>
      )}
    </div>
  );
}
