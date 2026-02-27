Arquitectura del Sistema QMS: Global Manager Iberia (GMI)

Entidad Superior: Global Manager Iberia
Empresas: Global Manager Spain (GMS), Global Manager Portugal (GMP)
Tecnología de Implementación: Node.js / Autenticación OneLogin (SSO) / Estructura Multi-marca

1. Configuración de Acceso y Entorno

Autenticación: Integración externa mediante OneLogin. La sesión del usuario y sus permisos de acceso se gestionan desde el proveedor de identidad.

Contexto de Empresa: Selector global en la cabecera (Header) para alternar entre "Global Manager Spain" e "Global Manager Portugal".

Contexto de Marca: Filtro secundario para segmentar por marcas de negocio (EPUNTO, LIQUID, THE LIQUID FINANCE).

2. Estructura de Menú (3 Niveles)

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

Nivel 3: Pantalla | Partes Interesadas (V-PART)

Contenido Visual: Tabla detallada de grupos de interés (Clientes, Empleados, Socios) con columnas para Requisitos clave, Nivel de Influencia (Bajo/Medio/Alto) y Prioridad de atención.

NIVEL 1: MÓDULO | RIESGOS (RSG)

Nombre Largo: Gestión de Riesgos y Oportunidades

Nivel 2: Función | Evaluación (EVAR)

Nivel 3: Pantalla | Calculadora de Riesgos (V-CALC)

Contenido Visual: Interfaz tipo asistente (wizard) basada en la IT-ES03-01. Deslizadores (sliders) para Probabilidad (1-4) e Impacto (1-4). Muestra un mapa de calor dinámico que resalta la zona de riesgo (Crítico, Alto, Medio, Bajo).

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

Contenido Visual: Línea de tiempo (Timeline) con hitos clave. Iconos diferenciados para proyectos de Interim Management y servicios tecnológicos (Liquid).

NIVEL 1: MÓDULO | TALENTO (TAL)

Nombre Largo: Gestión del Capital Humano y Competencia

Nivel 2: Función | Empleados (EMP)

Nivel 3: Pantalla | Ficha Colaborador (V-PERF)

Contenido Visual: Perfil de usuario con avatar, datos maestros, tipo de contrato (Estructura/Proyecto) y un repositorio de diplomas o certificados de formación en calidad.

Nivel 2: Función | Onboarding (ONB)

Nivel 3: Pantalla | Checklist de Bienvenida (V-CHCK)

Contenido Visual: Lista de tareas secuenciales para nuevas incorporaciones (lectura de política, firma de ética de GMI, asignación de equipos IT).

NIVEL 1: MÓDULO | SOPORTE (SOP)

Nombre Largo: Apoyo, Documentación e Infraestructura

Nivel 2: Función | Documentos (DOC)

Nivel 3: Pantalla | Listado Maestro (V-MAES)

Contenido Visual: Explorador de archivos organizado por procesos (Estratégicos, Operativos, Soporte). Etiquetas resaltadas para indicar la "Versión Vigente" y acceso al histórico de revisiones.

Nivel 2: Función | Infraestructura (INF)

Nivel 3: Pantalla | Inventario IT (V-INV)

Contenido Visual: Galería de tarjetas (cards) representando los activos IT. Alertas de color para mantenimientos preventivos pendientes o equipos que requieren renovación.

NIVEL 1: MÓDULO | MEJORA (MEJ)

Nombre Largo: Evaluación del Desempeño y Mejora Continua

Nivel 2: Función | No Conformidades (NC)

Nivel 3: Pantalla | Gestión de NC (V-NC)

Contenido Visual: Formulario de tres secciones: 1. Descripción y evidencia (carga de archivos), 2. Análisis de Causa Raíz (Diagrama Ishikawa sugerido), 3. Plan de Acción y Verificación.

Nivel 2: Función | Ética (ETI)

Nivel 3: Pantalla | Canal de Denuncias (V-CANAL)

Contenido Visual: Interfaz ultra-minimalista. Garantía visual de anonimato, formulario encriptado y acceso mediante código único para seguimiento de casos.

3. Especificaciones Técnicas para Node.js

Enrutamiento: Las URLs de la aplicación deben seguir el esquema jerárquico: /modulo/funcion/pantalla utilizando los códigos cortos (ejemplo: /est/dash/v-exe).

Multitenencia: La lógica de backend debe filtrar todas las consultas a la base de datos mediante el company_id (GMS o GMP) seleccionado en la sesión.

Seguridad: Integración con el middleware de OneLogin para asegurar que solo usuarios autenticados accedan a las funciones del SGC.

Fuentes de Verdad:

Manual de Calidad de Global Manager Iberia.

PR-SOP07: Gestión de Información Documentada.

IT-ES03-01: Metodología de Evaluación de Riesgos.