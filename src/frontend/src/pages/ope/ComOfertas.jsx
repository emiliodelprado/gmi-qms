import { useState } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, BtnPrimary, Badge, inputStyle } from "../../constants.jsx";

const INIT_OFERTAS = [
  { id: 1, codigo: "O20260210_TechCorp",       cliente: "TechCorp SL",          marca: "LIQUID",            importe: "45.000€", estado: "Enviada",   fecha: "2026-02-10" },
  { id: 2, codigo: "O20260118_IndustriasBeta", cliente: "Industrias Beta SA",    marca: "EPUNTO",            importe: "72.000€", estado: "Aceptada",  fecha: "2026-01-18" },
  { id: 3, codigo: "O20260205_FinanzaAlpha",   cliente: "FinanzAlpha Group",     marca: "THE LIQUID FINANCE",importe: "120.000€",estado: "Borrador",  fecha: "2026-02-05" },
  { id: 4, codigo: "O20251215_RetailMax",      cliente: "RetailMax España",      marca: "EPUNTO",            importe: "28.000€", estado: "Rechazada", fecha: "2025-12-15" },
  { id: 5, codigo: "O20260220_GlobalTech",     cliente: "Global Tech Partners",  marca: "LIQUID",            importe: "88.000€", estado: "Enviada",   fecha: "2026-02-20" },
];

const ESTADO_CFG = {
  Borrador:  { bg: "#F5F5F5", color: "#757575" },
  Enviada:   { bg: "#E3F2FD", color: "#1565C0" },
  Aceptada:  { bg: "#E8F5E9", color: "#2E7D32" },
  Rechazada: { bg: "#FFEBEE", color: "#C62828" },
};

const MARCAS = ["EPUNTO", "LIQUID", "THE LIQUID FINANCE"];

function genCodigo(cliente) {
  const hoy    = new Date();
  const dd     = String(hoy.getFullYear()) + String(hoy.getMonth() + 1).padStart(2, "0") + String(hoy.getDate()).padStart(2, "0");
  const nombre = (cliente || "Cliente").replace(/\s+/g, "").slice(0, 20);
  return `O${dd}_${nombre}`;
}

function Modal({ onClose, onSave }) {
  const [form, setForm] = useState({ cliente: "", marca: "EPUNTO", importe: "", notas: "" });
  const codigo = genCodigo(form.cliente);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: COLORS.white, borderRadius: 10, width: 500, padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>Nueva Oferta</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="x" size={18} color={COLORS.grayLight} /></button>
        </div>

        {/* Código autogenerado */}
        <div style={{ marginBottom: 16, padding: "10px 14px", background: COLORS.bg, borderRadius: 7, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: COLORS.grayLight, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 3 }}>Código (autogenerado)</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.red, fontFamily: "monospace" }}>{codigo}</div>
        </div>

        {[
          { label: "Cliente *",   key: "cliente",  type: "text",   placeholder: "Razón social del cliente" },
          { label: "Importe (€)", key: "importe",  type: "text",   placeholder: "ej. 45.000€" },
          { label: "Notas",       key: "notas",    type: "text",   placeholder: "Observaciones opcionales" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>{f.label}</label>
            <input style={inputStyle} type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: COLORS.grayLight, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: H }}>Marca</label>
          <select style={{ ...inputStyle, appearance: "none" }} value={form.marca} onChange={e => setForm(p => ({ ...p, marca: e.target.value }))}>
            {MARCAS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, color: COLORS.grayLight, fontFamily: B }}>Cancelar</button>
          <BtnPrimary onClick={() => { onSave({ ...form, codigo, estado: "Borrador", fecha: new Date().toISOString().slice(0, 10) }); onClose(); }} disabled={!form.cliente.trim()}>
            <Icon name="check" size={14} color="#fff" /> Crear oferta
          </BtnPrimary>
        </div>
      </div>
    </div>
  );
}

export default function ComOfertas() {
  const [ofertas, setOfertas] = useState(INIT_OFERTAS);
  const [search, setSearch]   = useState("");
  const [marca,  setMarca]    = useState("Todas");
  const [modal,  setModal]    = useState(false);
  let nextId = Math.max(...ofertas.map(o => o.id)) + 1;

  const visible = ofertas.filter(o => {
    const matchS = o.cliente.toLowerCase().includes(search.toLowerCase()) || o.codigo.toLowerCase().includes(search.toLowerCase());
    const matchM = marca === "Todas" || o.marca === marca;
    return matchS && matchM;
  });

  const handleSave = (data) => {
    setOfertas(prev => [{ id: nextId++, ...data }, ...prev]);
  };

  return (
    <div>
      {modal && <Modal onClose={() => setModal(false)} onSave={handleSave} />}

      <PageHeader
        title="Master de Ofertas"
        subtitle="Registro centralizado de propuestas comerciales según PR-OPE03"
        action={<BtnPrimary onClick={() => setModal(true)}><Icon name="plus" size={14} color="#fff" /> Nueva oferta</BtnPrimary>}
      />

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
          <Icon name="search" size={14} color={COLORS.grayLight} />
          <input
            style={{ ...inputStyle, paddingLeft: 32 }}
            placeholder="Buscar por cliente o código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <Icon name="search" size={14} color={COLORS.grayLight} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["Todas", ...MARCAS].map(m => (
            <button key={m} onClick={() => setMarca(m)}
              style={{ padding: "6px 12px", border: "none", borderRadius: 20, cursor: "pointer", background: marca === m ? COLORS.red : COLORS.white, color: marca === m ? "#fff" : COLORS.grayLight, fontSize: 11, fontWeight: 700, fontFamily: H, border: `1px solid ${marca === m ? COLORS.red : COLORS.border}` }}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F9F9F9" }}>
              {["Código","Cliente","Marca","Importe","Estado","Fecha"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.grayLight, fontWeight: 800, borderBottom: `2px solid ${COLORS.border}`, fontFamily: H, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "28px", textAlign: "center", color: COLORS.grayLight, fontFamily: B }}>Sin resultados</td></tr>
            ) : visible.map((o, i) => {
              const ecfg = ESTADO_CFG[o.estado] ?? ESTADO_CFG.Borrador;
              return (
                <tr key={o.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FCFCFC" }}>
                  <td style={{ padding: "11px 16px", fontFamily: "monospace", fontSize: 11, color: COLORS.red, fontWeight: 700 }}>{o.codigo}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 600, color: COLORS.gray, fontFamily: H }}>{o.cliente}</td>
                  <td style={{ padding: "11px 16px", fontSize: 12, color: COLORS.grayLight, fontFamily: B }}>{o.marca}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 700, color: COLORS.gray, fontFamily: H }}>{o.importe}</td>
                  <td style={{ padding: "11px 16px" }}><Badge label={o.estado} bg={ecfg.bg} color={ecfg.color} /></td>
                  <td style={{ padding: "11px 16px", fontSize: 11, color: COLORS.grayLight, fontFamily: "monospace" }}>{o.fecha}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
