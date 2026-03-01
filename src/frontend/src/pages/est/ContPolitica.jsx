import { useState } from "react";
import { COLORS, H, B, Card, PageHeader, BtnPrimary, inputStyle } from "../../constants.jsx";

// ── Default policy text ───────────────────────────────────────────────────────
const DEFAULT_TEXT = `Global Manager Iberia (GMI) tiene como misión prestar servicios de consultoría y gestión de proyectos de alta calidad que generen valor real y medible para sus clientes.

Para ello, nos comprometemos a:

1. Entender y satisfacer los requisitos de nuestros clientes, superando sus expectativas en cada entregable.

2. Asegurar la mejora continua de nuestros procesos, sistemas y competencias mediante la revisión periódica del Sistema de Gestión de la Calidad conforme a la norma ISO 9001.

3. Fomentar un entorno de trabajo basado en la ética, la transparencia y el desarrollo profesional de todas las personas de la organización.

4. Gestionar los riesgos y oportunidades de forma proactiva para garantizar la sostenibilidad del negocio y la satisfacción de todas las partes interesadas.

5. Cumplir con todos los requisitos legales, normativos y contractuales aplicables a nuestra actividad.

Esta política es comunicada, entendida y aplicada por toda la organización. La Dirección asume el liderazgo en su implantación y revisa su vigencia anualmente.`;

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ doc, onClose, onSave }) {
  const [form, setForm] = useState({ ...doc });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.version.trim() || !form.responsable.trim() || !form.contenido.trim()) return;
    setSaving(true);
    // Simulate save (no backend yet)
    setTimeout(() => { setSaving(false); onSave(form); }, 300);
  };

  const labelStyle = {
    fontSize: 10, fontWeight: 800, color: COLORS.grayLight,
    textTransform: "uppercase", letterSpacing: "0.08em",
    fontFamily: H, display: "block", marginBottom: 6,
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto" }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 720 }}>
        <Card style={{ padding: 28 }}>
          <div style={{ fontFamily: H, fontWeight: 800, fontSize: 15, color: COLORS.gray, marginBottom: 22 }}>
            Editar Política de Calidad
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Versión</label>
              <input
                style={{ ...inputStyle, width: "100%", boxSizing: "border-box", fontFamily: "monospace" }}
                value={form.version}
                onChange={e => set("version", e.target.value)}
                placeholder="Ej. 3.0"
              />
            </div>
            <div>
              <label style={labelStyle}>Fecha de revisión</label>
              <input
                type="date"
                style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                value={form.fecha}
                onChange={e => set("fecha", e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Próxima revisión</label>
              <input
                type="date"
                style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                value={form.proxima}
                onChange={e => set("proxima", e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Responsable / Firmante</label>
            <input
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
              value={form.responsable}
              onChange={e => set("responsable", e.target.value)}
              placeholder="Nombre y cargo del firmante"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Cargo</label>
            <input
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
              value={form.cargo}
              onChange={e => set("cargo", e.target.value)}
              placeholder="Ej. Director General"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Contenido de la política</label>
            <textarea
              style={{
                ...inputStyle, width: "100%", boxSizing: "border-box",
                height: 320, resize: "vertical", fontFamily: B, lineHeight: 1.7,
                fontSize: 13,
              }}
              value={form.contenido}
              onChange={e => set("contenido", e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <BtnPrimary onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : "Publicar versión"}
            </BtnPrimary>
            <button
              onClick={onClose}
              style={{ padding: "8px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: COLORS.white, cursor: "pointer", fontSize: 13, fontFamily: B, color: COLORS.gray }}
            >
              Cancelar
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ContPolitica() {
  const [doc, setDoc] = useState({
    version:     "2.1",
    fecha:       "2026-01-15",
    proxima:     "2027-01-15",
    responsable: "Elena Martínez",
    cargo:       "Directora General",
    contenido:   DEFAULT_TEXT,
  });
  const [editing, setEditing] = useState(false);

  const fechaFmt = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const diasParaRevision = () => {
    if (!doc.proxima) return null;
    const diff = Math.ceil((new Date(doc.proxima) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const dias = diasParaRevision();
  const alertColor = dias !== null && dias < 90 ? COLORS.red : dias !== null && dias < 180 ? "#F57F17" : "#2E7D32";
  const alertBg    = dias !== null && dias < 90 ? "#FFEBEE"  : dias !== null && dias < 180 ? "#FFF8E1"  : "#E8F5E9";

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=900,height=700");
    const contenidoHtml = doc.contenido
      .split("\n\n")
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");

    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Política de Calidad v${doc.version} — Global Manager Iberia</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Nunito Sans', Arial, sans-serif; color: #333; background: #fff; }
    .page { max-width: 740px; margin: 0 auto; padding: 48px 56px; }
    .doc-header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 3px solid #ac2523; padding-bottom: 18px; margin-bottom: 24px; }
    .doc-title { font-size: 20px; font-weight: 800; color: #1a1a1a; margin-bottom: 4px; }
    .doc-org   { font-size: 12px; color: #888; letter-spacing: 0.06em; text-transform: uppercase; }
    .doc-ref   { text-align: right; font-size: 10px; color: #999; font-family: monospace; line-height: 1.7; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; background: #f9f9f9; border: 1px solid #e8e8e8; border-radius: 6px; padding: 16px 20px; margin-bottom: 28px; }
    .meta-item label { display: block; font-size: 9px; font-weight: 800; color: #999; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px; }
    .meta-item span  { font-size: 13px; font-weight: 700; color: #1a1a1a; }
    .body p  { font-size: 13px; line-height: 1.85; color: #2a2a2a; margin-bottom: 12px; }
    .signature { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e0e0e0; }
    .sig-block label { display: block; font-size: 9px; font-weight: 800; color: #999; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 24px; }
    .sig-block .line  { border-bottom: 1px solid #ccc; margin-bottom: 8px; height: 1px; }
    .sig-block .name  { font-size: 13px; font-weight: 800; color: #1a1a1a; }
    .sig-block .role  { font-size: 11px; color: #666; margin-top: 2px; }
    .red { color: #ac2523; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 20px 32px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="doc-header">
      <div>
        <div class="doc-title">Política de Gestión de la Calidad</div>
        <div class="doc-org">Global Manager Iberia · ISO 9001:2015 §5.2 · Documento controlado</div>
      </div>
      <div class="doc-ref">
        <div>Doc: POL-CAL-001</div>
        <div>Rev: ${doc.version}</div>
        <div>${fechaFmt(doc.fecha)}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item"><label>Versión vigente</label><span class="red">v${doc.version}</span></div>
      <div class="meta-item"><label>Fecha de revisión</label><span>${fechaFmt(doc.fecha)}</span></div>
      <div class="meta-item"><label>Próxima revisión</label><span>${fechaFmt(doc.proxima)}</span></div>
    </div>

    <div class="body">${contenidoHtml}</div>

    <div class="signature">
      <div class="sig-block">
        <label>Aprobado y firmado por</label>
        <div class="line"></div>
        <div class="name">${doc.responsable}</div>
        <div class="role">${doc.cargo}</div>
      </div>
      <div class="sig-block">
        <label>Fecha de publicación</label>
        <div class="line"></div>
        <div class="name">${fechaFmt(doc.fecha)}</div>
        <div class="role">Revisión anual obligatoria</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <div style={{ maxWidth: 860 }}>
      <PageHeader
        title="Política de Calidad"
        subtitle="Documento oficial vigente · ISO 9001 §5.2"
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handlePrint}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: COLORS.white, cursor: "pointer", fontSize: 13, fontFamily: B, color: COLORS.gray, fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.background = "#F5F5F5"}
              onMouseLeave={e => e.currentTarget.style.background = COLORS.white}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Descargar PDF
            </button>
            <BtnPrimary onClick={() => setEditing(true)}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar y publicar
            </BtnPrimary>
          </div>
        }
      />

      {/* Metadata strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Versión vigente", value: `v${doc.version}`, mono: true },
          { label: "Última revisión",  value: fechaFmt(doc.fecha) },
          { label: "Próxima revisión", value: fechaFmt(doc.proxima), alert: true },
          { label: "Firmante",         value: doc.responsable },
        ].map(({ label, value, mono, alert }) => (
          <Card key={label} style={{ padding: "14px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 6 }}>
              {label}
            </div>
            <div style={{
              fontSize: 15, fontWeight: 800, fontFamily: mono ? "monospace" : H,
              color: alert ? alertColor : COLORS.gray,
            }}>
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
        {/* Document header */}
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${COLORS.border}`, background: "#FAFAFA", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>
              Política de Gestión de la Calidad
            </div>
            <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, marginTop: 2 }}>
              Global Manager Iberia · Documento controlado · ISO 9001:2015 §5.2
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20, background: alertBg, color: alertColor, fontFamily: H, border: `1px solid ${alertColor}22` }}>
              v{doc.version} · VIGENTE
            </span>
          </div>
        </div>

        {/* Document body */}
        <div style={{ padding: "32px 40px" }}>
          <div style={{ fontFamily: B, fontSize: 13, color: COLORS.gray, lineHeight: 1.85, whiteSpace: "pre-line" }}>
            {doc.contenido}
          </div>
        </div>

        {/* Signature block */}
        <div style={{ padding: "20px 40px 28px", borderTop: `1px solid ${COLORS.border}`, display: "flex", alignItems: "flex-end", gap: 40 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 10 }}>
              Aprobado y firmado por
            </div>
            <div style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8, marginBottom: 8, minWidth: 200 }} />
            <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{doc.responsable}</div>
            <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{doc.cargo}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 10 }}>
              Fecha de publicación
            </div>
            <div style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8, marginBottom: 8, minWidth: 200 }} />
            <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{fechaFmt(doc.fecha)}</div>
            <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>Revisión anual obligatoria</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: "monospace", lineHeight: 1.6 }}>
              <div>Doc: POL-CAL-001</div>
              <div>Rev: {doc.version}</div>
              <div>{fechaFmt(doc.fecha)}</div>
            </div>
          </div>
        </div>
      </Card>

      {editing && (
        <EditModal
          doc={doc}
          onClose={() => setEditing(false)}
          onSave={updated => { setDoc(updated); setEditing(false); }}
        />
      )}
    </div>
  );
}
