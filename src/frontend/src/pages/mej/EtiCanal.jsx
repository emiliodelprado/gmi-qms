import { useState } from "react";
import { COLORS, H, B, Icon } from "../../constants.jsx";

const TIPOS = [
  "Conflicto de intereses",
  "Acoso laboral o discriminación",
  "Fraude o corrupción",
  "Incumplimiento normativo (RGPD, laboral...)",
  "Mal uso de recursos corporativos",
  "Irregularidad en procesos de calidad",
  "Otro",
];

function genCode() {
  return "GMI-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function EtiCanal() {
  const [tipo, setTipo]   = useState("");
  const [texto, setTexto] = useState("");
  const [sent, setSent]   = useState(false);
  const [code, setCode]   = useState("");
  const [lookup, setLookup] = useState("");
  const [showLookup, setShowLookup] = useState(false);

  const handleSubmit = () => {
    if (!tipo || !texto.trim()) return;
    const c = genCode();
    setCode(c);
    setSent(true);
  };

  if (sent) {
    return (
      <div style={{ minHeight: "calc(100vh - 120px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          {/* Success icon */}
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Icon name="check" size={32} color="#43A047" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: COLORS.gray, fontFamily: H, margin: "0 0 8px" }}>Denuncia registrada</h2>
          <p style={{ fontSize: 13, color: COLORS.grayLight, fontFamily: B, margin: "0 0 24px" }}>
            Tu comunicación ha sido enviada de forma anónima y segura. Guarda el código de seguimiento.
          </p>
          <div style={{ background: COLORS.sidebar, borderRadius: 10, padding: "20px 28px", marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: H, marginBottom: 8 }}>Código de seguimiento</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", fontFamily: "monospace", letterSpacing: "0.2em" }}>{code}</div>
          </div>
          <button onClick={() => { setSent(false); setTipo(""); setTexto(""); setCode(""); }}
            style={{ padding: "10px 24px", background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer", fontSize: 13, color: COLORS.grayLight, fontFamily: B }}>
            Nueva comunicación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "calc(100vh - 120px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 540, width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: COLORS.sidebar, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Icon name="lock" size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.gray, fontFamily: H, margin: "0 0 6px" }}>Canal de Denuncias</h1>
          <p style={{ fontSize: 13, color: COLORS.grayLight, fontFamily: B, margin: 0 }}>
            Comunicación anónima, segura y confidencial
          </p>
        </div>

        {/* Anonymity guarantee */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#1A1A1A", borderRadius: 10, padding: "14px 18px", marginBottom: 24 }}>
          <Icon name="shield" size={18} color="#43A047" />
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#43A047", fontFamily: H, marginBottom: 3 }}>Garantía de anonimato</div>
            <div style={{ fontSize: 11, color: "#888", fontFamily: B, lineHeight: 1.6 }}>
              Esta comunicación está encriptada. No se registra ningún dato identificativo del remitente.
              La gestión es responsabilidad del Comité de Ética y es completamente confidencial.
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 28 }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H }}>
              Tipo de comunicación *
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {TIPOS.map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  style={{
                    padding: "9px 14px", textAlign: "left", border: "none", borderRadius: 7, cursor: "pointer",
                    background: tipo === t ? `${COLORS.red}12` : COLORS.bg,
                    border: `1px solid ${tipo === t ? COLORS.red : "transparent"}`,
                    fontSize: 12, fontFamily: B, color: tipo === t ? COLORS.red : COLORS.gray, fontWeight: tipo === t ? 700 : 400,
                    display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s",
                  }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${tipo === t ? COLORS.red : COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {tipo === t && <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.red }} />}
                  </div>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H }}>
              Descripción de los hechos *
            </label>
            <textarea
              value={texto} onChange={e => setTexto(e.target.value)}
              placeholder="Describe los hechos de manera objetiva. No incluyas datos que te identifiquen si deseas mantener el anonimato."
              style={{ width: "100%", minHeight: 120, padding: "10px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, color: COLORS.gray, fontFamily: B, resize: "vertical", outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ fontSize: 10, color: "#C0C0C0", fontFamily: B, marginTop: 4, textAlign: "right" }}>{texto.length} caracteres</div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!tipo || !texto.trim()}
            style={{
              width: "100%", padding: "12px", border: "none", borderRadius: 8, cursor: !tipo || !texto.trim() ? "not-allowed" : "pointer",
              background: !tipo || !texto.trim() ? "#CCC" : COLORS.sidebar,
              color: "#fff", fontSize: 14, fontWeight: 800, fontFamily: H, transition: "background 0.15s",
            }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon name="lock" size={16} color="#fff" />
              Enviar comunicación de forma segura
            </div>
          </button>
        </div>

        {/* Lookup */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button onClick={() => setShowLookup(!showLookup)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: COLORS.grayLight, fontFamily: B, textDecoration: "underline" }}>
            ¿Tienes un código de seguimiento?
          </button>
          {showLookup && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center" }}>
              <input
                style={{ padding: "8px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, fontFamily: "monospace", letterSpacing: "0.1em", outline: "none", width: 160 }}
                placeholder="GMI-XXXXXX"
                value={lookup} onChange={e => setLookup(e.target.value.toUpperCase())}
              />
              <button style={{ padding: "8px 16px", background: COLORS.red, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, color: "#fff", fontFamily: H, fontWeight: 700 }}>
                Consultar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
