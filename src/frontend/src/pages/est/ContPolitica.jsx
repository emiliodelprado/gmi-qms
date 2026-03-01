import { useState, useEffect, useRef, useContext } from "react";
import { COLORS, H, B, Card, PageHeader, BtnPrimary, apiFetch } from "../../constants.jsx";
import { CompanyContext } from "../../App.jsx";
import { PermissionsContext } from "../../contexts.jsx";

// ── Rich-text editor (contenteditable, no external deps) ──────────────────────
const TB_BTN = [
  { icon: <b>B</b>,    title: "Negrita",           cmd: "bold" },
  { icon: <i>I</i>,    title: "Cursiva",            cmd: "italic" },
  { icon: <u>S</u>,    title: "Subrayado",          cmd: "underline" },
  { icon: "H2",        title: "Título",             cmd: "formatBlock", val: "h2" },
  { icon: "¶",         title: "Párrafo normal",     cmd: "formatBlock", val: "p"  },
  { icon: "—",         title: "Separador",          cmd: "insertHorizontalRule"   },
  { icon: "•—",        title: "Lista con viñetas",  cmd: "insertUnorderedList"    },
  { icon: "1—",        title: "Lista numerada",     cmd: "insertOrderedList"      },
];

function RichTextEditor({ value, onChange }) {
  const ref = useRef(null);

  // Initialise content once; after that the user drives the DOM directly
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value || "";
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const exec = (cmd, val) => {
    ref.current?.focus();
    // eslint-disable-next-line no-undef
    document.execCommand(cmd, false, val ?? null);
  };

  const btnStyle = (active) => ({
    padding: "3px 8px", border: `1px solid ${active ? COLORS.gray : COLORS.border}`,
    borderRadius: 5, background: active ? "#F0F0F0" : "#fff",
    cursor: "pointer", fontSize: 12, fontFamily: H, color: COLORS.gray,
    minWidth: 28, textAlign: "center", lineHeight: "18px",
  });

  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 3, padding: "6px 8px", borderBottom: `1px solid ${COLORS.border}`, background: "#F9F9F9", flexWrap: "wrap" }}>
        {TB_BTN.map(({ icon, title, cmd, val }) => (
          <button
            key={title}
            type="button"
            title={title}
            onMouseDown={e => { e.preventDefault(); exec(cmd, val); }}
            style={btnStyle(false)}
          >
            {icon}
          </button>
        ))}
        <div style={{ width: 1, background: COLORS.border, margin: "0 4px" }} />
        <button
          type="button"
          title="Limpiar formato"
          onMouseDown={e => { e.preventDefault(); exec("removeFormat"); }}
          style={btnStyle(false)}
        >
          ✕
        </button>
      </div>

      {/* Editable area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML || "")}
        style={{
          minHeight: 320, padding: "14px 16px",
          fontSize: 13, lineHeight: 1.8, fontFamily: B,
          outline: "none", color: COLORS.gray,
          overflowY: "auto",
        }}
      />

      {/* Scoped styles for editor content */}
      <style>{`
        [contenteditable] h2 { font-size:15px; font-weight:800; margin:12px 0 4px; }
        [contenteditable] ul, [contenteditable] ol { padding-left:22px; margin:6px 0; }
        [contenteditable] li { margin:2px 0; }
        [contenteditable] p  { margin:0 0 8px; }
        [contenteditable] hr { border:none; border-top:1px solid #ddd; margin:12px 0; }
      `}</style>
    </div>
  );
}

