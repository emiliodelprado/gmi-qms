import { COLORS, H, B } from "../constants.jsx";

// ── Data ──────────────────────────────────────────────────────────────────────
const RELEASE = {
  version: "0.4.1",
  date:    "4 marzo 2026",
  title:   "Talento, estructura organizacional y configuración regional",
  summary: "Versión centrada en el módulo de Talento y Estructura. Implementa puestos y supervisores por entidad/marca (un colaborador puede tener distintos puestos y supervisores en cada empresa o marca). Añade la página de Organigrama con datos reales, agrupación por departamentos según nivel jerárquico y líneas SVG de supervisor. Incorpora configuración regional (zona horaria) y nuevas páginas de administración para departamentos y puestos. Actualiza el script de copia de producción para incluir departamentos, puestos y colaboradores.",
};

const SECTIONS = [
  {
    icon: "👥",
    color: COLORS.red,
    bg:    "#FFEBEE",
    title: "Puestos y supervisores por entidad/marca",
    subtitle: "Migración 016 · Modelo relacional per-entity",
    items: [
      { label: "Puestos por entidad",                  detail: "Un colaborador puede tener distintos puestos en cada empresa o marca activada. La asignación se gestiona inline al activar cada entidad en la Ficha Colaborador" },
      { label: "Supervisor por entidad",                detail: "Cada asignación de entidad tiene su propio supervisor. Permite jerarquías distintas en cada empresa o marca (ej. supervisor A en GMS, supervisor B en EPUNTO)" },
      { label: "Migración automática de datos",         detail: "La migración 016 copia los puestos y supervisores globales existentes a todas las entidades del colaborador. No se pierde información" },
      { label: "Eliminación de tablas globales",         detail: "Se elimina collaborator_positions y collaborators.supervisor_id. Los puestos y supervisores ahora viven en collaborator_entity_positions y collaborator_entities.supervisor_id" },
      { label: "UI inline en Ficha Colaborador",        detail: "Al activar una entidad se despliegan dropdown de supervisor y pills de puestos. Reemplaza las secciones globales anteriores" },
    ],
  },
  {
    icon: "🏢",
    color: "#1565C0",
    bg:    "#E3F2FD",
    title: "Organigrama con datos reales",
    subtitle: "Departamentos · Niveles · Líneas SVG",
    items: [
      { label: "Selector de entidad en la página",     detail: "Dropdown propio para elegir la entidad o marca a visualizar, independiente del selector global del TopBar" },
      { label: "Agrupación por departamentos",          detail: "Los colaboradores se agrupan en su departamento principal (determinado por sus puestos). Departamentos ordenados de arriba a abajo según nivel jerárquico (0=Corporativo → 4=Operacional)" },
      { label: "Líneas de supervisor SVG",              detail: "Overlay SVG con curvas bezier que conectan supervisor y subordinado. Se recalculan automáticamente al redimensionar la ventana" },
      { label: "Tarjetas de colaborador",               detail: "Avatar con iniciales, nombre completo, pills de puestos e indicador de supervisor. Sección 'Sin departamento' para colaboradores sin mapping posición→departamento" },
      { label: "Leyenda visual",                        detail: "Colores por nivel de departamento (rojo=Corporativo, naranja=Dirección, azul=Área, verde=Sección, gris=Operacional) y ejemplo de línea supervisor" },
    ],
  },
  {
    icon: "🌐",
    color: "#00695C",
    bg:    "#E0F2F1",
    title: "Configuración Regional",
    subtitle: "Zona horaria · Migraciones 015-016",
    items: [
      { label: "Página de Configuración Regional",     detail: "Nueva página en Administración → Configuración para establecer la zona horaria de la aplicación. Dropdown con zonas IANA (Europa, América, UTC)" },
      { label: "Timestamps corregidos",                 detail: "Registro de Actividad y Gestión de Usuarios ahora muestran las horas en la zona horaria configurada en vez de la del navegador" },
      { label: "TimezoneContext global",                detail: "React Context que propaga la zona horaria configurada a todos los componentes. Se actualiza en tiempo real al guardar sin recargar la página" },
      { label: "Departamentos y Puestos",               detail: "Nuevas páginas de administración para gestionar el catálogo de departamentos (con niveles jerárquicos 0-4) y puestos (con asignación a departamentos)" },
    ],
  },
  {
    icon: "🔄",
    color: "#6A1B9A",
    bg:    "#F3E5F5",
    title: "Copia de datos de producción",
    subtitle: "copy_config_from_prod actualizado",
    items: [
      { label: "Nuevas tablas en el script de copia",   detail: "Además de corporate_entities, ui_brand_settings, quality_policies y role_permissions, ahora copia departments, positions, position_departments, collaborators, collaborator_entities, collaborator_entity_positions y regional_settings" },
      { label: "Orden de inserción por dependencias",   detail: "Las tablas se copian en orden que respeta las foreign keys: primero las tablas base, luego las join tables y relaciones dependientes" },
    ],
  },
  {
    icon: "🗂️",
    color: "#1565C0",
    bg:    "#E3F2FD",
    title: "Módulos y pantallas",
    subtitle: "7 módulos · 30 pantallas",
    items: [
      { label: "EST – Estrategia",     detail: "Vista Ejecutiva, Estado de Objetivos, Matriz DAFO/CAME, Organigrama, Listado de Procesos, Partes Interesadas, Política de Calidad" },
      { label: "RSG – Riesgos",        detail: "Calculadora de Riesgos, Mapa ISO 9001, Mapa ISO 27001, Plan de Acciones" },
      { label: "OPE – Operaciones",    detail: "Master de Ofertas, Seguimiento de Entregables" },
      { label: "TAL – Talento",        detail: "Ficha Colaborador, Gestión de Formación, Checklist de Bienvenida" },
      { label: "SOP – Soporte",        detail: "Listado Maestro de Documentos, Homologación de Proveedores, Inventario de Activos Digitales, Gestión de Equipamiento" },
      { label: "MEJ – Mejora",         detail: "Planificación de Auditorías, Gestión de No Conformidades, Canal de Denuncias" },
      { label: "ADM – Administración", detail: "Estructura Corporativa, Editor de Procesos, Gestión de Usuarios, Matriz de Roles y Permisos, Registro de Actividad, Métodos de Autenticación, Personalización UI" },
    ],
  },
  {
    icon: "🔒",
    color: "#6A1B9A",
    bg:    "#F3E5F5",
    title: "Autenticación y sesiones",
    subtitle: "SSO + Local auth",
    items: [
      { label: "SSO SAML 2.0 via OneLogin",       detail: "Inicio de sesión federado con redirección automática al IdP corporativo" },
      { label: "Autenticación local con Argon2id", detail: "Hash de contraseñas con argon2-cffi (time_cost=2, memory=64 MB). Re-hash automático si los parámetros cambian" },
      { label: "Sesiones HMAC-SHA256",             detail: "Token firmado con clave secreta. Expira en 8 horas. Cookie httpOnly + SameSite=lax" },
      { label: "Restablecimiento de contraseña",  detail: "Token SHA-256 de un solo uso con caducidad de 24 horas. En DEV_MODE el token aparece en la respuesta de la API" },
      { label: "DEV_MODE sin SAML",                detail: "Usuarios de prueba IT, Auditor y Colaborador activables via /auth/dev-login/:role" },
    ],
  },
  {
    icon: "🏢",
    color: "#E65100",
    bg:    "#FFF3E0",
    title: "Multi-tenancy por empresa y marca",
    subtitle: "GMS / GMP · EPUNTO / LIQUID / THE LIQUID FINANCE",
    items: [
      { label: "Tabla user_tenants",               detail: "Relación N:M entre usuario y (empresa, marca). Un usuario puede tener roles distintos en cada combinación" },
      { label: "Selector en TopBar",               detail: "Cambia el contexto activo de empresa y marca en tiempo real para toda la aplicación" },
      { label: "Cabeceras X-Tenant-Company / X-Tenant-Brand", detail: "El frontend envía el tenant activo en cada petición. El backend resuelve el rol correspondiente del usuario" },
      { label: "7 roles QMS",                      detail: "IT · Dirección · Calidad · Partners · Managers · Colaborador · Auditor — con permisos distintos por pantalla" },
      { label: "Filtrado de usuarios por tenant",  detail: "GET /api/adm/users?company_id=X&brand_id=Y devuelve solo los usuarios con acceso a ese tenant" },
    ],
  },
  {
    icon: "🗄️",
    color: "#2E7D32",
    bg:    "#E8F5E9",
    title: "Base de datos y backend",
    subtitle: "FastAPI · PostgreSQL · Alembic",
    items: [
      { label: "FastAPI 0.115 + Uvicorn",          detail: "API REST con documentación automática en /api/docs (Swagger) y /api/redoc" },
      { label: "PostgreSQL + SQLAlchemy 2.0",      detail: "ORM con modelos UserAccess, UserTenant, PasswordResetToken, AuditLog, RolePermission, CorporateEntity, UIBrandSettings" },
      { label: "Migraciones Alembic (9 versiones)", detail: "001 esquema base · 002 auth local · 003 user_tenants · 004 ui_brand_settings · 005 corporate_entities · 006 scope jerárquico · 007 campos legales · 008 default_tenant · 009 company_id nullable" },
      { label: "Audit log inmutable",              detail: "Todas las acciones de escritura quedan registradas con usuario, acción, entidad, tenant e IP" },
      { label: "CORS configurado",                 detail: "Orígenes permitidos: https://qms.gmiberia.com y http://localhost:3001. Cabeceras X-Tenant expuestas" },
    ],
  },
  {
    icon: "⚙️",
    color: "#C62828",
    bg:    "#FFEBEE",
    title: "Gestión de usuarios (V-USER)",
    subtitle: "Conectada al backend real",
    items: [
      { label: "CRUD completo con persistencia",   detail: "Crear, editar, desactivar y eliminar usuarios en la base de datos. Ya no usa datos mock" },
      { label: "Formulario de accesos multi-tenant", detail: "Cada usuario puede tener múltiples filas (empresa · marca · rol) gestionables desde el mismo modal" },
      { label: "Columna 'Accesos totales'",         detail: "Chips de color por rol muestran todos los tenants del usuario, no solo el del contexto activo" },
      { label: "Reset de contraseña",               detail: "IT puede forzar un reset para cualquier usuario. El token aparece en pantalla en DEV_MODE" },
      { label: "Seed de desarrollo",                detail: "seed_dev.py inserta 11 usuarios de ejemplo con distintas combinaciones multi-tenant al arrancar en local" },
    ],
  },
  {
    icon: "🎨",
    color: "#3949AB",
    bg:    "#E8EAF6",
    title: "Interfaz y navegación",
    subtitle: "3 niveles · Sidebar · TopBar",
    items: [
      { label: "Navegación 3 niveles",             detail: "Módulo (nivel 1) › Función (nivel 2) › Pantalla (nivel 3). URL canónica /modulo/funcion/pantalla" },
      { label: "Sidebar colapsable",               detail: "Modo mini (52 px) con iconos y tooltips. El estado se persiste en localStorage" },
      { label: "Sidebar con color corporativo",    detail: "Fondo #ac2523, tipografía blanca, seleccionado #424242. Auto-expand al navegar directamente por URL" },
      { label: "TopBar con dropdown de perfil",    detail: "Muestra nombre, email, rol y tenant activo leídos de /auth/me. Botón de cierre de sesión incluido" },
      { label: "CompanyContext global",            detail: "El selector de empresa y marca en TopBar actualiza el contexto en todos los componentes de la app" },
      { label: "Pantalla de inicio HomeModules",   detail: "Tarjetas de acceso rápido a los 7 módulos con descripción y conteo de pantallas" },
    ],
  },
  {
    icon: "📋",
    color: "#E65100",
    bg:    "#FFF3E0",
    title: "Novedades v0.4.0",
    subtitle: "Solicitudes · Guía interactiva · Herramientas dev",
    items: [
      { label: "Solicitudes",                          detail: "Página completa con filtros por estado, gestión IT/admin, botón lateral flotante y drawer global con selector de pantalla agrupado por módulos" },
      { label: "Guía interactiva contextual",           detail: "Tour de 10 pasos por los módulos PDCA con tarjeta draggable, highlight del elemento objetivo, navegación por teclado y persistencia en localStorage" },
      { label: "Herramientas de desarrollo",             detail: "stop-dev.sh, modo backend-only en start-dev.sh, copy_config_from_prod y auto-carga de .env.local en database.py" },
    ],
  },
  {
    icon: "🏗️",
    color: "#00695C",
    bg:    "#E0F2F1",
    title: "Novedades v0.2.0",
    subtitle: "Estructura corporativa · Login local · Copia a producción",
    items: [
      { label: "Estructura Corporativa editable",      detail: "Árbol jerárquico con Grupo, Entidades Legales y Marcas. CRUD completo con modal de edición y confirmación de borrado" },
      { label: "Página de inicio de sesión local",     detail: "Login.jsx sustituye la redirección automática a SAML. Permite autenticarse con credenciales locales sin configurar el IdP" },
      { label: "Personalización UI dinámica",          detail: "El selector de empresa y marca en ADM·UI se carga desde la estructura corporativa en lugar de una lista hardcodeada" },
      { label: "copy_datos_to_prod.py + .sh",           detail: "Scripts para copiar datos de local a producción via Cloud SQL Proxy: corporate_entities, ui_brand_settings, role_permissions (excluye tablas de usuarios y audit_log)" },
      { label: "Fix race condition en AdmUI",          detail: "Patrón cancelled flag en useEffect evita que respuestas tardías sobreescriban el estado de una entidad más reciente" },
    ],
  },
  {
    icon: "🚀",
    color: COLORS.red,
    bg:    "#FFEBEE",
    title: "Novedades v0.3.0",
    subtitle: "Administración operativa · Roles · Audit · Buscador · Fixes multi-tenant",
    items: [
      { label: "Matriz de Roles conectada al backend",   detail: "AdmRoles carga desde GET /api/adm/role-permissions y guarda con PUT. Si la DB está vacía usa los permisos por defecto. Incluye la nueva pantalla Política de Calidad (v-pol, 30 pantallas en total)" },
      { label: "Registro de Actividad con datos reales", detail: "AdmLog sustituye los datos mock por llamadas reales a /api/adm/audit-log. Filtros por usuario, acción y rango de fechas. Exportación CSV para evidencias ISO 27001 (hasta 10 000 filas)" },
      { label: "Nuevos filtros en el endpoint de audit", detail: "GET /api/adm/audit-log acepta user_email (ilike), action (exacto), date_from y date_to. Límite ampliado a 2 000 registros. Nuevo endpoint GET /api/adm/audit-log/csv" },
      { label: "Buscador global de pantallas",           detail: "Input siempre visible en el TopBar (derecha, izquierda del usuario). Búsqueda en tiempo real sobre los 30 títulos de pantalla. Dropdown con navegación directa y ruta monospace. Escape y clic fuera para cerrar" },
      { label: "Botón SSO en login de producción",       detail: "ProdLogin muestra formulario email/contraseña + botón 'Acceder con OneLogin (SSO)' con icono de escudo. El DEV MODE sigue mostrando la lista de usuarios de prueba" },
      { label: "Fix campos legales en Estructura",       detail: "denominacion_social, domicilio_social y nif no se guardaban: faltaban en los constructores de create_corporate_entity y update_corporate_entity en crud.py" },
      { label: "Fix default_company_id incorrecto",      detail: "El admin creaba un usuario en el contexto GMS y el nuevo usuario recibía default_company_id='GMS' aunque solo tuviese permisos en GMP. Corregido en auth.py (validación contra tenants reales) y en AdmUsers (toApi y openEdit)" },
      { label: "Fix branding para usuarios de entidad",  detail: "get_ui_brand_settings añade fallback a (company_id, '') cuando no existe configuración específica de marca. Los usuarios con scope=entidad reciben ahora la personalización global de su empresa" },
      { label: "Fix usuarios de grupo visibles con filtro", detail: "La consulta get_user_access_list usaba AND exacto para company_id. Sustituido por OR jerárquico: grupo siempre ∪ entidad si coincide empresa ∪ marca si coincide empresa y marca" },
      { label: "Migración 009 — company_id nullable",    detail: "La columna user_tenants.company_id era NOT NULL, imposibilitando scope=grupo. La migración 009 la hace nullable y recrea el índice uq_ut_grupo sobre (user_id) en vez de (user_id, company_id) para evitar semántica NULL" },
    ],
  },
  {
    icon: "🛠️",
    color: "#555",
    bg:    "#F5F5F5",
    title: "Entorno de desarrollo",
    subtitle: "start-dev.sh · Docker · Vite",
    items: [
      { label: "start-dev.sh todo-en-uno",         detail: "Levanta PostgreSQL en Docker, aplica migraciones Alembic, ejecuta el seed de usuarios, arranca FastAPI (8000) y Vite (3001)" },
      { label: "Proxy Vite → FastAPI",             detail: "Todas las rutas /api y /auth se redirigen automáticamente al backend. Sin CORS en local" },
      { label: "Entorno virtual Python aislado",   detail: "src/.venv creado automáticamente. No interfiere con el Python del sistema" },
      { label: "Quarantine fix macOS",             detail: "xattr -rd sobre node_modules para evitar bloqueos en binarios nativos de Rollup en macOS" },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const Tag = ({ label, bg, color }) => (
  <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, background: bg, color, fontFamily: H, border: `1px solid ${color}22` }}>
    {label}
  </span>
);

// ── Component ─────────────────────────────────────────────────────────────────
export default function Novedades() {
  return (
    <div style={{ maxWidth: 900 }}>
      {/* Hero */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "28px 32px", marginBottom: 24, borderLeft: `4px solid ${COLORS.red}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>v{RELEASE.version}</span>
              <Tag label="ACTUAL" bg={COLORS.red} color="#fff" />
              <Tag label="Estable" bg="#E8F5E9" color="#2E7D32" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.gray, fontFamily: H, marginBottom: 10 }}>
              {RELEASE.title}
            </div>
            <p style={{ fontSize: 13, color: COLORS.grayLight, fontFamily: B, lineHeight: 1.7, maxWidth: 680 }}>
              {RELEASE.summary}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: COLORS.grayLight, fontFamily: B }}>{RELEASE.date}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {["Puestos por entidad", "Organigrama", "Zona horaria", "Departamentos", "SVG lines", "Migraciones 015-016"].map(t => (
                <Tag key={t} label={t} bg="#F5F5F5" color={COLORS.grayLight} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {SECTIONS.map(sec => (
          <div key={sec.title} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
            {/* Section header */}
            <div style={{ padding: "14px 24px", borderBottom: `1px solid ${COLORS.border}`, background: sec.bg, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18 }}>{sec.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: sec.color, fontFamily: H }}>{sec.title}</div>
                <div style={{ fontSize: 11, color: sec.color, fontFamily: B, opacity: 0.8 }}>{sec.subtitle}</div>
              </div>
            </div>

            {/* Items */}
            <div style={{ padding: "8px 0" }}>
              {sec.items.map((item, i) => (
                <div key={i} style={{ display: "flex", padding: "10px 24px", borderBottom: i < sec.items.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: sec.color, flexShrink: 0, marginTop: 6, marginRight: 12 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray, fontFamily: H, marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: COLORS.grayLight, fontFamily: B, lineHeight: 1.6 }}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 24, padding: "14px 20px", background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 8, fontSize: 12, color: "#92400E", fontFamily: B }}>
        <strong>Próximas versiones:</strong> implementación de contenido real en pantallas pendientes (RSG, OPE, TAL, SOP, MEJ), conexión de Solicitudes al backend con persistencia, configuración del IdP OneLogin para SSO SAML 2.0, notificaciones y alertas en tiempo real.
      </div>
    </div>
  );
}
