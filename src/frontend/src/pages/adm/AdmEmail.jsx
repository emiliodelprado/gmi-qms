import { useState, useEffect, useRef, useContext } from "react";
import { COLORS, H, B, Card, PageHeader, BtnPrimary, apiFetch, inputStyle, Icon } from "../../constants.jsx";
import { PermissionsContext } from "../../contexts.jsx";

// ── Rich text editor ────────────────────────────────────────────────────────
const SWATCHES = ["#000000","#A91E22","#1565C0","#2E7D32","#E65100","#6A1B9A","#00695C","#E0E0E0"];

const tbBtn = {
  padding: "4px 8px", border: `1px solid ${COLORS.border}`, borderRadius: 4,
  background: COLORS.white, cursor: "pointer", fontSize: 13, fontFamily: B,
  color: COLORS.gray, lineHeight: 1,
};

function RichEditor({ value, onChange, height = 180 }) {
  const ref = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (ref.current && !initialized.current) {
      ref.current.innerHTML = value || "";
      initialized.current = true;
    }
  }, [value]);

  // When value changes externally (e.g. API load), re-set content
  useEffect(() => {
    if (ref.current && initialized.current && value !== undefined) {
      if (ref.current.innerHTML !== value) {
        ref.current.innerHTML = value || "";
      }
    }
  }, [value]);

  const exec = (cmd, val) => {
    ref.current.focus();
    document.execCommand(cmd, false, val);
    onChange(ref.current.innerHTML);
  };

  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden", background: COLORS.white }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 8px", borderBottom: `1px solid ${COLORS.border}`, background: "#FAFAFA", flexWrap: "wrap" }}>
        <button type="button" style={tbBtn} onClick={() => exec("bold")} title="Negrita"><b>B</b></button>
        <button type="button" style={tbBtn} onClick={() => exec("italic")} title="Cursiva"><i>I</i></button>
        <button type="button" style={tbBtn} onClick={() => exec("underline")} title="Subrayado"><u>U</u></button>
        <button type="button" style={{ ...tbBtn, fontSize: 11 }} onClick={() => exec("insertUnorderedList")} title="Lista">• Lista</button>
        <button type="button" style={{ ...tbBtn, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }} onClick={() => {
          const url = prompt("URL del enlace:");
          if (url) exec("createLink", url);
        }} title="Enlace">
          <Icon name="link" size={12} color={COLORS.grayLight} /> Link
        </button>
        <span style={{ width: 1, height: 18, background: COLORS.border, margin: "0 4px" }} />
        {SWATCHES.map(c => (
          <button key={c} type="button" onClick={() => exec("foreColor", c)} title={c}
            style={{ width: 20, height: 20, borderRadius: 4, background: c, border: `1px solid ${COLORS.border}`, cursor: "pointer", padding: 0 }} />
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={() => onChange(ref.current.innerHTML)}
        style={{ minHeight: height, padding: 12, outline: "none", fontFamily: B, fontSize: 13, color: COLORS.gray, lineHeight: 1.6 }}
      />
    </div>
  );
}

// ── Label style ─────────────────────────────────────────────────────────────
const labelStyle = {
  display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight,
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H,
};

const sectionTitle = (text) => (
  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: H, color: COLORS.gray, marginBottom: 16 }}>{text}</div>
);

