import { useState } from "react";
import { COLORS, H, B, Card, PageHeader, Icon, BtnPrimary } from "../../constants.jsx";

const ENTITIES = [
  "GMS – EPUNTO",
  "GMS – LIQUID",
  "GMS – THE LIQUID FINANCE",
  "GMP – EPUNTO Portugal",
  "GMP – LIQUID Portugal",
];

const UploadBox = ({ label }) => (
  <div style={{
    border: `2px dashed ${COLORS.border}`, borderRadius: 8, padding: "22px 12px",
    textAlign: "center", cursor: "pointer", background: "#FAFAFA",
  }}>
    <Icon name="upload" size={20} color={COLORS.grayLight} />
    <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, marginTop: 6 }}>{label}</div>
    <div style={{ fontSize: 10, color: "#CCC", fontFamily: B, marginTop: 2 }}>PNG · SVG · máx. 500 KB</div>
  </div>
);

export default function AdmUI() {
  const [selected, setSelected] = useState("GMS – EPUNTO");
  const [color,    setColor]    = useState("#A91E22");
  const [saved,    setSaved]    = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div>
      <PageHeader title="Personalización de Interfaz" subtitle="Editor de marca blanca segmentado por Entidad Legal y Marca" />

      <div style={{ display: "flex", gap: 16 }}>
        {/* Entity selector */}
        <Card style={{ width: 220, flexShrink: 0, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 10 }}>Entidad / Marca</div>
          {ENTITIES.map(e => (
            <button key={e} onClick={() => setSelected(e)} style={{
              width: "100%", padding: "8px 12px", marginBottom: 4, textAlign: "left",
              border: `1px solid ${selected === e ? COLORS.red : COLORS.border}`,
              borderRadius: 6, background: selected === e ? "#FFF8F8" : COLORS.white,
              fontSize: 12, color: selected === e ? COLORS.red : COLORS.gray,
              fontFamily: B, fontWeight: selected === e ? 700 : 400, cursor: "pointer",
            }}>{e}</button>
          ))}
        </Card>

        {/* Editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 22 }}>
            {/* Color */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 10 }}>Color Corporativo</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  style={{ width: 48, height: 40, border: `1px solid ${COLORS.border}`, borderRadius: 7, cursor: "pointer", padding: 2 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{color.toUpperCase()}</div>
                  <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>Color principal de la interfaz</div>
                </div>
                <div style={{ width: 56, height: 40, borderRadius: 8, background: color, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }} />
              </div>
            </div>

            {/* Images */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 10 }}>Logotipo e Imágenes</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <UploadBox label="Logotipo principal" />
                <UploadBox label="Favicon (32 × 32)" />
                <UploadBox label="Fondo pantalla login" />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <BtnPrimary onClick={handleSave} style={{ background: color }}>
                <Icon name="check" size={14} color="#fff" /> Guardar apariencia
              </BtnPrimary>
              {saved && <span style={{ fontSize: 12, color: "#2E7D32", fontFamily: B }}>Guardado para {selected}</span>}
            </div>
          </Card>

          {/* Preview */}
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 12 }}>Vista Previa</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px", background: "#1A1A1A", borderRadius: 8, flex: 1 }}>
                <div style={{ width: 34, height: 34, borderRadius: 6, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", fontFamily: H, flexShrink: 0 }}>GMI</div>
                <div style={{ fontSize: 9, color: "#fff", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: H, fontWeight: 800, lineHeight: 1.4 }}>Quality<br />Management<br />System</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ padding: "8px 16px", background: color, borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Icon name="check" size={13} color="#fff" />
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", fontFamily: H }}>Botón primario</span>
                </div>
                <div style={{ padding: "8px 16px", background: color + "18", border: `1px solid ${color}`, borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: color, fontFamily: H }}>Botón secundario</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
