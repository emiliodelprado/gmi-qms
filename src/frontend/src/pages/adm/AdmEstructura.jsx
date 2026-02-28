import { useState } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, Badge } from "../../constants.jsx";

const TREE = [
  {
    id: "gmi", label: "Global Manager Iberia", tipo: "Grupo", code: "GMI",
    children: [
      {
        id: "gms", label: "Global Manager Spain", tipo: "Entidad Legal", code: "GMS",
        children: [
          { id: "epunto",  label: "EPUNTO",             tipo: "Marca", code: "EPT" },
          { id: "liquid",  label: "LIQUID",             tipo: "Marca", code: "LIQ" },
          { id: "tlf",     label: "THE LIQUID FINANCE", tipo: "Marca", code: "TLF" },
        ],
      },
      {
        id: "gmp", label: "Global Manager Portugal", tipo: "Entidad Legal", code: "GMP",
        children: [
          { id: "epunto-pt", label: "EPUNTO Portugal", tipo: "Marca", code: "EPT-PT" },
          { id: "liquid-pt", label: "LIQUID Portugal", tipo: "Marca", code: "LIQ-PT" },
        ],
      },
    ],
  },
];

const TIPO_CFG = {
  "Grupo":        { bg: "#F5E6E6", color: COLORS.red,   icon: "strategy"   },
  "Entidad Legal":{ bg: "#E3F2FD", color: "#1565C0",    icon: "briefcase"  },
  "Marca":        { bg: "#F0F4F0", color: "#2E7D32",    icon: "operations" },
};

function TreeNode({ node, depth = 0 }) {
  const [open, setOpen] = useState(true);
  const cfg = TIPO_CFG[node.tipo] ?? { bg: "#F0F0F0", color: "#555", icon: "folder" };
  const hasChildren = node.children?.length > 0;

  return (
    <div style={{ marginLeft: depth * 32 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", marginBottom: 6,
        background: COLORS.white, border: `1px solid ${COLORS.border}`,
        borderRadius: 8, borderLeft: `4px solid ${cfg.color}`,
      }}>
        <button onClick={() => hasChildren && setOpen(o => !o)}
          style={{ background: "none", border: "none", cursor: hasChildren ? "pointer" : "default", padding: 0, display: "flex", width: 14 }}>
          {hasChildren && (
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={COLORS.grayLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </button>
        <div style={{ width: 32, height: 32, borderRadius: 7, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={cfg.icon} size={14} color={cfg.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{node.label}</div>
          <div style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: "monospace" }}>{node.code}</div>
        </div>
        <Badge label={node.tipo} bg={cfg.bg} color={cfg.color} />
        <button style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: "4px 9px", cursor: "pointer" }}>
          <Icon name="edit" size={13} color={COLORS.grayLight} />
        </button>
        <button style={{ background: "#FFF8F8", border: "1px solid #F5CCCC", borderRadius: 5, padding: "4px 9px", cursor: "pointer" }}>
          <Icon name="plus" size={13} color={COLORS.red} />
        </button>
      </div>
      {hasChildren && open && node.children.map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function AdmEstructura() {
  return (
    <div>
      <PageHeader title="Estructura Corporativa" subtitle="Árbol jerárquico editable: Grupo, Entidades Legales y Marcas" />
      {TREE.map(node => <TreeNode key={node.id} node={node} />)}
    </div>
  );
}
