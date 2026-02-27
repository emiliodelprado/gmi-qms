import { useState } from "react";
import { COLORS, H, B, Icon, Card, PageHeader, Badge } from "../../constants.jsx";

const ACTIVOS = [
  { id: "IT-001", nombre: "MacBook Pro 16\" M3",      usuario: "Carlos Ruiz",        tipo: "Portátil",  marca: "Apple",   modelo: "MBP16-M3",    compra: "2023-09-01", alerta: "ok",      prox_rev: "2025-09-01" },
  { id: "IT-002", nombre: "Dell XPS 15",               usuario: "Laura Sánchez",      tipo: "Portátil",  marca: "Dell",    modelo: "XPS9530",     compra: "2022-03-15", alerta: "mant",    prox_rev: "2026-03-15" },
  { id: "IT-003", nombre: "iPad Pro 13\" M4",          usuario: "Miguel Torres",      tipo: "Tablet",    marca: "Apple",   modelo: "IPAD-PRO-M4", compra: "2024-06-01", alerta: "ok",      prox_rev: "2026-06-01" },
  { id: "IT-004", nombre: "iMac 27\" Retina",          usuario: "Sala Reuniones A",   tipo: "Sobremesa", marca: "Apple",   modelo: "iMac27-2020", compra: "2020-11-01", alerta: "renov",   prox_rev: "2024-11-01" },
  { id: "IT-005", nombre: "HP LaserJet Pro MFP",      usuario: "Oficina Central",    tipo: "Impresora", marca: "HP",      modelo: "M428fdn",     compra: "2021-05-20", alerta: "mant",    prox_rev: "2026-05-20" },
  { id: "IT-006", nombre: "MacBook Air M2",            usuario: "Ana García",         tipo: "Portátil",  marca: "Apple",   modelo: "MBA-M2",      compra: "2024-01-10", alerta: "ok",      prox_rev: "2026-01-10" },
  { id: "IT-007", nombre: "Surface Pro 9",             usuario: "Sin asignar",        tipo: "Portátil",  marca: "Microsoft",modelo: "SFPRO9",     compra: "2023-04-01", alerta: "ok",      prox_rev: "2025-04-01" },
  { id: "IT-008", nombre: "iPhone 15 Pro",             usuario: "Dir. General",       tipo: "Móvil",     marca: "Apple",   modelo: "IP15PRO",     compra: "2023-10-01", alerta: "ok",      prox_rev: "2025-10-01" },
  { id: "IT-009", nombre: "Servidor NAS Synology",    usuario: "IT Central",         tipo: "Servidor",  marca: "Synology",modelo: "DS923+",     compra: "2020-08-01", alerta: "renov",   prox_rev: "2024-08-01" },
  { id: "IT-010", nombre: "Monitor 4K LG 32\"",       usuario: "Carlos Ruiz",        tipo: "Monitor",   marca: "LG",      modelo: "32UK550",     compra: "2023-09-01", alerta: "ok",      prox_rev: "2028-09-01" },
];

const ALERTA_CFG = {
  ok:    { label: "Operativo",     bg: "#E8F5E9", color: "#2E7D32", icon: "check"   },
  mant:  { label: "Mant. próximo", bg: "#FFF8E1", color: "#F57F17", icon: "clock"   },
  renov: { label: "Renovar",       bg: "#FFEBEE", color: "#C62828", icon: "warning" },
};

const TIPO_ICONS = { Portátil: "monitor", Tablet: "monitor", Sobremesa: "monitor", Impresora: "folder", Móvil: "profile", Servidor: "shield" };

export default function InfInventario() {
  const [filter, setFilter] = useState("Todos");

  const tipos   = ["Todos", "ok", "mant", "renov"];
  const labels  = { Todos: "Todos", ok: "Operativos", mant: "Mant. próximo", renov: "Renovar" };
  const visible = filter === "Todos" ? ACTIVOS : ACTIVOS.filter(a => a.alerta === filter);

  const counts = { ok: ACTIVOS.filter(a => a.alerta === "ok").length, mant: ACTIVOS.filter(a => a.alerta === "mant").length, renov: ACTIVOS.filter(a => a.alerta === "renov").length };

  return (
    <div>
      <PageHeader title="Inventario IT" subtitle="Gestión de activos tecnológicos y alertas de mantenimiento" />

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <Card style={{ flex: 1, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F0F0F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>{ACTIVOS.length}</div>
          <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>Total activos IT</div>
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
          const acfg  = ALERTA_CFG[activo.alerta];
          const ticn  = TIPO_ICONS[activo.tipo] ?? "monitor";
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
                  { label: "Usuario",       value: activo.usuario },
                  { label: "Tipo",          value: activo.tipo },
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
