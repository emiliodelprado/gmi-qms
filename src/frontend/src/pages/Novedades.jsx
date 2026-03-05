import { useState } from "react";
import { COLORS, H, B } from "../constants.jsx";

// ── Changelog by version ─────────────────────────────────────────────────────
const VERSIONS = [
  {
    version: "0.4.2",
    date:    "5 marzo 2026",
    title:   "Solicitudes con backend real y fix SAML",
    summary: "Sistema de solicitudes completo con persistencia en BD. Fix del HTTP 500 en producción al editar usuarios (SAML user_id). Script de sincronización multi-equipo.",
    tags:    ["Solicitudes API", "Fix SAML", "Migración 017", "sync-github"],
    items: [
      "Backend completo de solicitudes: modelo, schemas, CRUD, 4 endpoints REST (GET/POST/PUT/DELETE)",
      "Migración 017 — tabla solicitudes con índices en user_id y estado",
      "Drawer global conectado al API (POST) en vez de CustomEvent mock",
      "Página Solicitudes con datos reales: cambio de estado, comentarios admin, eliminación",
      "Permisos: cualquier usuario crea; admin (IT, Calidad, Dirección) gestiona",
      "3 nuevas acciones en audit log: SOLICITUD_CREATE/EDIT/DELETE",
      "Fix SAML: user_id en JWT era email en vez de ID numérico — causaba ValueError en int()",
      "Fix defensivo en get_current_user para sesiones SAML anteriores al fix",
      "sync-github.sh: fetch + pull automático + alembic upgrade tras pull",
    ],
  },
  {
    version: "0.4.1",
    date:    "4 marzo 2026",
    title:   "Talento, organigrama y configuración regional",
    summary: "Puestos y supervisores por entidad/marca. Organigrama con datos reales. Zona horaria configurable.",
    tags:    ["Puestos per-entity", "Organigrama SVG", "Zona horaria", "Migraciones 015-016"],
    items: [
      "Puestos y supervisor por entidad — un colaborador puede tener distintos en cada empresa/marca",
      "Migración 016: mueve puestos y supervisores de global a per-entity con migración automática de datos",
      "Organigrama con datos reales, agrupación por departamentos y líneas SVG de supervisor",
      "Configuración Regional: zona horaria IANA configurable, aplicada a timestamps en toda la app",
      "Nuevas páginas: Departamentos (niveles 0-4) y Puestos (con asignación a departamentos)",
      "Script copy_datos_to_prod actualizado con departments, positions, collaborators y regional_settings",
    ],
  },
  {
    version: "0.4.0",
    date:    "2 marzo 2026",
    title:   "Solicitudes UI, guía interactiva y herramientas dev",
    summary: "Página de solicitudes con filtros y drawer global. Tour PDCA interactivo. Herramientas de desarrollo.",
    tags:    ["Solicitudes UI", "Guía PDCA", "Dev tools"],
    items: [
      "Página Solicitudes con filtros por estado, gestión IT/admin y drawer global con selector por módulos",
      "Guía interactiva: tour de 10 pasos por módulos PDCA con tarjeta draggable y persistencia",
      "stop-dev.sh, modo backend-only en start-dev.sh, copy_config_from_prod, auto-carga .env.local",
    ],
  },
  {
    version: "0.3.0",
    date:    "28 febrero 2026",
    title:   "Administración operativa y fixes multi-tenant",
    summary: "Matriz de Roles y Registro de Actividad conectados al backend. Buscador global. Varios fixes de permisos jerárquicos.",
    tags:    ["Roles", "Audit log", "Buscador", "Fixes"],
    items: [
      "Matriz de Roles conectada al backend (GET/PUT /api/adm/role-permissions)",
      "Registro de Actividad con datos reales, filtros y exportación CSV (ISO 27001)",
      "Buscador global de pantallas en el TopBar con navegación directa",
      "Botón SSO en login de producción",
      "Fix: campos legales en Estructura, default_company_id incorrecto, branding scope entidad",
      "Fix: usuarios de grupo visibles con filtro jerárquico",
      "Migración 009: company_id nullable para scope=grupo",
    ],
  },
  {
    version: "0.2.0",
    date:    "25 febrero 2026",
    title:   "Estructura corporativa y login local",
    summary: "Árbol corporativo editable. Login local sin SAML. Copia de datos a producción.",
    tags:    ["Estructura", "Login local", "Copy prod"],
    items: [
      "Estructura Corporativa editable: árbol Grupo → Entidad Legal → Marca con CRUD completo",
      "Login local con email/contraseña (sin depender de SAML/OneLogin)",
      "Personalización UI dinámica desde estructura corporativa",
      "Scripts copy_datos_to_prod.py/.sh para copiar datos a producción",
    ],
  },
  {
    version: "0.1.0",
    date:    "20 febrero 2026",
    title:   "Base del sistema QMS",
    summary: "Arquitectura multi-tenant, autenticación SSO+local, 7 módulos con 30 pantallas, gestión de usuarios.",
    tags:    ["Multi-tenant", "SSO SAML", "7 módulos", "FastAPI", "React 19"],
    items: [
      "7 módulos: EST, RSG, OPE, TAL, SOP, MEJ, ADM — 30 pantallas navegables",
      "Multi-tenancy: user_tenants con scope grupo/entidad/marca y 7 roles QMS",
      "SSO SAML 2.0 via OneLogin + autenticación local Argon2id + sesiones HMAC-SHA256",
      "FastAPI + PostgreSQL + SQLAlchemy 2.0 + Alembic (migraciones 001-009)",
      "Gestión de usuarios: CRUD, accesos multi-tenant, reset de contraseña, seed dev",
      "Sidebar colapsable, TopBar con selector empresa/marca, audit log inmutable",
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const Tag = ({ label, bg, color }) => (
  <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, background: bg, color, fontFamily: H, border: `1px solid ${color}22` }}>
    {label}
  </span>
);

const Chevron = ({ open, color }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>
    <path d="M4 6l4 4 4-4" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────
export default function Novedades() {
  const [openIdx, setOpenIdx] = useState(0); // only latest open by default

  const toggle = (i) => setOpenIdx(prev => prev === i ? -1 : i);
  const current = VERSIONS[0];

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Hero — current version */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "28px 32px", marginBottom: 24, borderLeft: `4px solid ${COLORS.red}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>v{current.version}</span>
              <Tag label="ACTUAL" bg={COLORS.red} color="#fff" />
              <Tag label="Estable" bg="#E8F5E9" color="#2E7D32" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.gray, fontFamily: H, marginBottom: 10 }}>
              {current.title}
            </div>
            <p style={{ fontSize: 13, color: COLORS.grayLight, fontFamily: B, lineHeight: 1.7, maxWidth: 680, margin: 0 }}>
              {current.summary}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{current.date}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {current.tags.map(t => (
                <Tag key={t} label={t} bg="#F5F5F5" color={COLORS.grayLight} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Accordion changelog */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {VERSIONS.map((v, i) => {
          const isOpen = openIdx === i;
          const isCurrent = i === 0;
          return (
            <div key={v.version} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden" }}>
              {/* Accordion header */}
              <button
                onClick={() => toggle(i)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 20px", border: "none", background: isOpen ? "#FAFAFA" : COLORS.white,
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.gray, fontFamily: H, minWidth: 52 }}>
                  v{v.version}
                </span>
                {isCurrent && <Tag label="ACTUAL" bg={COLORS.red} color="#fff" />}
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray, fontFamily: H, flex: 1 }}>
                  {v.title}
                </span>
                <span style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B, whiteSpace: "nowrap", marginRight: 8 }}>
                  {v.date}
                </span>
                <Chevron open={isOpen} color={COLORS.grayLight} />
              </button>

              {/* Accordion body */}
              {isOpen && (
                <div style={{ padding: "4px 20px 16px 84px", borderTop: `1px solid ${COLORS.border}` }}>
                  <p style={{ fontSize: 12, color: COLORS.grayLight, fontFamily: B, lineHeight: 1.6, margin: "10px 0 12px" }}>
                    {v.summary}
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 16, listStyle: "none" }}>
                    {v.items.map((item, j) => (
                      <li key={j} style={{ fontSize: 12, color: COLORS.gray, fontFamily: B, lineHeight: 1.7, padding: "2px 0", display: "flex", gap: 8 }}>
                        <span style={{ color: COLORS.grayLight, flexShrink: 0 }}>-</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {v.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                      {v.tags.map(t => <Tag key={t} label={t} bg="#F5F5F5" color={COLORS.grayLight} />)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
