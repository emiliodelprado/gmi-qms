import { useState } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, Badge } from "../../constants.jsx";

const ACTIVOS = [
  // IT
  { id: "IT-001", nombre: 'MacBook Pro 16" M3',        usuario: "Carlos Ruiz",       categoria: "IT",          tipo: "Portátil",    marca: "Apple",     modelo: "MBP16-M3",   compra: "2023-09-01", alerta: "ok",    prox_rev: "2025-09-01" },
  { id: "IT-002", nombre: "Dell XPS 15",                usuario: "Laura Sánchez",     categoria: "IT",          tipo: "Portátil",    marca: "Dell",      modelo: "XPS9530",    compra: "2022-03-15", alerta: "mant",  prox_rev: "2026-03-15" },
  { id: "IT-003", nombre: 'iPad Pro 13" M4',            usuario: "Miguel Torres",     categoria: "IT",          tipo: "Tablet",      marca: "Apple",     modelo: "IPAD-PRO-M4",compra: "2024-06-01", alerta: "ok",    prox_rev: "2026-06-01" },
  { id: "IT-004", nombre: "Servidor NAS Synology",      usuario: "IT Central",        categoria: "IT",          tipo: "Servidor",    marca: "Synology",  modelo: "DS923+",     compra: "2020-08-01", alerta: "renov", prox_rev: "2024-08-01" },
  { id: "IT-005", nombre: "HP LaserJet Pro MFP",        usuario: "Oficina Central",   categoria: "IT",          tipo: "Impresora",   marca: "HP",        modelo: "M428fdn",    compra: "2021-05-20", alerta: "mant",  prox_rev: "2026-05-20" },
  // Mobiliario
  { id: "MOB-001", nombre: "Sillas Ergonómicas (x10)", usuario: "Oficina Madrid",    categoria: "Mobiliario",  tipo: "Mobiliario",  marca: "Herman Miller", modelo: "Aeron", compra: "2022-01-15", alerta: "ok",    prox_rev: "2027-01-15" },
  { id: "MOB-002", nombre: "Mesa Reuniones Sala A",    usuario: "Sala Reuniones A",  categoria: "Mobiliario",  tipo: "Mobiliario",  marca: "Steelcase", modelo: "Coalesse",   compra: "2018-06-01", alerta: "renov", prox_rev: "2023-06-01" },
  // Instalaciones
  { id: "INS-001", nombre: "Aire Acondicionado Central",usuario: "Oficina Central",  categoria: "Instalación", tipo: "Instalación", marca: "Mitsubishi",modelo: "MXZ-4F72VA", compra: "2019-04-01", alerta: "mant",  prox_rev: "2026-04-01" },
  { id: "INS-002", nombre: "Sistema Alarma y CCTV",    usuario: "Seguridad",         categoria: "Instalación", tipo: "Instalación", marca: "Hikvision", modelo: "DS-7608NI",  compra: "2021-11-01", alerta: "calib", prox_rev: "2026-02-01" },
  { id: "INS-003", nombre: "SAI / UPS Oficina",        usuario: "IT Central",        categoria: "Instalación", tipo: "Instalación", marca: "APC",       modelo: "SMT1500IC",  compra: "2022-03-01", alerta: "calib", prox_rev: "2026-03-01" },
  // Vehículos
  { id: "VEH-001", nombre: "Seat León – 1234 ABC",    usuario: "Dirección General",  categoria: "Vehículo",    tipo: "Vehículo",    marca: "Seat",      modelo: "León 2.0 TDI",compra: "2022-07-01", alerta: "mant",  prox_rev: "2026-07-01" },
  { id: "VEH-002", nombre: "Renault Clio – 5678 DEF", usuario: "Operaciones",        categoria: "Vehículo",    tipo: "Vehículo",    marca: "Renault",   modelo: "Clio 1.5 dCi",compra: "2019-03-01", alerta: "renov", prox_rev: "2024-03-01" },
];

const ALERTA_CFG = {
  ok:    { label: "Operativo",        bg: "#E8F5E9", color: "#2E7D32", icon: "check"   },
  mant:  { label: "Mant. preventivo", bg: "#FFF8E1", color: "#F57F17", icon: "clock"   },
  calib: { label: "Calibración",      bg: "#E3F2FD", color: "#1565C0", icon: "chart"   },
  renov: { label: "Renovar garantía", bg: "#FFEBEE", color: "#C62828", icon: "warning" },
};

const CAT_ICONS = { IT: "monitor", Mobiliario: "folder", "Instalación": "shield", "Vehículo": "briefcase" };

export default function EquEquipamiento() {
  const [filter, setFilter] = useState("Todos");

  const visible = filter === "Todos" ? ACTIVOS : ACTIVOS.filter(a => a.alerta === filter);
  const counts  = Object.fromEntries(Object.keys(ALERTA_CFG).map(k => [k, ACTIVOS.filter(a => a.alerta === k).length]));

  return (
    <div>
      <PageHeader title="Gestión de Equipamiento" subtitle="Activos de la empresa: IT, mobiliario, instalaciones y vehículos" />

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <Card style={{ flex: 1, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F0F0F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{ACTIVOS.length}</div>
          <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>Total activos</div>
        </Card>
        {Object.entries(ALERTA_CFG).map(([key, cfg]) => (
          <Card key={key} style={{ flex: 1, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: filter === key ? cfg.bg : COLORS.white }}
            onClick={() => setFilter(filter === key ? "Todos" : key)}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={cfg.icon} size={16} color={cfg.color} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: cfg.color, fontFamily: H }}>{counts[key]}</div>
              <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{cfg.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Grid of cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {visible.map(activo => {
          const acfg = ALERTA_CFG[activo.alerta];
          const ticn = CAT_ICONS[activo.categoria] ?? "monitor";
          return (
            <Card key={activo.id} style={{ padding: "16px 18px", borderTop: `3px solid ${acfg.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={ticn} size={16} color={COLORS.grayLight} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{activo.nombre}</div>
                    <div style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: "monospace" }}>{activo.id} · {activo.modelo}</div>
                  </div>
                </div>
                <Badge label={acfg.label} bg={acfg.bg} color={acfg.color} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  { label: "Asignado a",    value: activo.usuario },
                  { label: "Categoría",     value: activo.categoria },
                  { label: "Prox. revisión",value: activo.prox_rev },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: H, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{r.label}</span>
                    <span style={{ fontSize: 11, color: COLORS.gray, fontFamily: B }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
