import { useState, useEffect, useMemo } from "react";
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
function PersonCard({ collab, brands, puestos, supervisorName }) {
  const full = `${collab.nombre} ${collab.apellidos}`;
  const clr = avatarColor(full);

  return (
    <div
      style={{
        background: "#fff", border: `1.5px solid ${COLORS.border}`, borderRadius: 10,
        padding: "12px 14px", minWidth: 155, maxWidth: 220, textAlign: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
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
      {brands.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center", marginTop: 3 }}>
          {brands.map(code => (
            <span key={code} style={{
              fontSize: 8, fontWeight: 800, color: "#6A1B9A", background: "#F3E5F5",
              padding: "1px 7px", borderRadius: 8, fontFamily: H,
            }}>
              {code}
            </span>
          ))}
        </div>
      )}
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
  const [entities, setEntities]       = useState([]);
  const [entityId, setEntityId]       = useState(null);
  const [activeBrands, setActiveBrands] = useState(new Set());
  const [collabs, setCollabs]         = useState([]);
  const [depts, setDepts]             = useState([]);
  const [positions, setPositions]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  /* ── fetch ─────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    Promise.all([
      apiFetch("/api/adm/structure").then(r => r.ok ? r.json() : []),
      apiFetch("/api/tal/collaborators?activo=1").then(r => r.ok ? r.json() : []),
      apiFetch("/api/adm/departments").then(r => r.ok ? r.json() : []),
      apiFetch("/api/adm/positions").then(r => r.ok ? r.json() : []),
    ]).then(([ents, cols, deps, pos]) => {
      setEntities(ents.filter(e => e.activo));
      setCollabs(cols);
      setDepts(deps);
      setPositions(pos);
      const legal = ents.filter(e => e.tipo === "Entidad Legal" && e.activo);
      if (legal.length) setEntityId(legal[0].id);
    }).catch(() => setError("Error al cargar los datos."))
      .finally(() => setLoading(false));
  }, []);

  // Selector: only Entidad Legal
  const selectorEntities = entities.filter(e => e.tipo === "Entidad Legal");

  // Child brands of the selected entity
  const childBrands = useMemo(
    () => entities.filter(e => e.parent_id === entityId && e.tipo === "Marca"),
    [entities, entityId],
  );

  // Reset activeBrands when entity changes (all on by default)
  useEffect(() => {
    setActiveBrands(new Set(childBrands.map(b => b.id)));
  }, [childBrands]);

  const toggleBrand = (brandId) => {
    setActiveBrands(prev => {
      const next = new Set(prev);
      if (next.has(brandId)) next.delete(brandId); else next.add(brandId);
      return next;
    });
  };

  /* ── process ───────────────────────────────────────────────────────────────── */
  const chartData = useMemo(() => {
    if (!entityId) return { deptGroups: [], unassigned: [], uniqueCount: 0 };

    const posMap  = new Map();
    positions.forEach(p => posMap.set(p.id, p));
    const deptMap = new Map();
    depts.forEach(d => deptMap.set(d.id, d));

    const childBrandIds = new Set(childBrands.map(b => b.id));

    // Collect all relevant assignments: entity-level + brand-level
    // Both are included; merge() will consolidate per person per department
    const entityCollabs = [];
    const seen = new Set();
    collabs.forEach(c => {
      const entityAssign = c.entity_assignments?.find(a => a.entity_id === entityId);
      const brandAssigns = c.entity_assignments?.filter(a => activeBrands.has(a.entity_id)) || [];

      if (entityAssign) {
        entityCollabs.push({ collab: c, assignment: entityAssign });
        seen.add(c.id);
      }
      brandAssigns.forEach(ba => {
        entityCollabs.push({ collab: c, assignment: ba });
        seen.add(c.id);
      });
    });

    // group by department
    const grouped    = new Map();
    const unassigned = [];

    entityCollabs.forEach(({ collab, assignment }) => {
      // Map each dept → position ids that link to it
      const deptPosIds = new Map();
      (assignment.position_ids || []).forEach(pid => {
        const p = posMap.get(pid);
        if (p) (p.departamento_ids || []).forEach(did => {
          if (!deptPosIds.has(did)) deptPosIds.set(did, new Set());
          deptPosIds.get(did).add(pid);
        });
      });

      if (deptPosIds.size === 0) { unassigned.push({ collab, assignment }); return; }

      // Place collaborator in ALL departments, but only with relevant positions
      let placed = false;
      deptPosIds.forEach((posIds, did) => {
        const d = deptMap.get(did);
        if (d) {
          if (!grouped.has(d.id)) grouped.set(d.id, []);
          const relevantPuestos = (assignment.puestos || []).filter(p => posIds.has(p.id));
          grouped.get(d.id).push({ collab, assignment, relevantPuestos });
          placed = true;
        }
      });
      if (!placed) unassigned.push({ collab, assignment });
    });

    // Merge multiple assignments for the same person into one card
    // Uses relevantPuestos (dept-filtered) when available, falls back to all puestos for unassigned
    const merge = (entries) => {
      const byId = new Map();
      entries.forEach(({ collab, assignment, relevantPuestos }) => {
        if (!byId.has(collab.id)) {
          byId.set(collab.id, { collab, brands: [], puestos: [], seenPos: new Set(), supervisorName: null });
        }
        const m = byId.get(collab.id);
        if (childBrandIds.has(assignment.entity_id)) m.brands.push(assignment.entity_code);
        (relevantPuestos || assignment.puestos || []).forEach(p => {
          if (!m.seenPos.has(p.id)) { m.seenPos.add(p.id); m.puestos.push(p); }
        });
        if (assignment.supervisor_nombre && !m.supervisorName) m.supervisorName = assignment.supervisor_nombre;
      });
      return [...byId.values()];
    };

    const deptGroups = [...grouped.entries()]
      .map(([id, members]) => ({ dept: deptMap.get(id), members: merge(members) }))
      .sort((a, b) => (a.dept.nivel - b.dept.nivel) || a.dept.nombre.localeCompare(b.dept.nombre));

    return { deptGroups, unassigned: merge(unassigned), uniqueCount: seen.size };
  }, [entityId, collabs, depts, positions, entities, childBrands, activeBrands]);

  /* ── PDF ───────────────────────────────────────────────────────────────────── */
  const handlePrint = async () => {
    if (!selectedEntity || chartData.uniqueCount === 0) return;

    // Fetch entity logo
    let entityLogoHtml = "";
    try {
      const r = await apiFetch(`/api/adm/ui/brand-settings?company_id=${selectedEntity.code}&brand_id=`);
      if (r.ok) {
        const s = await r.json();
        if (s?.logo_data) entityLogoHtml = `<img src="${s.logo_data}" alt="" style="height:52px;max-width:180px;object-fit:contain;"/>`;
      }
    } catch {}

    const today = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

    const NCLR = { 0: "#A91E22", 1: "#E65100", 2: "#1565C0", 3: "#2E7D32", 4: "#888888" };
    const NLBL = { 0: "Corporativo", 1: "Dirección", 2: "Área", 3: "Sección", 4: "Operacional" };

    const cardHtml = (m) => {
      const full = `${m.collab.nombre} ${m.collab.apellidos}`;
      const clr = avatarColor(full);
      const initials = getInitials(full);
      const brandsHtml = m.brands.length
        ? `<div style="display:flex;flex-wrap:wrap;gap:3px;justify-content:center;margin-top:3px;">${m.brands.map(c => `<span style="font-size:7px;font-weight:800;color:#6A1B9A;background:#F3E5F5;padding:1px 6px;border-radius:6px;">${c}</span>`).join("")}</div>`
        : "";
      const puestosHtml = m.puestos.length
        ? `<div style="display:flex;flex-wrap:wrap;gap:3px;justify-content:center;margin-top:5px;">${m.puestos.map(p => `<span style="font-size:8px;font-weight:700;color:#888;background:#f5f5f5;padding:2px 6px;border-radius:6px;">${p.nombre}</span>`).join("")}</div>`
        : "";
      const supHtml = m.supervisorName ? `<div style="font-size:8px;color:#aaa;margin-top:5px;">↑ ${m.supervisorName}</div>` : "";
      return `<div style="background:#fff;border:1.5px solid #e8e8e8;border-radius:8px;padding:10px 12px;text-align:center;min-width:130px;max-width:180px;break-inside:avoid;">
        <div style="width:32px;height:32px;border-radius:50%;background:${clr}22;border:2px solid ${clr}44;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;font-size:11px;font-weight:800;color:${clr};">${initials}</div>
        <div style="font-size:11px;font-weight:800;color:#333;line-height:1.3;">${full}</div>
        ${brandsHtml}${puestosHtml}${supHtml}
      </div>`;
    };

    let deptsHtml = "";
    let lastNivel = null;
    chartData.deptGroups.forEach(({ dept, members }) => {
      const nc = NCLR[dept.nivel] || "#888";
      const nl = NLBL[dept.nivel] || `Nivel ${dept.nivel}`;
      if (dept.nivel !== lastNivel) {
        deptsHtml += `<div style="display:flex;align-items:center;gap:8px;margin:${lastNivel === null ? "0" : "20px"} 0 8px;">
          <div style="width:18px;height:2px;background:${nc};border-radius:1px;"></div>
          <span style="font-size:9px;font-weight:800;color:${nc};text-transform:uppercase;letter-spacing:0.1em;">Nivel ${dept.nivel} · ${nl}</span>
          <div style="flex:1;height:1px;background:${nc}30;"></div>
        </div>`;
        lastNivel = dept.nivel;
      }
      deptsHtml += `<div style="margin-bottom:8px;border:1px solid #e8e8e8;border-left:4px solid ${nc};border-radius:8px;padding:12px 14px;">
        <div style="font-size:11px;font-weight:800;color:#333;margin-bottom:8px;">${dept.nombre} <span style="font-size:9px;font-weight:500;color:#aaa;">(${members.length})</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;">${members.map(cardHtml).join("")}</div>
      </div>`;
    });

    if (chartData.unassigned.length > 0) {
      deptsHtml += `<div style="display:flex;align-items:center;gap:8px;margin:20px 0 8px;">
        <div style="width:18px;height:2px;background:#ccc;border-radius:1px;"></div>
        <span style="font-size:9px;font-weight:800;color:#aaa;text-transform:uppercase;letter-spacing:0.1em;">Sin departamento asignado</span>
        <div style="flex:1;height:1px;background:#e0e0e0;"></div>
      </div>
      <div style="border:1px solid #e8e8e8;border-left:4px solid #ccc;border-radius:8px;padding:12px 14px;">
        <div style="display:flex;flex-wrap:wrap;gap:10px;">${chartData.unassigned.map(cardHtml).join("")}</div>
      </div>`;
    }

    const footerParts = [
      selectedEntity.denominacion_social,
      selectedEntity.domicilio_social,
      selectedEntity.nif ? `NIF: ${selectedEntity.nif}` : null,
    ].filter(Boolean);

    const win = window.open("", "_blank", "width=1000,height=800");
    win.document.write(`<!DOCTYPE html><html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Organigrama · ${selectedEntity.label}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Nunito Sans', Arial, sans-serif; color: #333; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px 48px; }
    .doc-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #ac2523; padding-bottom: 14px; margin-bottom: 20px; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #eee; font-size: 9px; color: #aaa; text-align: center; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 20px 32px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="doc-header">
      <img src="/logo.png" alt="GMI" style="height:48px;"/>
      ${entityLogoHtml}
    </div>
    <div style="margin-bottom:20px;">
      <div style="font-size:18px;font-weight:800;color:#1a1a1a;margin-bottom:3px;">Organigrama</div>
      <div style="font-size:11px;color:#888;letter-spacing:0.06em;text-transform:uppercase;">${selectedEntity.label} · ${today}</div>
    </div>
    ${deptsHtml}
    ${footerParts.length ? `<div class="footer">${footerParts.join(" · ")}</div>` : ""}
  </div>
  <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script>
</body></html>`);
    win.document.close();
  };

  /* ── render helpers ────────────────────────────────────────────────────────── */
  const selectedEntity = selectorEntities.find(e => e.id === entityId);
  const totalPersons = chartData.uniqueCount || 0;

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
          {selectorEntities.map(ent => (
            <option key={ent.id} value={ent.id}>
              {ent.label} ({ent.code})
            </option>
          ))}
        </select>
        {!loading && (
          <span style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>
            {totalPersons} {totalPersons === 1 ? "persona" : "personas"} · {chartData.deptGroups?.length || 0} dptos.
          </span>
        )}
        {!loading && totalPersons > 0 && (
          <button onClick={handlePrint} style={{
            marginLeft: "auto", padding: "7px 16px", background: "#A91E22", color: "#fff",
            border: "none", borderRadius: 7, fontSize: 11, fontWeight: 700, fontFamily: H,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="1.8">
              <path d="M6 1v7M3 6l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 10h10" strokeLinecap="round"/>
            </svg>
            PDF
          </button>
        )}
      </div>

      {/* Brand toggles */}
      {childBrands.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, fontWeight: 800, color: COLORS.grayLight, fontFamily: H,
            textTransform: "uppercase", letterSpacing: "0.07em",
          }}>
            Marcas
          </span>
          {childBrands.map(b => {
            const on = activeBrands.has(b.id);
            return (
              <button key={b.id} onClick={() => toggleBrand(b.id)} style={{
                padding: "5px 14px", borderRadius: 20, cursor: "pointer",
                fontSize: 11, fontWeight: 700, fontFamily: H, letterSpacing: "0.02em",
                border: `1.5px solid ${on ? "#6A1B9A" : COLORS.border}`,
                background: on ? "#F3E5F5" : "#fff",
                color: on ? "#6A1B9A" : COLORS.grayLight,
                transition: "all 0.15s ease",
              }}>
                {b.label} ({b.code})
              </button>
            );
          })}
        </div>
      )}

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
        <div>
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
                    {members.map(m => (
                      <PersonCard
                        key={m.collab.id}
                        collab={m.collab}
                        brands={m.brands}
                        puestos={m.puestos}
                        supervisorName={m.supervisorName}
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
                  {chartData.unassigned.map(m => (
                    <PersonCard
                      key={m.collab.id}
                      collab={m.collab}
                      brands={m.brands}
                      puestos={m.puestos}
                      supervisorName={m.supervisorName}
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
        </div>
      )}
    </div>
  );
}
