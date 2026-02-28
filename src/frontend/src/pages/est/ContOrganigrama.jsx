import { useContext, useState } from "react";
import { COLORS, H, B, getInitials, PageHeader } from "../../constants.jsx";
import { CompanyContext } from "../../App.jsx";

// ─── Org data ──────────────────────────────────────────────────────────────────
// empresa: null = aparece en ambas | brand: null = sin filtro de marca
const ORG = {
  id: "gmi", nombre: "Global Manager Iberia", cargo: "Entidad Superior",
  empresa: null, brand: null, color: "#1A1A1A",
  children: [
    {
      id: "gms", nombre: "Global Manager Spain", cargo: "Empresa",
      empresa: "GMS", brand: null, color: COLORS.red,
      children: [
        {
          id: "dg-gms", nombre: "Roberto Sánchez", cargo: "Director General",
          empresa: "GMS", brand: null, color: COLORS.red,
          children: [
            {
              id: "dc-gms", nombre: "Ana López", cargo: "Dir. Comercial",
              empresa: "GMS", brand: null, color: "#1565C0",
              children: [
                { id: "com1", nombre: "Pedro Gil",     cargo: "Responsable EPUNTO", empresa: "GMS", brand: "EPUNTO",           color: "#1565C0", children: [] },
                { id: "com2", nombre: "Laura Vega",    cargo: "Responsable LIQUID",  empresa: "GMS", brand: "LIQUID",           color: "#1565C0", children: [] },
                { id: "com3", nombre: "Sofía Ruiz",    cargo: "Resp. TLF",           empresa: "GMS", brand: "THE LIQUID FINANCE", color: "#1565C0", children: [] },
              ],
            },
            {
              id: "dp-gms", nombre: "Carmen Flores", cargo: "Dir. de Personas",
              empresa: "GMS", brand: null, color: "#2E7D32",
              children: [
                { id: "hr1", nombre: "Luis Moreno",   cargo: "Técnico RRHH",         empresa: "GMS", brand: null, color: "#2E7D32", children: [] },
                { id: "onb1", nombre: "Elena Castro", cargo: "Responsable Onboarding", empresa: "GMS", brand: null, color: "#2E7D32", children: [] },
              ],
            },
            {
              id: "dpr-gms", nombre: "Miguel Torres", cargo: "Dir. de Proyectos",
              empresa: "GMS", brand: null, color: "#6A1B9A",
              children: [
                { id: "prj1", nombre: "Javier Díaz",  cargo: "Interim Manager",  empresa: "GMS", brand: "LIQUID",  color: "#6A1B9A", children: [] },
                { id: "prj2", nombre: "Nuria Alonso", cargo: "Project Manager",  empresa: "GMS", brand: "LIQUID",  color: "#6A1B9A", children: [] },
              ],
            },
            {
              id: "rc-gms", nombre: "Isabel Romero", cargo: "Resp. de Calidad",
              empresa: "GMS", brand: null, color: "#E65100",
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: "gmp", nombre: "Global Manager Portugal", cargo: "Empresa",
      empresa: "GMP", brand: null, color: "#00695C",
      children: [
        {
          id: "dg-gmp", nombre: "António Ferreira", cargo: "Director General",
          empresa: "GMP", brand: null, color: "#00695C",
          children: [
            {
              id: "dc-gmp", nombre: "Mariana Costa", cargo: "Dir. Comercial",
              empresa: "GMP", brand: null, color: "#1565C0",
              children: [
                { id: "com4", nombre: "Rui Oliveira",  cargo: "Responsable EPUNTO", empresa: "GMP", brand: "EPUNTO",           color: "#1565C0", children: [] },
                { id: "com5", nombre: "Inês Sousa",    cargo: "Responsable LIQUID",  empresa: "GMP", brand: "LIQUID",           color: "#1565C0", children: [] },
              ],
            },
            {
              id: "dp-gmp", nombre: "Sofia Mendes", cargo: "Dir. de Personas",
              empresa: "GMP", brand: null, color: "#2E7D32",
              children: [
                { id: "hr2", nombre: "Paulo Santos", cargo: "Técnico RRHH", empresa: "GMP", brand: null, color: "#2E7D32", children: [] },
              ],
            },
            {
              id: "rc-gmp", nombre: "Carla Nunes", cargo: "Resp. de Calidad",
              empresa: "GMP", brand: null, color: "#E65100",
              children: [],
            },
          ],
        },
      ],
    },
  ],
};

// ─── Filtro: determina si un nodo es visible ──────────────────────────────────
function isVisible(node, company, brand) {
  if (node.empresa && node.empresa !== company) return false;
  if (brand && brand !== "Todos" && node.brand && node.brand !== brand) return false;
  return true;
}

function hasVisibleChildren(node, company, brand) {
  return node.children.some(c => isVisible(c, company, brand));
}

// ─── OrgNode ──────────────────────────────────────────────────────────────────
function OrgNode({ node, company, brand, depth = 0 }) {
  const [expanded, setExpanded] = useState(true);
  if (!isVisible(node, company, brand)) return null;

  const visibleChildren = node.children.filter(c => isVisible(c, company, brand));
  const hasChildren = visibleChildren.length > 0;

  const isRoot    = depth === 0;
  const isCompany = depth === 1;

  const cardBg = isRoot ? "#1A1A1A" : isCompany ? node.color : COLORS.white;
  const cardColor = isRoot || isCompany ? "#fff" : COLORS.gray;
  const borderColor = isRoot || isCompany ? "transparent" : `${node.color}55`;

  // Highlight if brand matches
  const brandMatch = brand && brand !== "Todos" && node.brand === brand;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      {/* Node card */}
      <div
        onClick={() => hasChildren && setExpanded(e => !e)}
        style={{
          background: cardBg,
          border: `2px solid ${brandMatch ? node.color : borderColor}`,
          borderRadius: 10,
          padding: isRoot ? "12px 20px" : isCompany ? "10px 18px" : "10px 14px",
          cursor: hasChildren ? "pointer" : "default",
          minWidth: isRoot ? 220 : isCompany ? 200 : 150,
          maxWidth: 220,
          textAlign: "center",
          boxShadow: brandMatch ? `0 0 0 3px ${node.color}44` : "0 2px 8px rgba(0,0,0,0.07)",
          transition: "box-shadow 0.15s, transform 0.15s",
          userSelect: "none",
          position: "relative",
        }}
        onMouseEnter={e => { if (hasChildren) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.13)"; } }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = brandMatch ? `0 0 0 3px ${node.color}44` : "0 2px 8px rgba(0,0,0,0.07)"; }}
      >
        {/* Avatar */}
        {!isRoot && !isCompany && (
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: `${node.color}22`, border: `2px solid ${node.color}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 8px", fontSize: 12, fontWeight: 800, color: node.color, fontFamily: H,
          }}>
            {getInitials(node.nombre)}
          </div>
        )}
        <div style={{ fontSize: isRoot ? 13 : isCompany ? 13 : 12, fontWeight: 800, color: cardColor, fontFamily: H, lineHeight: 1.3 }}>
          {node.nombre}
        </div>
        <div style={{ fontSize: 10, color: isRoot || isCompany ? "rgba(255,255,255,0.65)" : COLORS.grayLight, fontFamily: B, marginTop: 3 }}>
          {node.cargo}
        </div>
        {/* Brand badge */}
        {node.brand && (
          <div style={{ marginTop: 6, fontSize: 8, fontWeight: 800, color: node.color, background: `${node.color}18`, padding: "2px 8px", borderRadius: 10, fontFamily: H, display: "inline-block" }}>
            {node.brand}
          </div>
        )}
        {/* Expand indicator */}
        {hasChildren && (
          <div style={{
            position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)",
            width: 18, height: 18, borderRadius: "50%",
            background: isRoot || isCompany ? "rgba(255,255,255,0.2)" : COLORS.bg,
            border: `1px solid ${isRoot || isCompany ? "rgba(255,255,255,0.3)" : COLORS.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, color: isRoot || isCompany ? "#fff" : COLORS.grayLight,
            zIndex: 1,
          }}>
            {expanded ? "−" : "+"}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <>
          {/* Vertical line down */}
          <div style={{ width: 2, height: 24, background: COLORS.border, flexShrink: 0, marginTop: 10 }} />

          {visibleChildren.length === 1 ? (
            /* Single child: straight line */
            <OrgNode node={visibleChildren[0]} company={company} brand={brand} depth={depth + 1} />
          ) : (
            /* Multiple children: horizontal branch */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Horizontal connector */}
              <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
                {/* Top horizontal bar */}
                <div style={{
                  position: "absolute", top: 0,
                  left: "calc(50% / " + visibleChildren.length + " + 8px)",
                  right: "calc(50% / " + visibleChildren.length + " + 8px)",
                  height: 2, background: COLORS.border,
                }} />
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  {visibleChildren.map((child, i) => (
                    <div key={child.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      {/* Vertical drop to child */}
                      <div style={{ width: 2, height: 20, background: COLORS.border }} />
                      <OrgNode node={child} company={company} brand={brand} depth={depth + 1} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ContOrganigrama() {
  const { company, brand } = useContext(CompanyContext);
  const [brandFiltro, setBrandFiltro] = useState("Todos");

  const BRANDS = ["Todos", "EPUNTO", "LIQUID", "THE LIQUID FINANCE"];

  // Count visible nodes
  function countNodes(node) {
    if (!isVisible(node, company, brandFiltro)) return 0;
    return 1 + node.children.reduce((s, c) => s + countNodes(c), 0);
  }
  const total = countNodes(ORG) - 1; // minus GMI root

  return (
    <div>
      <PageHeader
        title="Organigrama"
        subtitle={`Estructura organizativa · ${company === "GMS" ? "Global Manager Spain" : "Global Manager Portugal"}`}
      />

      {/* Info strip */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "stretch" }}>
        <div style={{ flex: 1, background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.red, fontFamily: H }}>{total}</div>
          <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, lineHeight: 1.4 }}>
            Personas visibles<br />con filtros activos
          </div>
        </div>
        <div style={{ flex: 3, background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "12px 18px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, fontFamily: H, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
            Filtrar por marca
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {BRANDS.map(b => (
              <button key={b} onClick={() => setBrandFiltro(b)}
                style={{
                  padding: "5px 12px", border: `1px solid ${brandFiltro === b ? COLORS.red : COLORS.border}`,
                  borderRadius: 20, background: brandFiltro === b ? "#FFF0F0" : COLORS.white,
                  color: brandFiltro === b ? COLORS.red : COLORS.gray,
                  fontSize: 11, fontWeight: brandFiltro === b ? 800 : 500,
                  fontFamily: H, cursor: "pointer", whiteSpace: "nowrap",
                }}>
                {b}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, marginLeft: "auto", whiteSpace: "nowrap" }}>
            Haz clic en un nodo para colapsar sus dependencias
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{
        background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12,
        padding: "32px 24px", overflowX: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "center", minWidth: "fit-content" }}>
          <OrgNode node={ORG} company={company} brand={brandFiltro} depth={0} />
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "12px 16px", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, marginTop: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, fontFamily: H, textTransform: "uppercase", letterSpacing: "0.08em" }}>Leyenda</span>
        {[
          { color: COLORS.red,   label: "Global Manager Spain" },
          { color: "#00695C",    label: "Global Manager Portugal" },
          { color: "#1565C0",    label: "Dirección Comercial" },
          { color: "#2E7D32",    label: "Dirección de Personas" },
          { color: "#6A1B9A",    label: "Dirección de Proyectos" },
          { color: "#E65100",    label: "Calidad" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
            <span style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