// ── Main component ──────────────────────────────────────────────────────────
export default function AdmEmail() {
  const perms = useContext(PermissionsContext);
  const canWrite = (() => { const p = perms?.["v-email"]; return p === undefined || p === "R/W"; })();

  // Config state
  const [cfg, setCfg] = useState({
    provider: "mailjet", api_key: "", api_secret: "",
    sender_name: "", sender_email: "", reply_to: "", signature_html: "",
  });
  const [showKey, setShowKey]       = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [savingCfg, setSavingCfg]   = useState(false);
  const [savedCfg, setSavedCfg]     = useState("");

  // Signature state (part of cfg but saved separately)
  const [signature, setSignature]       = useState("");
  const [savingSig, setSavingSig]       = useState(false);
  const [savedSig, setSavedSig]         = useState("");
  const [showPreview, setShowPreview]   = useState(false);

  // Templates
  const [templates, setTemplates]       = useState([]);
  const [tplModal, setTplModal]         = useState(null); // null=closed, {id?,name,subject,body_html}
  const [savingTpl, setSavingTpl]       = useState(false);

  // Test
  const [testEmail, setTestEmail]       = useState("");
  const [testTplId, setTestTplId]       = useState("");
  const [sending, setSending]           = useState(false);
  const [testResult, setTestResult]     = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // ── Load data ───────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      apiFetch("/api/adm/email-config").then(r => r.ok ? r.json() : null),
      apiFetch("/api/adm/email-templates").then(r => r.ok ? r.json() : []),
    ])
      .then(([cfgData, tpls]) => {
        if (cfgData) {
          setCfg({
            provider:     cfgData.provider || "mailjet",
            api_key:      cfgData.api_key || "",
            api_secret:   cfgData.api_secret || "",
            sender_name:  cfgData.sender_name || "",
            sender_email: cfgData.sender_email || "",
            reply_to:     cfgData.reply_to || "",
            signature_html: cfgData.signature_html || "",
          });
          setSignature(cfgData.signature_html || "");
        }
        setTemplates(tpls || []);
      })
      .catch(() => setError("Error al cargar la configuración"))
      .finally(() => setLoading(false));
  }, []);

  const reloadTemplates = () => {
    apiFetch("/api/adm/email-templates").then(r => r.ok ? r.json() : []).then(setTemplates);
  };

  // ── Save config ─────────────────────────────────────────────────────────
  const handleSaveCfg = async () => {
    setSavingCfg(true);
    setSavedCfg("");
    try {
      const res = await apiFetch("/api/adm/email-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: cfg.provider, api_key: cfg.api_key, api_secret: cfg.api_secret,
          sender_name: cfg.sender_name, sender_email: cfg.sender_email, reply_to: cfg.reply_to,
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); setSavedCfg(e.detail || "Error"); return; }
      const data = await res.json();
      setCfg(prev => ({ ...prev, api_key: data.api_key || "", api_secret: data.api_secret || "" }));
      setSavedCfg("ok");
      setTimeout(() => setSavedCfg(""), 3000);
    } catch { setSavedCfg("Error de conexión"); }
    finally { setSavingCfg(false); }
  };

  // ── Save signature ──────────────────────────────────────────────────────
  const handleSaveSig = async () => {
    setSavingSig(true);
    setSavedSig("");
    try {
      const res = await apiFetch("/api/adm/email-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cfg, signature_html: signature }),
      });
      if (!res.ok) { setSavedSig("Error"); return; }
      setCfg(prev => ({ ...prev, signature_html: signature }));
      setSavedSig("ok");
      setTimeout(() => setSavedSig(""), 3000);
    } catch { setSavedSig("Error de conexión"); }
    finally { setSavingSig(false); }
  };

  // ── Template CRUD ───────────────────────────────────────────────────────
  const handleSaveTpl = async () => {
    if (!tplModal || !tplModal.name.trim() || !tplModal.subject.trim()) return;
    setSavingTpl(true);
    try {
      const isEdit = !!tplModal.id;
      const url = isEdit ? `/api/adm/email-templates/${tplModal.id}` : "/api/adm/email-templates";
      const res = await apiFetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tplModal.name.trim(), subject: tplModal.subject.trim(), body_html: tplModal.body_html || "" }),
      });
      if (res.ok) { setTplModal(null); reloadTemplates(); }
    } catch { /* ignore */ }
    finally { setSavingTpl(false); }
  };

  const handleDeleteTpl = async (id) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    await apiFetch(`/api/adm/email-templates/${id}`, { method: "DELETE" });
    reloadTemplates();
  };

  // ── Send test ───────────────────────────────────────────────────────────
  const handleSendTest = async () => {
    if (!testEmail.trim() || !testTplId) return;
    setSending(true);
    setTestResult(null);
    try {
      const res = await apiFetch("/api/adm/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_email: testEmail.trim(), template_id: parseInt(testTplId) }),
      });
      const data = await res.json();
      setTestResult(res.ok ? { ok: true, msg: data.message } : { ok: false, msg: data.detail || "Error" });
    } catch { setTestResult({ ok: false, msg: "Error de conexión" }); }
    finally { setSending(false); }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: COLORS.grayLight, fontFamily: B }}>Cargando...</div>
  );

  const inp = { ...inputStyle };
  const row2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };

  return (
    <div style={{ maxWidth: 900 }}>
      <PageHeader title="Envíos de email" subtitle="Configuración del proveedor de email, firma y plantillas" />

      {error && <div style={{ padding: "12px 16px", background: "#FFEBEE", borderRadius: 8, color: "#C62828", fontSize: 13, fontFamily: B, marginBottom: 16 }}>{error}</div>}

      {/* ── Section 1: Remitente y proveedor ─────────────────────────────── */}
      <Card style={{ padding: 28, marginBottom: 20 }}>
        {sectionTitle("Remitente y proveedor")}

        <div style={row2}>
          <div>
            <label style={labelStyle}>Proveedor</label>
            <select value={cfg.provider} onChange={e => setCfg({ ...cfg, provider: e.target.value })}
              disabled={!canWrite}
              style={{ ...inp, cursor: canWrite ? "pointer" : "not-allowed", appearance: "auto" }}>
              <option value="mailjet">Mailjet</option>
              <option value="acumbamail">Acumbamail</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>API Key</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type={showKey ? "text" : "password"} value={cfg.api_key}
                onChange={e => setCfg({ ...cfg, api_key: e.target.value })}
                disabled={!canWrite} placeholder="Introduce tu API Key"
                style={{ ...inp, flex: 1 }} />
              <button type="button" onClick={() => setShowKey(!showKey)}
                style={{ ...tbBtn, padding: "8px 14px", fontSize: 12, whiteSpace: "nowrap" }}>
                {showKey ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>
        </div>

        <div style={{ ...row2, marginTop: 16 }}>
          <div>
            <label style={labelStyle}>API Secret</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type={showSecret ? "text" : "password"} value={cfg.api_secret}
                onChange={e => setCfg({ ...cfg, api_secret: e.target.value })}
                disabled={!canWrite} placeholder="Introduce tu API Secret"
                style={{ ...inp, flex: 1 }} />
              <button type="button" onClick={() => setShowSecret(!showSecret)}
                style={{ ...tbBtn, padding: "8px 14px", fontSize: 12, whiteSpace: "nowrap" }}>
                {showSecret ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Nombre del remitente</label>
            <input value={cfg.sender_name} onChange={e => setCfg({ ...cfg, sender_name: e.target.value })}
              disabled={!canWrite} placeholder="GMI QMS" style={inp} />
          </div>
        </div>

        <div style={{ ...row2, marginTop: 16 }}>
          <div>
            <label style={labelStyle}>Email del remitente</label>
            <input value={cfg.sender_email} onChange={e => setCfg({ ...cfg, sender_email: e.target.value })}
              disabled={!canWrite} placeholder="noreply@gmi.com" style={inp} />
          </div>
          <div>
            <label style={labelStyle}>Reply-To (opcional)</label>
            <input value={cfg.reply_to} onChange={e => setCfg({ ...cfg, reply_to: e.target.value })}
              disabled={!canWrite} placeholder="contacto@gmi.com" style={inp} />
          </div>
        </div>

        {/* Feedback + save */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
          {savedCfg === "ok" && <span style={{ fontSize: 12, color: "#2E7D32", fontFamily: B }}>Configuración guardada</span>}
          {savedCfg && savedCfg !== "ok" && <span style={{ fontSize: 12, color: COLORS.red, fontFamily: B }}>{savedCfg}</span>}
          {canWrite && (
            <BtnPrimary onClick={handleSaveCfg} disabled={savingCfg}>
              {savingCfg ? "Guardando…" : "Guardar configuración"}
            </BtnPrimary>
          )}
        </div>
      </Card>

      {/* ── Section 2: Firma común ───────────────────────────────────────── */}
      <Card style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          {sectionTitle("Firma común")}
          <button type="button" onClick={() => setShowPreview(!showPreview)}
            style={{ ...tbBtn, padding: "6px 14px", fontSize: 12 }}>
            {showPreview ? "Editar" : "Vista previa"}
          </button>
        </div>

        <p style={{ fontSize: 12, color: COLORS.grayLight, fontFamily: B, marginBottom: 14, marginTop: 0 }}>
          Se inserta automáticamente en los emails mediante la variable <code style={{ background: "#F5F5F5", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 11, color: COLORS.red }}>{"{{firma}}"}</code>.
        </p>

        {showPreview ? (
          <div style={{
            border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16,
            minHeight: 100, fontFamily: B, fontSize: 13, color: COLORS.gray, lineHeight: 1.6,
          }} dangerouslySetInnerHTML={{ __html: signature }} />
        ) : (
          <RichEditor value={signature} onChange={setSignature} height={140} />
        )}

        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
          {savedSig === "ok" && <span style={{ fontSize: 12, color: "#2E7D32", fontFamily: B }}>Firma guardada</span>}
          {savedSig && savedSig !== "ok" && <span style={{ fontSize: 12, color: COLORS.red, fontFamily: B }}>{savedSig}</span>}
          {canWrite && (
            <BtnPrimary onClick={handleSaveSig} disabled={savingSig}>
              {savingSig ? "Guardando…" : "Guardar firma"}
            </BtnPrimary>
          )}
        </div>
      </Card>

      {/* ── Section 3: Plantillas ────────────────────────────────────────── */}
      <Card style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          {sectionTitle("Plantillas")}
          {canWrite && (
            <BtnPrimary onClick={() => setTplModal({ name: "", subject: "", body_html: "" })}>
              <Icon name="plus" size={14} color="#fff" /> Nueva plantilla
            </BtnPrimary>
          )}
        </div>

        {templates.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: COLORS.grayLight, fontFamily: B, fontSize: 13 }}>
            No hay plantillas creadas
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 800, fontFamily: H, color: COLORS.grayLight, textTransform: "uppercase", borderBottom: `2px solid ${COLORS.border}` }}>Nombre</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 800, fontFamily: H, color: COLORS.grayLight, textTransform: "uppercase", borderBottom: `2px solid ${COLORS.border}` }}>Asunto</th>
                <th style={{ width: 80, borderBottom: `2px solid ${COLORS.border}` }} />
              </tr>
            </thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.id}>
                  <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, fontFamily: H, color: COLORS.gray, borderBottom: `1px solid ${COLORS.border}` }}>{t.name}</td>
                  <td style={{ padding: "10px 12px", fontSize: 13, fontFamily: B, color: COLORS.grayLight, borderBottom: `1px solid ${COLORS.border}` }}>{t.subject}</td>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.border}`, whiteSpace: "nowrap" }}>
                    {canWrite && (
                      <>
                        <button type="button" onClick={() => setTplModal({ id: t.id, name: t.name, subject: t.subject, body_html: t.body_html || "" })}
                          style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", marginRight: 6 }}
                          title="Editar">
                          <Icon name="edit" size={14} color={COLORS.grayLight} />
                        </button>
                        <button type="button" onClick={() => handleDeleteTpl(t.id)}
                          style={{ background: "none", border: `1px solid #F5CCCC`, borderRadius: 6, padding: "5px 8px", cursor: "pointer" }}
                          title="Eliminar">
                          <Icon name="trash" size={14} color={COLORS.red} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* ── Section 4: Envío de prueba ───────────────────────────────────── */}
      <Card style={{ padding: 28 }}>
        {sectionTitle("Envío de prueba")}
        <div style={row2}>
          <div>
            <label style={labelStyle}>Destinatario</label>
            <input value={testEmail} onChange={e => setTestEmail(e.target.value)}
              placeholder="tu@email.com" style={inp} />
          </div>
          <div>
            <label style={labelStyle}>Plantilla</label>
            <select value={testTplId} onChange={e => setTestTplId(e.target.value)}
              style={{ ...inp, cursor: "pointer", appearance: "auto" }}>
              <option value="">— Selecciona plantilla —</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
          {testResult && (
            <span style={{ fontSize: 12, fontFamily: B, color: testResult.ok ? "#2E7D32" : COLORS.red }}>
              {testResult.msg}
            </span>
          )}
          <button onClick={handleSendTest} disabled={sending || !testEmail.trim() || !testTplId}
            style={{
              padding: "10px 20px", border: "none", borderRadius: 7,
              background: sending || !testEmail.trim() || !testTplId ? "#CCC" : "#1565C0",
              color: "#fff", cursor: sending ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 800, fontFamily: H,
            }}>
            {sending ? "Enviando…" : "Enviar prueba"}
          </button>
        </div>
      </Card>

      {/* ── Template modal ───────────────────────────────────────────────── */}
      {tplModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setTplModal(null)}>
          <div style={{
            background: COLORS.white, borderRadius: 12, padding: 28, width: "90%", maxWidth: 700,
            maxHeight: "85vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: H, color: COLORS.gray, marginBottom: 20 }}>
              {tplModal.id ? "Editar plantilla" : "Nueva plantilla"}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nombre</label>
              <input value={tplModal.name} onChange={e => setTplModal({ ...tplModal, name: e.target.value })}
                placeholder="Nombre de la plantilla" style={inp} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Asunto</label>
              <input value={tplModal.subject} onChange={e => setTplModal({ ...tplModal, subject: e.target.value })}
                placeholder="Asunto del email" style={inp} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Cuerpo (HTML)</label>
              <RichEditor value={tplModal.body_html} onChange={html => setTplModal({ ...tplModal, body_html: html })} height={220} />
              <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, marginTop: 6 }}>
                Usa <code style={{ background: "#F5F5F5", padding: "1px 4px", borderRadius: 3, fontFamily: "monospace", fontSize: 10 }}>{"{{firma}}"}</code> para insertar la firma común.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setTplModal(null)}
                style={{ padding: "9px 20px", border: `1px solid ${COLORS.border}`, borderRadius: 7, background: COLORS.white, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: H, color: COLORS.grayLight }}>
                Cancelar
              </button>
              <BtnPrimary onClick={handleSaveTpl} disabled={savingTpl || !tplModal.name.trim() || !tplModal.subject.trim()}>
                {savingTpl ? "Guardando…" : "Guardar"}
              </BtnPrimary>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
