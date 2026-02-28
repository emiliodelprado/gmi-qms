Arquitectura del Sistema QMS: Global Manager Iberia (GMI)

Entidad Superior: Global Manager Iberia
Empresas: Global Manager Spain (GMS), Global Manager Portugal (GMP)
Tecnología de Implementación: Node.js / Autenticación Híbrida (SSO + On-premise) / Estructura Multi-marca

1. Configuración de Acceso y Entorno

Autenticación Híbrida: El sistema admite dos métodos de acceso concurrentes:

Externo (SSO/SAML): Integración con OneLogin para gestión centralizada de identidades.

Local (On-premise): Sistema de credenciales internas almacenadas en la base de datos del QMS, utilizado como respaldo (failover) o para usuarios sin cuenta en el proveedor de identidad corporativo.

Contexto de Empresa: Selector global en la cabecera (Header) para alternar entre "Global Manager Spain" e "Global Manager Portugal".

Contexto de Marca: Filtro secundario para segmentar por marcas de negocio (EPUNTO, LIQUID, THE LIQUID FINANCE).

Navegación Home: Al pulsar sobre el logotipo de la entidad (arriba a la izquierda), el sistema redirigirá siempre a la Pantalla de Inicio (V-HOME).

2. Pantalla Principal / Landing de Módulos (HOME)

Esta pantalla es el punto de entrada tras el login y sirve como centro de mando global.

Nivel 1: HOME | INICIO

Contenido Visual: Una cuadrícula (grid) de tarjetas interactivas. Cada tarjeta representa un módulo de Nivel 1.

Detalle de Tarjetas por Módulo:

ESTRATEGIA: "Gestión del contexto y liderazgo". KPIs: % Objetivos cumplidos, Nº de riesgos estratégicos.

RIESGOS: "Evaluación y tratamiento de riesgos ISO 9001/27001". KPIs: Riesgos críticos activos, % de mitigación.

OPERACIONES: "Control comercial y ejecución de proyectos". KPIs: Ventas acumuladas año, Proyectos activos.

TALENTO: "Ciclo de vida del colaborador y formación". KPIs: % Plan de formación ejecutado, Empleados activos.

SOPORTE: "Documentación, proveedores y recursos". KPIs: Documentos vigentes, % Proveedores homologados.

MEJORA: "No conformidades y auditorías". KPIs: NC abiertas, Auditorías anuales completadas.

ADMINISTRACIÓN: "Configuración y gobernanza del sistema". KPIs: Usuarios logueados hoy, Estado del SSO.

3. Estructura de Menú (3 Niveles)

NIVEL 1: MÓDULO | ESTRATEGIA (EST)

Nombre Largo: Estrategia, Liderazgo y Contexto del Sistema

Nivel 2: Función | Dashboard (DASH)

Nivel 3: Pantalla | Vista Ejecutiva (V-EXE)

Contenido Visual: Cuadro de mando con widgets tipo "bento box". Debe incluir gráficos de velocímetro para ventas anuales acumuladas, indicadores numéricos de No Conformidades abiertas y semáforos de cumplimiento de objetivos estratégicos.

Nivel 3: Pantalla | Estado de Objetivos (V-OBJ)

Contenido Visual: Listado de objetivos anuales (según R-ES02-01) con barras de progreso lineales que cambian de color (rojo/ámbar/verde) según el porcentaje de cumplimiento alcanzado.

Nivel 2: Función | Contexto (CONT)

Nivel 3: Pantalla | Matriz DAFO/CAME (V-DAFO)

Contenido Visual: Cuadrante interactivo. Al hacer clic sobre cualquier "Debilidad" o "Amenaza", el sistema debe desplegar un modal para vincular una acción de mitigación inmediata.

Nivel 3: Pantalla | Organigrama (V-ORG)

Contenido Visual: Diagrama jerárquico dinámico que muestra la estructura de Global Manager Iberia. Debe permitir filtrar por empresa y marca, mostrando las dependencias funcionales entre dirección, responsables y colaboradores.

Nivel 3: Pantalla | Listado de Procesos (V-PROC)