// ── CSS for rich-content view (applied via a scoped wrapper class) ────────────
const RICH_CSS = `
  .rich-content h2 { font-size:15px; font-weight:800; color:#1a1a1a; margin:14px 0 4px; }
  .rich-content p  { margin:0 0 10px; }
  .rich-content ul, .rich-content ol { padding-left:22px; margin:6px 0 10px; }
  .rich-content li { margin:3px 0; line-height:1.75; }
  .rich-content hr { border:none; border-top:1px solid #ddd; margin:14px 0; }
  .rich-content strong { font-weight:800; }
  .rich-content em     { font-style:italic; }
  .rich-content u      { text-decoration:underline; }
`;

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ doc, company, brand, onClose, onSaved }) {
  const [form, setForm] = useState({
    version:     doc.version     ?? "",
    fecha:       doc.fecha       ?? "",
    proxima:     doc.proxima     ?? "",
    responsable: doc.responsable ?? "",
    cargo:       doc.cargo       ?? "",
    contenido:   doc.contenido   ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.contenido.trim() || form.contenido === "<br>" || form.contenido === "<p></p>") {
      setError("El contenido es obligatorio");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch("/api/est/quality-policy", {
        method:  "PUT",
        headers: { "Content-Type": "application/json", "X-Tenant-Company": company, "X-Tenant-Brand": brand },
        body: JSON.stringify({ company_id: company, brand_id: brand || "", ...form }),
      });
      if (res.ok) { onSaved(); }
      else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Error al guardar");
        setSaving(false);
      }
    } catch { setError("Error de conexión"); setSaving(false); }
  };

  const labelStyle = {
    fontSize: 10, fontWeight: 800, color: COLORS.grayLight,
    textTransform: "uppercase", letterSpacing: "0.08em",
    fontFamily: H, display: "block", marginBottom: 6,
  };
  const inputStyle = {
    width: "100%", padding: "9px 11px", border: `1px solid ${COLORS.border}`,
    borderRadius: 7, fontSize: 13, fontFamily: B, color: COLORS.gray,
    background: "#fff", outline: "none", boxSizing: "border-box",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto" }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 780 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 28, boxShadow: "0 8px 40px rgba(0,0,0,0.14)" }}>
          <div style={{ fontFamily: H, fontWeight: 800, fontSize: 15, color: COLORS.gray, marginBottom: 22 }}>
            Editar Política de Calidad
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Versión</label>
              <input style={{ ...inputStyle, fontFamily: "monospace" }} value={form.version}
                onChange={e => set("version", e.target.value)} placeholder="Ej. 3.0" />
            </div>
            <div>
              <label style={labelStyle}>Fecha de revisión</label>
              <input type="date" style={inputStyle} value={form.fecha} onChange={e => set("fecha", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Próxima revisión</label>
              <input type="date" style={inputStyle} value={form.proxima} onChange={e => set("proxima", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Responsable / Firmante</label>
              <input style={inputStyle} value={form.responsable}
                onChange={e => set("responsable", e.target.value)} placeholder="Nombre del firmante" />
            </div>
            <div>
              <label style={labelStyle}>Cargo</label>
              <input style={inputStyle} value={form.cargo}
                onChange={e => set("cargo", e.target.value)} placeholder="Ej. Director General" />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Contenido de la política</label>
            <RichTextEditor value={form.contenido} onChange={v => set("contenido", v)} />
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#B91C1C", marginBottom: 14 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <BtnPrimary onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : "Publicar versión"}
            </BtnPrimary>
            <button
              onClick={onClose}
              style={{ padding: "8px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, fontFamily: B, color: COLORS.gray }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ContPolitica() {
  const { company, brand }  = useContext(CompanyContext);
  const perms               = useContext(PermissionsContext);
  // undefined = no restriction configured → allow write; "R" or "—" = read-only / no access
  const _pol     = perms?.["v-pol"];
  const canWrite = _pol === undefined || _pol === "R/W";

  const [doc,     setDoc]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/est/quality-policy?company_id=${encodeURIComponent(company)}&brand_id=${encodeURIComponent(brand || "")}`,
        { headers: { "X-Tenant-Company": company, "X-Tenant-Brand": brand } },
      );
      if (res.ok) setDoc(await res.json());
    } catch { /* network error */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [company, brand]); // eslint-disable-line react-hooks/exhaustive-deps

  const fechaFmt = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const dias       = doc?.proxima ? Math.ceil((new Date(doc.proxima) - new Date()) / 864e5) : null;
  const alertColor = dias !== null && dias < 90 ? COLORS.red : dias !== null && dias < 180 ? "#F57F17" : "#2E7D32";
  const alertBg    = dias !== null && dias < 90 ? "#FFEBEE"  : dias !== null && dias < 180 ? "#FFF8E1"  : "#E8F5E9";

  // ── PDF export ──────────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!doc?.contenido) return;
    const win = window.open("", "_blank", "width=900,height=700");

    const brandLogoHtml = doc.brand_logo
      ? `<img src="${doc.brand_logo}" alt="Logo" style="height:52px;max-width:180px;object-fit:contain;"/>`
      : "";

    const footerParts = [
      doc.denominacion_social,
      doc.domicilio_social,
      doc.nif ? `NIF: ${doc.nif}` : null,
    ].filter(Boolean);

    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Política de Calidad v${doc.version || "—"}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Nunito Sans', Arial, sans-serif; color: #333; background: #fff; }
    .page { max-width: 740px; margin: 0 auto; padding: 48px 56px; }
    .doc-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #ac2523; padding-bottom: 16px; margin-bottom: 20px; }
    .doc-title { font-size: 20px; font-weight: 800; color: #1a1a1a; margin-bottom: 4px; }
    .doc-org   { font-size: 11px; color: #888; letter-spacing: 0.06em; text-transform: uppercase; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; background: #f9f9f9; border: 1px solid #e8e8e8; border-radius: 6px; padding: 16px 20px; margin-bottom: 28px; }
    .meta-item label { display: block; font-size: 9px; font-weight: 800; color: #999; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px; }
    .meta-item span  { font-size: 13px; font-weight: 700; color: #1a1a1a; }
    /* Rich content */
    .body h2 { font-size:15px; font-weight:800; margin:14px 0 5px; color:#1a1a1a; }
    .body p  { font-size:13px; line-height:1.85; color:#2a2a2a; margin-bottom:10px; }
    .body ul, .body ol { padding-left:22px; margin:6px 0 10px; }
    .body li { font-size:13px; line-height:1.75; color:#2a2a2a; margin:3px 0; }
    .body hr { border:none; border-top:1px solid #ddd; margin:14px 0; }
    .body strong { font-weight:800; }
    .body em     { font-style:italic; }
    /* Signature */
    .signature { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e0e0e0; }
    .sig-block label { display: block; font-size: 9px; font-weight: 800; color: #999; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 24px; }
    .sig-block .line { border-bottom: 1px solid #ccc; margin-bottom: 8px; height: 1px; }
    .sig-block .name { font-size: 13px; font-weight: 800; color: #1a1a1a; }
    .sig-block .role { font-size: 11px; color: #666; margin-top: 2px; }
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
      <img src="/logo.png" alt="GMI" style="height:52px;"/>
      ${brandLogoHtml}
    </div>
    <div style="margin-bottom:24px;">
      <div class="doc-title">Política de Gestión de la Calidad</div>
      <div class="doc-org">ISO 9001:2015 §5.2 · Documento controlado</div>
    </div>
    <div class="meta-grid">
      <div class="meta-item"><label>Versión vigente</label><span style="color:#ac2523">v${doc.version || "—"}</span></div>
      <div class="meta-item"><label>Fecha de revisión</label><span>${fechaFmt(doc.fecha)}</span></div>
      <div class="meta-item"><label>Próxima revisión</label><span>${fechaFmt(doc.proxima)}</span></div>
    </div>
    <div class="body">${doc.contenido}</div>
    <div class="signature">
      <div class="sig-block">
        <label>Aprobado y firmado por</label>
        <div class="line"></div>
        <div class="name">${doc.responsable || "—"}</div>
        <div class="role">${doc.cargo || ""}</div>
      </div>
      <div class="sig-block">
        <label>Fecha de publicación</label>
        <div class="line"></div>
        <div class="name">${fechaFmt(doc.fecha)}</div>
        <div class="role">Revisión anual obligatoria</div>
      </div>
    </div>
    ${footerParts.length ? `<div class="footer">${footerParts.join(" · ")}</div>` : ""}
  </div>
  <script>
    window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
  </script>
</body>
</html>`);
    win.document.close();
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh", color: COLORS.grayLight, fontFamily: B, fontSize: 14 }}>
      Cargando política de calidad…
    </div>
  );

  return (
    <div style={{ maxWidth: 860 }}>
      <style>{RICH_CSS}</style>

      <PageHeader
        title="Política de Calidad"
        subtitle="Documento oficial vigente · ISO 9001 §5.2"
        action={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {doc?.is_inherited && (
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#FFF8E1", color: "#7B5800", border: "1px solid #FFD54F", fontFamily: H, fontWeight: 800 }}>
                Heredada de la entidad legal
              </span>
            )}
            <button
              onClick={handlePrint}
              disabled={!doc?.contenido}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: doc?.contenido ? "pointer" : "not-allowed", fontSize: 13, fontFamily: B, color: COLORS.gray, fontWeight: 600, opacity: doc?.contenido ? 1 : 0.4 }}
              onMouseEnter={e => { if (doc?.contenido) e.currentTarget.style.background = "#F5F5F5"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Descargar PDF
            </button>
            {canWrite && (
              <BtnPrimary onClick={() => setEditing(true)}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Editar y publicar
              </BtnPrimary>
            )}
          </div>
        }
      />

      {/* Metadata strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Versión vigente", value: doc?.version ? `v${doc.version}` : "—", mono: true },
          { label: "Última revisión",  value: fechaFmt(doc?.fecha) },
          { label: "Próxima revisión", value: fechaFmt(doc?.proxima), alert: true },
          { label: "Firmante",         value: doc?.responsable || "—" },
        ].map(({ label, value, mono, alert }) => (
          <Card key={label} style={{ padding: "14px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 6 }}>
              {label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, fontFamily: mono ? "monospace" : H, color: alert ? alertColor : COLORS.gray }}>
              {value || "—"}
            </div>
            {alert && dias !== null && (
              <div style={{ marginTop: 4, fontSize: 10, color: alertColor, fontFamily: B }}>
                {dias > 0 ? `en ${dias} días` : `vencida hace ${Math.abs(dias)} días`}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Policy document */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${COLORS.border}`, background: "#FAFAFA", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>
              Política de Gestión de la Calidad
            </div>
            <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, marginTop: 2 }}>
              Documento controlado · ISO 9001:2015 §5.2
              {doc?.updated_by && <span> · Editado por {doc.updated_by}</span>}
            </div>
          </div>
          {doc?.version && (
            <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20, background: alertBg, color: alertColor, fontFamily: H, border: `1px solid ${alertColor}22` }}>
              v{doc.version} · VIGENTE
            </span>
          )}
        </div>

        {/* Document body — renders stored HTML */}
        <div style={{ padding: "32px 40px" }}>
          {doc?.contenido ? (
            <div
              className="rich-content"
              style={{ fontSize: 13, lineHeight: 1.85, color: COLORS.gray, fontFamily: B }}
              dangerouslySetInnerHTML={{ __html: doc.contenido }}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.grayLight, fontFamily: B, fontSize: 13 }}>
              {canWrite
                ? "No hay política de calidad definida. Haz clic en «Editar y publicar» para crear una."
                : "No hay política de calidad definida para este contexto."
              }
            </div>
          )}
        </div>

        {/* Signature block */}
        {doc?.contenido && (
          <div style={{ padding: "20px 40px 28px", borderTop: `1px solid ${COLORS.border}`, display: "flex", alignItems: "flex-end", gap: 40 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 10 }}>
                Aprobado y firmado por
              </div>
              <div style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8, marginBottom: 8, minWidth: 200 }} />
              <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{doc.responsable || "—"}</div>
              <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{doc.cargo || ""}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 10 }}>
                Fecha de publicación
              </div>
              <div style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8, marginBottom: 8, minWidth: 200 }} />
              <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{fechaFmt(doc.fecha)}</div>
              <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>Revisión anual obligatoria</div>
            </div>
            {doc.version && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: "monospace", lineHeight: 1.6 }}>
                  <div>Doc: POL-CAL-001</div>
                  <div>Rev: {doc.version}</div>
                  <div>{fechaFmt(doc.fecha)}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {editing && (
        <EditModal
          doc={doc || {}}
          company={company}
          brand={brand}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); load(); }}
        />
      )}
    </div>
  );
}
