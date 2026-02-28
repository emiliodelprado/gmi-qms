import { useState } from "react";
import { COLORS, H, B, Card, PageHeader, Icon, BtnPrimary, Badge } from "../../constants.jsx";

const METHODS = [
  {
    id: "sso",
    label: "SSO / SAML 2.0",
    desc: "Autenticación federada mediante OneLogin. Gestión centralizada de identidades corporativas.",
    icon: "shield",
    color: "#1565C0",
    bg: "#E3F2FD",
    fields: [
      { key: "metadataUrl", label: "Metadata URL",      type: "url",      placeholder: "https://app.onelogin.com/saml/metadata/..." },
      { key: "entityId",    label: "Entity ID (SP)",   type: "text",     placeholder: "https://qms.gmiberia.com/auth/saml"          },
      { key: "acsUrl",      label: "ACS URL",          type: "url",      placeholder: "https://qms.gmiberia.com/auth/saml/callback"  },
      { key: "certX509",    label: "Certificado X.509",type: "textarea", placeholder: "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----" },
    ],
    attrMap: [
      { saml: "User.email",     local: "email"   },
      { saml: "User.FirstName", local: "name"    },
      { saml: "memberOf",       local: "role"    },
      { saml: "User.company",   local: "company" },
    ],
  },
  {
    id: "local",
    label: "Acceso Local (On-premise)",
    desc: "Credenciales internas almacenadas en la BD del QMS. Fallback cuando SSO no está disponible.",
    icon: "lock",
    color: "#2E7D32",
    bg: "#E8F5E9",
    fields: [
      { key: "algorithm",   label: "Algoritmo de Hash",   type: "select",   options: ["Argon2id", "BCrypt (12 rounds)", "PBKDF2"] },
      { key: "minLength",   label: "Longitud mínima",     type: "number",   placeholder: "12" },
      { key: "sessionTTL",  label: "TTL de sesión (min)", type: "number",   placeholder: "480" },
      { key: "maxAttempts", label: "Intentos fallidos máx.",type: "number", placeholder: "5" },
    ],
  },
];

export default function AdmAuth() {
  const [enabled,   setEnabled]   = useState({ sso: true, local: true });
  const [expanded,  setExpanded]  = useState({ sso: false, local: false });
  const [forms,     setForms]     = useState({
    sso:   { metadataUrl: "", entityId: "https://qms.gmiberia.com/auth/saml", acsUrl: "https://qms.gmiberia.com/auth/saml/callback", certX509: "" },
    local: { algorithm: "Argon2id", minLength: "12", sessionTTL: "480", maxAttempts: "5" },
  });
  const [saved, setSaved] = useState(null);

  const inp = { width: "100%", padding: "8px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, color: COLORS.gray, background: COLORS.white, outline: "none", boxSizing: "border-box", fontFamily: B };

  const handleSave = (id) => {
    setSaved(id);
    setTimeout(() => setSaved(null), 2500);
  };

  return (
    <div>
      <PageHeader title="Métodos de Autenticación" subtitle="Configuración de los métodos de acceso al sistema (SSO/SAML + On-premise)" />

      {/* Status overview */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {METHODS.map(m => (
          <Card key={m.id} style={{ flex: 1, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, borderLeft: `4px solid ${enabled[m.id] ? m.color : COLORS.border}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: enabled[m.id] ? m.bg : "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={m.icon} size={16} color={enabled[m.id] ? m.color : "#CCC"} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{m.label}</div>
              <Badge
                label={enabled[m.id] ? "Habilitado" : "Deshabilitado"}
                bg={enabled[m.id] ? m.bg : "#F5F5F5"}
                color={enabled[m.id] ? m.color : "#AAA"}
              />
            </div>
            <button
              onClick={() => setEnabled(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
              style={{
                width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                background: enabled[m.id] ? m.color : "#DDD",
                position: "relative", transition: "background 0.2s",
              }}
            >
              <div style={{
                position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%", background: "#fff",
                left: enabled[m.id] ? 23 : 3, transition: "left 0.2s",
              }} />
            </button>
          </Card>
        ))}
      </div>

      {/* Config panels */}
      {METHODS.map(m => (
        <Card key={m.id} style={{ marginBottom: 16, overflow: "hidden", opacity: enabled[m.id] ? 1 : 0.5 }}>
          {/* Header */}
          <button
            onClick={() => setExpanded(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", background: "transparent", border: "none", cursor: "pointer", borderBottom: expanded[m.id] ? `1px solid ${COLORS.border}` : "none" }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={m.icon} size={15} color={m.color} />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{m.label}</div>
              <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{m.desc}</div>
            </div>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={COLORS.grayLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: expanded[m.id] ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Fields */}
          {expanded[m.id] && (
            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: m.id === "sso" ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 16 }}>
                {m.fields.map(f => (
                  <div key={f.key} style={{ gridColumn: f.type === "textarea" ? "1 / -1" : "auto" }}>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>{f.label}</label>
                    {f.type === "textarea"
                      ? <textarea style={{ ...inp, height: 80, resize: "vertical" }} placeholder={f.placeholder} value={forms[m.id][f.key]} onChange={e => setForms(prev => ({ ...prev, [m.id]: { ...prev[m.id], [f.key]: e.target.value } }))} />
                      : f.type === "select"
                        ? <select style={{ ...inp, appearance: "none" }} value={forms[m.id][f.key]} onChange={e => setForms(prev => ({ ...prev, [m.id]: { ...prev[m.id], [f.key]: e.target.value } }))}>{f.options.map(o => <option key={o}>{o}</option>)}</select>
                        : <input style={inp} type={f.type} placeholder={f.placeholder} value={forms[m.id][f.key]} onChange={e => setForms(prev => ({ ...prev, [m.id]: { ...prev[m.id], [f.key]: e.target.value } }))} />
                    }
                  </div>
                ))}
              </div>

              {/* Attr map for SSO */}
              {m.id === "sso" && m.attrMap && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 10 }}>Mapeo de Atributos SAML</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {m.attrMap.map(a => (
                      <div key={a.saml} style={{ background: "#F5F5F5", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontFamily: "monospace" }}>
                        <span style={{ color: m.color }}>{a.saml}</span>
                        <span style={{ color: "#CCC", margin: "0 6px" }}>→</span>
                        <span style={{ color: COLORS.gray }}>{a.local}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 18 }}>
                <BtnPrimary onClick={() => handleSave(m.id)} style={{ background: m.color }}>
                  <Icon name="check" size={14} color="#fff" /> Guardar configuración
                </BtnPrimary>
                {saved === m.id && <span style={{ fontSize: 12, color: "#2E7D32", fontFamily: B }}>Guardado correctamente</span>}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