Contenido Visual: Mapa de procesos interactivo dividido en Procesos Estratégicos, Operativos y de Soporte. Cada nodo del mapa permite acceder directamente al procedimiento o ficha de proceso correspondiente.

Nivel 3: Pantalla | Partes Interesadas (V-PART)

Contenido Visual: Tabla detallada de grupos de interés (Clientes, Empleados, Socios) con columnas para Requisitos clave, Nivel de Influencia (Bajo/Medio/Alto) y Prioridad de atención.

NIVEL 1: MÓDULO | RIESGOS (RSG)

Nombre Largo: Gestión de Riesgos y Oportunidades

Nivel 2: Función | Evaluación (EVAR)

Nivel 3: Pantalla | Calculadora de Riesgos (V-CALC)

Contenido Visual: Interfaz tipo asistente (wizard) basada en la IT-ES03-01. Deslizadores (sliders) para Probabilidad (1-4) e Impacto (1-4). Muestra un mapa de calor dinámico que resalta la zona de riesgo (Crítico, Alto, Medio, Bajo).

Nivel 2: Función | Mapa de Riesgos (MAP)

Nivel 3: Pantalla | Mapa ISO 9001 (V-MAP9)

Contenido Visual: Heatmap consolidado de riesgos de gestión/calidad. Representación visual de los riesgos identificados en los procesos según su severidad residual.

Nivel 3: Pantalla | Mapa ISO 27001 (V-MAP27)

Contenido Visual: Mapa de riesgos de seguridad de la información. Visualización basada en activos, amenazas y vulnerabilidades, permitiendo identificar puntos críticos de seguridad lógica y física.

Nivel 2: Función | Tratamiento (TRAT)

Nivel 3: Pantalla | Plan de Acciones (V-PLAN)

Contenido Visual: Tablero tipo Kanban para el seguimiento de acciones de mitigación. Columnas: "Identificado", "En Tratamiento", "Eficacia Pendiente de Verificar" y "Cerrado".

NIVEL 1: MÓDULO | OPERACIONES (OPE)

Nombre Largo: Procesos de Negocio y Ciclo de Venta

Nivel 2: Función | Comercial (COM)

Nivel 3: Pantalla | Master de Ofertas (V-OFT)

Contenido Visual: Listado de ofertas con buscador avanzado y filtros por marca. Formulario de creación con campo de código bloqueado que autogenera la cadena OAAAAMMDD_NombreCliente (según PR-OPE03).

Nivel 2: Función | Proyectos (PRJ)

Nivel 3: Pantalla | Seguimiento de Entregables (V-ENT)

Contenido Visual: Línea de tiempo (Timeline) con hitos clave. Iconografías diferenciadas para proyectos de Interim Management y servicios tecnológicos.

NIVEL 1: MÓDULO | TALENTO (TAL)

Nombre Largo: Gestión del Capital Humano y Competencia

Nivel 2: Función | Empleados (EMP)

Nivel 3: Pantalla | Ficha Colaborador (V-PERF)

Contenido Visual: Perfil de usuario con avatar, datos maestros, tipo de contrato (Estructura/Proyecto) y un repositorio de diplomas o certificados de formación en calidad.

Nivel 2: Función | Formación (FOR)

Nivel 3: Pantalla | Gestión de Formación (V-FOR)

Contenido Visual: Listado de acciones formativas con campos para: Fecha, Título, Colaborador asistente y Estado (Planificada/Realizada). Incluye un área de carga para evidencias de formación y registro de la evaluación de eficacia.

Nivel 2: Función | Onboarding (ONB)

Nivel 3: Pantalla | Checklist de Bienvenida (V-CHCK)

Contenido Visual: Checklist secuencial de tareas de incorporación con estados de completado (visto) y enlaces a documentos de bienvenida.

NIVEL 1: MÓDULO | SOPORTE (SOP)

Nombre Largo: Apoyo, Documentación e Infraestructura

Nivel 2: Función | Documentos (DOC)

Nivel 3: Pantalla | Listado Maestro (V-MAES)

Contenido Visual: Explorador de archivos con filtros por proceso, control de versiones y badges de vigencia (Vigente/Obsoleto).

Nivel 2: Función | Proveedores (PROV)

Nivel 3: Pantalla | Homologación y Evaluación (V-PROV)

