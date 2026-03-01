import { useState, useEffect, useRef } from "react";
import { COLORS, H, B, Card, PageHeader, Icon, BtnPrimary } from "../../constants.jsx";

// Build the entity/brand selector list from the corporate structure flat list.
// Each Entidad Legal gets a global entry + one entry per active Marca child.
function buildEntities(flat) {
  const legalEntities = flat
    .filter(e => e.tipo === "Entidad Legal" && e.activo)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

  const result = [];
  legalEntities.forEach(le => {
    result.push({ label: `${le.code} (global)`, company_id: le.code, brand_id: "" });
    flat
      .filter(e => e.tipo === "Marca" && e.parent_id === le.id && e.activo)
      .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
      .forEach(m => result.push({ label: `${le.code} – ${m.label}`, company_id: le.code, brand_id: m.label }));
  });
  return result;
}

const MAX_BYTES     = 512 * 1024;
const ALLOWED_TYPES = ["image/png", "image/svg+xml", "image/jpeg"];

export default function AdmUI() {
  const [entities,   setEntities]   = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [logoData,   setLogoData]   = useState(null);
  const [color,      setColor]      = useState("#A91E22");
  const [colorText,  setColorText]  = useState("#A91E22");   // text field (may be partial)
  const [saving,     setSaving]     = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Load corporate structure and build entity list
  useEffect(() => {
    fetch("/api/adm/structure", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const built = buildEntities(data);
        setEntities(built);
        if (built.length > 0) setSelected(built[0]);
      })
      .catch(() => {});
  }, []);

  // Fetch settings whenever entity changes
  useEffect(() => {
    if (!selected) return;
    setLogoData(null);
    setColor("#A91E22");
    setColorText("#A91E22");
    setError(null);
    setSaved(false);

    let cancelled = false;
    const { company_id, brand_id } = selected;
    fetch(
      `/api/adm/ui/brand-settings?company_id=${encodeURIComponent(company_id)}&brand_id=${encodeURIComponent(brand_id)}`,
      { credentials: "include" }
    )
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled) return;
        if (data) {
          setLogoData(data.logo_data || null);
          const c = data.primary_color || "#A91E22";
          setColor(c);
          setColorText(c);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [selected]);

  const handleFile = (file) => {
    setError(null);
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Formato no permitido. Usa PNG, JPG o SVG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("El archivo supera los 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setLogoData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/adm/ui/brand-settings", {
        method:      "PUT",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id:    selected.company_id,
          brand_id:      selected.brand_id,
          logo_data:     logoData,
          primary_color: color,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.detail || "Error al guardar");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      // Notify TopBar and sidebar to refresh immediately
      window.dispatchEvent(new CustomEvent("brand-settings-saved", {
        detail: {
          company_id:    selected.company_id,
          brand_id:      selected.brand_id,
          logo_data:     logoData,
          primary_color: color,
        },
      }));
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const isSelected = (e) =>
    selected && e.company_id === selected.company_id && e.brand_id === selected.brand_id;

  if (!selected) return (
    <div>
      <PageHeader
        title="Personalización de Interfaz"
        subtitle="Editor de marca blanca segmentado por Entidad Legal y Marca"
      />
      <div style={{ color: COLORS.grayLight, fontFamily: "sans-serif", fontSize: 13 }}>
        Cargando estructura corporativa…
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Personalización de Interfaz"
        subtitle="Editor de marca blanca segmentado por Entidad Legal y Marca"
      />

      <div style={{ display: "flex", gap: 16 }}>
        {/* ── Entity selector ─────────────────────────────────────────────── */}
        <Card style={{ width: 220, flexShrink: 0, padding: 14 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: COLORS.grayLight,
            textTransform: "uppercase", letterSpacing: "0.08em",
            fontFamily: H, marginBottom: 10,
          }}>
            Entidad / Marca
          </div>
          {entities.map(e => (
            <button
              key={`${e.company_id}|${e.brand_id}`}
              onClick={() => setSelected(e)}
              style={{
                width: "100%", padding: "8px 12px", marginBottom: 4,
                textAlign: "left",
                border:     `1px solid ${isSelected(e) ? COLORS.red : COLORS.border}`,
                borderRadius: 6,
                background: isSelected(e) ? "#FFF8F8" : COLORS.white,
                fontSize:   12,
                color:      isSelected(e) ? COLORS.red : COLORS.gray,
                fontFamily: B,
                fontWeight: isSelected(e) ? 700 : 400,
                cursor:     "pointer",
              }}
            >
              {e.label}
            </button>
          ))}
        </Card>

        {/* ── Editor ──────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 22 }}>

            {/* Color corporativo */}
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: COLORS.grayLight,
                textTransform: "uppercase", letterSpacing: "0.08em",
                fontFamily: H, marginBottom: 10,
              }}>
                Color Corporativo
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <input
                  type="color"
                  value={color}
                  onChange={e => { setColor(e.target.value); setColorText(e.target.value.toUpperCase()); }}
                  style={{
                    width: 48, height: 40, border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, cursor: "pointer", padding: 2,
                  }}
                />
                <div>
                  <input
                    type="text"
                    value={colorText}
                    maxLength={7}
                    onChange={e => {
                      let v = e.target.value.toUpperCase();
                      if (v && !v.startsWith("#")) v = `#${v}`;
                      setColorText(v);
                      if (/^#[0-9A-Fa-f]{6}$/.test(v)) setColor(v);
                    }}
                    onBlur={() => {
                      if (!/^#[0-9A-Fa-f]{6}$/.test(colorText)) setColorText(color.toUpperCase());
                    }}
                    style={{
                      fontSize: 14, fontWeight: 800, color: COLORS.gray, fontFamily: H,
                      border: `1px solid ${/^#[0-9A-Fa-f]{6}$/.test(colorText) ? COLORS.border : COLORS.red}`,
                      borderRadius: 6, padding: "4px 8px", width: 96,
                      outline: "none", letterSpacing: "0.05em",
                    }}
                  />
                  <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, marginTop: 3 }}>
                    Color principal de la interfaz
                  </div>
                </div>
                <div style={{
                  width: 56, height: 40, borderRadius: 8, background: color,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }} />
              </div>
            </div>

            {/* Logo de marca */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: COLORS.grayLight,
                textTransform: "uppercase", letterSpacing: "0.08em",
                fontFamily: H, marginBottom: 10,
              }}>
                Logotipo de Marca
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".png,.jpg,.jpeg,.svg"
                style={{ display: "none" }}
                onChange={e => handleFile(e.target.files[0])}
              />
              {logoData ? (
                /* Logo preview + actions */
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 12,
                    background: "#FAFAFA", display: "flex", alignItems: "center",
                    justifyContent: "center", width: 180, height: 80, flexShrink: 0,
                  }}>
                    <img
                      src={logoData}
                      alt="Logo"
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: "6px 16px",
                        border: `1px solid ${COLORS.border}`, borderRadius: 6,
                        background: COLORS.white, cursor: "pointer",
                        fontSize: 12, fontFamily: B, color: COLORS.gray,
                      }}
                    >
                      Cambiar imagen
                    </button>
                    <button
                      onClick={() => setLogoData(null)}
                      style={{
                        padding: "6px 16px",
                        border: `1px solid ${COLORS.red}`, borderRadius: 6,
                        background: "none", cursor: "pointer",
                        fontSize: 12, fontFamily: B, color: COLORS.red,
                      }}
                    >
                      Quitar logo
                    </button>
                  </div>
                </div>
              ) : (
                /* Drop zone */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragging ? COLORS.red : COLORS.border}`,
                    borderRadius: 8, padding: "28px 12px",
                    textAlign: "center", cursor: "pointer",
                    background: dragging ? "#FFF8F8" : "#FAFAFA",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <Icon name="upload" size={22} color={dragging ? COLORS.red : COLORS.grayLight} />
                  <div style={{
                    fontSize: 12, color: COLORS.gray, fontFamily: B,
                    marginTop: 8, fontWeight: 700,
                  }}>
                    Arrastra aquí o haz clic para seleccionar
                  </div>
                  <div style={{ fontSize: 10, color: "#CCC", fontFamily: B, marginTop: 4 }}>
                    PNG · JPG · SVG · máx. 500 KB
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginBottom: 14, padding: "8px 12px",
                background: "#FFF0F0", border: `1px solid ${COLORS.red}`,
                borderRadius: 6, fontSize: 12, color: COLORS.red, fontFamily: B,
              }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <BtnPrimary
                onClick={handleSave}
                disabled={saving}
                style={{ background: color, opacity: saving ? 0.7 : 1 }}
              >
                <Icon name="check" size={14} color="#fff" />
                {saving ? "Guardando…" : "Guardar apariencia"}
              </BtnPrimary>
              {saved && (
                <span style={{ fontSize: 12, color: "#2E7D32", fontFamily: B }}>
                  ✓ Guardado para {selected.label}
                </span>
              )}
            </div>
          </Card>

          {/* Preview */}
          <Card style={{ padding: 16 }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: COLORS.grayLight,
              textTransform: "uppercase", letterSpacing: "0.08em",
              fontFamily: H, marginBottom: 12,
            }}>
              Vista Previa
            </div>

            {/* Mini app frame */}
            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>

              {/* Mini topbar */}
              <div style={{
                background: "#fff", borderBottom: `1px solid ${COLORS.border}`,
                padding: "6px 10px", display: "flex", alignItems: "center", gap: 6,
              }}>
                <div style={{ fontSize: 6, fontWeight: 800, color: COLORS.gray, letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 1.5, flexShrink: 0 }}>
                  Quality<br />Management<br />System
                </div>
                <div style={{ width: 1, height: 18, background: COLORS.border, margin: "0 4px", flexShrink: 0 }} />
                <div style={{ fontSize: 7, color: COLORS.grayLight, fontFamily: B, flexShrink: 0 }}>GMS ▾  EPUNTO ▾</div>
                {logoData && (
                  <>
                    <div style={{ width: 1, height: 18, background: COLORS.border, margin: "0 4px", flexShrink: 0 }} />
                    <img src={logoData} alt="logo" style={{ height: 18, maxWidth: 80, objectFit: "contain", flexShrink: 0 }} />
                  </>
                )}
                <div style={{ flex: 1 }} />
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: color, flexShrink: 0 }} />
              </div>

              {/* Mini body */}
              <div style={{ display: "flex", height: 110 }}>
                {/* Mini sidebar */}
                <div style={{ width: 66, background: color, padding: "6px 4px", flexShrink: 0 }}>
                  {["Estrategia", "Riesgos", "Operaciones", "Talento", "Soporte"].map(s => (
                    <div key={s} style={{ fontSize: 6.5, color: "rgba(255,255,255,0.65)", padding: "3px 5px", fontFamily: B }}>{s}</div>
                  ))}
                </div>
                {/* Mini content */}
                <div style={{ flex: 1, background: COLORS.bg, padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <div style={{ padding: "4px 10px", background: color, borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <Icon name="check" size={8} color="#fff" />
                      <span style={{ fontSize: 7.5, fontWeight: 800, color: "#fff", fontFamily: H }}>Botón primario</span>
                    </div>
                    <div style={{ padding: "4px 10px", background: color + "18", border: `1px solid ${color}`, borderRadius: 4, display: "inline-flex", alignItems: "center" }}>
                      <span style={{ fontSize: 7.5, fontWeight: 800, color: color, fontFamily: H }}>Botón secundario</span>
                    </div>
                  </div>
                  <div style={{ background: COLORS.white, borderRadius: 4, border: `1px solid ${COLORS.border}`, flex: 1 }} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
