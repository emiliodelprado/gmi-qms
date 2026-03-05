import { useState, useEffect } from "react";
import { COLORS, H, B, Card, PageHeader, apiFetch } from "../../constants.jsx";

const selStyle = {
  padding: "8px 32px 8px 12px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 700,
  fontFamily: H,
  color: COLORS.gray,
  background: `${COLORS.white} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236B6B6B' strokeWidth='2.5' strokeLinecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 10px center`,
  cursor: "pointer",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
};

const thStyle = {
  padding: "8px 12px",
  fontSize: 11,
  fontWeight: 800,
  fontFamily: H,
  color: COLORS.grayLight,
  textAlign: "left",
  borderBottom: `2px solid ${COLORS.border}`,
  whiteSpace: "nowrap",
  background: "#FAFAFA",
  position: "sticky",
  top: 0,
};

const tdStyle = {
  padding: "6px 12px",
  fontSize: 12,
  fontFamily: B,
  color: COLORS.gray,
  borderBottom: `1px solid ${COLORS.border}`,
  maxWidth: 300,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const TYPE_COLORS = {
  INTEGER: "#1565C0",
  VARCHAR: "#2E7D32",
  TEXT: "#4A148C",
  BOOLEAN: "#E65100",
  TIMESTAMP: "#AD1457",
  DATE: "#AD1457",
  DATETIME: "#AD1457",
  SERIAL: "#1565C0",
};

function typeColor(t) {
  const key = (t || "").toUpperCase().split("(")[0].trim();
  return TYPE_COLORS[key] || COLORS.grayLight;
}

function CellValue({ val }) {
  if (val === null || val === undefined) return <span style={{ color: "#CCC", fontStyle: "italic", fontSize: 10 }}>NULL</span>;
  return String(val);
}

export default function AdmDbLogs() {
  const [tables, setTables]       = useState([]);
  const [selected, setSelected]   = useState("");
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [expandedRow, setExpandedRow] = useState(-1);
  const [rowDetail, setRowDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load table list
  useEffect(() => {
    apiFetch("/api/adm/db/tables")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(list => { setTables(list); if (list.length) setSelected(list[0]); })
      .catch(() => setError("Error al cargar las tablas"));
  }, []);

  // Load table data when selection changes
  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setError("");
    setExpandedRow(-1);
    setRowDetail(null);
    apiFetch(`/api/adm/db/tables/${selected}?limit=500`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setData(d))
      .catch(() => setError("Error al cargar los datos de la tabla"))
      .finally(() => setLoading(false));
  }, [selected]);

  // Columns visible in the table (exclude large ones)
  const largeSet = new Set(data?.large_columns || []);
  const visibleCols = data ? data.columns.filter(c => !largeSet.has(c.name)) : [];
  const hasLargeCols = largeSet.size > 0;

  const handleRowClick = (i) => {
    if (expandedRow === i) {
      setExpandedRow(-1);
      setRowDetail(null);
      return;
    }
    setExpandedRow(i);
    setRowDetail(null);
    setDetailLoading(true);
    apiFetch(`/api/adm/db/tables/${selected}/row/${i}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setRowDetail(d))
      .catch(() => setRowDetail(null))
      .finally(() => setDetailLoading(false));
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      <PageHeader
        title="Base de Datos"
        subtitle="Inspección de esquema y contenidos de las tablas"
        action={
          <select value={selected} onChange={e => setSelected(e.target.value)} style={selStyle}>
            {tables.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        }
      />

      {error && (
        <div style={{ padding: "12px 16px", background: "#FFEBEE", borderRadius: 8, color: "#C62828", fontSize: 13, fontFamily: B, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: COLORS.grayLight, fontFamily: B, fontSize: 13 }}>
          Cargando...
        </div>
      )}

      {!loading && data && (
        <>
          {/* Schema */}
          <Card style={{ padding: "16px 20px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, fontFamily: H, color: COLORS.gray, marginBottom: 12 }}>
              Esquema — <span style={{ fontWeight: 600, color: COLORS.grayLight }}>{data.table}</span>
              <span style={{ fontWeight: 400, fontSize: 11, color: COLORS.grayLight, marginLeft: 12 }}>
                {data.columns.length} columnas · {data.total} filas
                {hasLargeCols && <> · <span style={{ color: "#4A148C" }}>{largeSet.size} campo{largeSet.size > 1 ? "s" : ""} grande{largeSet.size > 1 ? "s" : ""} oculto{largeSet.size > 1 ? "s" : ""}</span></>}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {data.columns.map(c => (
                <div key={c.name} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 10px", borderRadius: 6,
                  background: largeSet.has(c.name) ? "#F3E5F5" : "#F5F5F5",
                  border: `1px solid ${largeSet.has(c.name) ? "#CE93D8" : COLORS.border}`,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: H, color: COLORS.gray }}>{c.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "monospace", color: typeColor(c.type) }}>{c.type}</span>
                  {!c.nullable && <span style={{ fontSize: 9, fontWeight: 800, color: "#E65100", fontFamily: H }}>NOT NULL</span>}
                  {largeSet.has(c.name) && <span style={{ fontSize: 9, fontWeight: 800, color: "#7B1FA2", fontFamily: H }}>LARGE</span>}
                </div>
              ))}
            </div>
          </Card>

          {/* Data table */}
          <Card style={{ overflow: "hidden" }}>
            {hasLargeCols && (
              <div style={{ padding: "8px 16px", background: "#F3E5F5", fontSize: 11, fontFamily: B, color: "#7B1FA2", borderBottom: `1px solid #CE93D8` }}>
                Campos grandes ocultos ({[...largeSet].join(", ")}). Haz clic en una fila para ver todos los campos.
              </div>
            )}
            <div style={{ overflowX: "auto", maxHeight: 600 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: visibleCols.length * 120 }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 40, textAlign: "center" }}>#</th>
                    {visibleCols.map(c => (
                      <th key={c.name} style={thStyle}>{c.name}</th>
                    ))}
                  </tr>
                </thead>
                {data.rows.length === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={visibleCols.length + 1} style={{ padding: 32, textAlign: "center", color: COLORS.grayLight, fontFamily: B, fontSize: 13 }}>
                        Tabla vacía
                      </td>
                    </tr>
                  </tbody>
                ) : data.rows.map((row, i) => {
                    const isExpanded = expandedRow === i;
                    return (
                      <tbody key={i}>
                        <tr
                          onClick={() => handleRowClick(i)}
                          style={{
                            background: isExpanded ? "#E8EAF6" : i % 2 === 0 ? COLORS.white : "#FAFAFA",
                            cursor: "pointer",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = "#F0F0F0"; }}
                          onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = i % 2 === 0 ? COLORS.white : "#FAFAFA"; }}
                        >
                          <td style={{ ...tdStyle, textAlign: "center", color: COLORS.grayLight, fontSize: 10 }}>{i + 1}</td>
                          {visibleCols.map(c => (
                            <td key={c.name} style={tdStyle} title={String(row[c.name] ?? "")}>
                              <CellValue val={row[c.name]} />
                            </td>
                          ))}
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={visibleCols.length + 1} style={{ padding: 0, background: "#F5F5F5", borderBottom: `2px solid ${COLORS.border}` }}>
                              {detailLoading ? (
                                <div style={{ padding: 16, fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>Cargando detalle...</div>
                              ) : rowDetail ? (
                                <div style={{ padding: "12px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
                                  {data.columns.map(c => (
                                    <div key={c.name} style={{ display: "flex", gap: 8, padding: "4px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                                      <span style={{
                                        fontSize: 11, fontWeight: 800, fontFamily: H, color: largeSet.has(c.name) ? "#7B1FA2" : COLORS.grayLight,
                                        minWidth: 120, flexShrink: 0,
                                      }}>
                                        {c.name}
                                      </span>
                                      <span style={{ fontSize: 12, fontFamily: B, color: COLORS.gray, wordBreak: "break-all", whiteSpace: "pre-wrap" }}>
                                        <CellValue val={rowDetail[c.name]} />
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ padding: 16, fontSize: 12, color: "#C62828", fontFamily: B }}>Error al cargar el detalle</div>
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    );
                  })}
              </table>
            </div>
            {data.total > data.rows.length && (
              <div style={{ padding: "8px 16px", borderTop: `1px solid ${COLORS.border}`, fontSize: 11, color: COLORS.grayLight, fontFamily: B, textAlign: "right" }}>
                Mostrando {data.rows.length} de {data.total} filas
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