Contenido Visual: Tabla de proveedores críticos con "Badges" de estado (Homologado, Pendiente, Rechazado). Incluye fechas de evaluación y gestión de certificados cargados.

Nivel 2: Función | Activos de Información (ACT)

Nivel 3: Pantalla | Inventario de Activos Digitales (V-DIG)

Contenido Visual: Tabla detallada CID (Confidencialidad, Integridad, Disponibilidad) para ISO 27001 con propietarios y clasificación de seguridad.

Nivel 2: Función | Equipamiento (EQU)

Nivel 3: Pantalla | Gestión de Equipamiento (V-EQU)

Contenido Visual: Cards de activos físicos (IT, instalaciones, etc.) con indicadores de color para mantenimientos preventivos y garantías.

NIVEL 1: MÓDULO | MEJORA (MEJ)

Nombre Largo: Evaluación del Desempeño y Mejora Continua

Nivel 2: Función | Auditorías (AUD)

Nivel 3: Pantalla | Planificación de Auditorías (V-AUD)

Contenido Visual: Calendario anual interactivo de auditorías. Fichas para cada auditoría que incluyen: Fecha prevista, Alcance (procesos), Auditor asignado y estado del Informe Final.

Nivel 2: Función | No Conformidades (NC)

Nivel 3: Pantalla | Gestión de NC (V-NC)

Contenido Visual: Formulario de 3 secciones: 1. Detección y evidencia, 2. Análisis de Causa Raíz (Ishikawa interactivo), 3. Plan de Acción y Cierre.

Nivel 2: Función | Ética (ETI)

Nivel 3: Pantalla | Canal de Denuncias (V-CANAL)

Contenido Visual: Interfaz ultra-minimalista, segura y anónima con chat encriptado para seguimiento de la investigación.

NIVEL 1: MÓDULO | ADMINISTRACIÓN (ADM)

Nombre Largo: Configuración del Sistema y Gobernanza Global

Nivel 2: Función | Organización (ORG-ADM)

Nivel 3: Pantalla | Estructura Corporativa (V-ESTR)

Contenido Visual: Árbol jerárquico editable: Grupo GMI -> Entidades (GMS/GMP) -> Marcas.

Nivel 2: Función | Configuración de Procesos (PROC-ADM)

Nivel 3: Pantalla | Editor de Procesos (V-EDPROC)

Contenido Visual: Matriz de asignación dinámica de procesos estratégicos, operativos y de soporte por entidad legal y marca.

Nivel 2: Función | Control de Acceso (ACC)

Nivel 3: Pantalla | Gestión de Usuarios On-premise (V-USER)

Contenido Visual: Listado de usuarios con buscador y formulario de creación/edición (Nombre, Email, Rol, Estado).

Nivel 3: Pantalla | Matriz de Roles y Permisos (V-ROLES)

Contenido Visual: Matriz interactiva de Roles vs Pantallas con selectores de permisos de Lectura/Escritura.

Nivel 3: Pantalla | Registro de Actividad (V-LOG)

Contenido Visual: Tabla Audit Trail cronológica con filtros avanzados por usuario, acción, IP y rangos de fecha.

Nivel 2: Función | Seguridad (SEC)

Nivel 3: Pantalla | Métodos de Autenticación (V-AUTH)

Contenido Visual: Panel con switch para habilitar SSO (SAML) y gestión de parámetros técnicos de conexión con OneLogin.

Nivel 2: Función | Apariencia (UI)

Nivel 3: Pantalla | Personalización de Interfaz (V-UI)

Contenido Visual: Editor visual de colores, logos, favicons e imágenes de fondo segmentadas por marca y entidad legal.

4. Especificaciones Técnicas para Node.js

Enrutamiento: URLs jerárquicas /modulo/function/pantalla. La ruta / o /home cargará la Pantalla de Inicio.

Estrategia de Autenticación (Passport.js):

SAMLStrategy para OneLogin.

LocalStrategy con encriptación BCrypt/Argon2 para el acceso on-premise.

Multitenencia: Filtrado estricto por company_id y brand_id.

Seguridad de Datos: Encriptación de registros críticos mediante AES-256 (Ref: PR-SOP07).