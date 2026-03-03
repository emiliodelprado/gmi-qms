import { useState, useEffect, useCallback, useRef } from "react";
import { COLORS, H, B, Icon } from "../constants.jsx";

// ── Phase badge colours ──────────────────────────────────────────────────────
const PHASE_COLORS = {
  header: { bg: "#E3F2FD", color: "#1565C0", label: "Cabecera" },
  plan:   { bg: "#FFF3E0", color: "#E65100",  label: "Fase 1 · PLAN" },
  do:     { bg: "#E8F5E9", color: "#2E7D32",  label: "Fase 2 · DO" },
  check:  { bg: "#F3E5F5", color: "#6A1B9A",  label: "Fase 3 · CHECK" },
  act:    { bg: "#ECEFF1", color: "#424242",   label: "Fase 4 · ACT" },
};

// ── Tour steps ───────────────────────────────────────────────────────────────
export const TOUR_STEPS = [
  // A. Cabecera y Control de Entorno
  {
    target: "logo", phase: "header",
    title: "Logotipo GMI",
    desc: "Al pulsar el logo volverás siempre a la pantalla de inicio.",
  },
  {
    target: "company-select", phase: "header",
    title: "Selector de Empresa",
    desc: "Permite alternar la visualización de datos entre Global Manager Spain (GMS) y Global Manager Portugal (GMP).",
  },
  {
    target: "brand-select", phase: "header",
    title: "Filtro de Marca",
    desc: "Segmenta la información según la unidad de negocio: EPUNTO, LIQUID o THE LIQUID FINANCE.",
  },
  // B. Fase 1: PLAN
  {
    target: "mod-est", phase: "plan",
    title: "ESTRATEGIA (EST)",
    desc: "Gestión del contexto de la organización y ejercicio del liderazgo.",
    phaseIntro: "Esta fase se centra en establecer los objetivos y procesos necesarios para conseguir resultados de acuerdo con los requisitos del cliente y las políticas de la organización.",
  },
  {
    target: "mod-rsg", phase: "plan",
    title: "RIESGOS (RSG)",
    desc: "Evaluación y tratamiento de riesgos bajo las normas ISO 9001 e ISO 27001.",
  },
  // C. Fase 2: DO
  {
    target: "mod-ope", phase: "do",
    title: "OPERACIONES (OPE)",
    desc: "Control del ciclo comercial y ejecución técnica de los proyectos de negocio.",
    phaseIntro: "Representa la ejecución de los procesos operativos y el soporte necesario para el funcionamiento del sistema de gestión.",
  },
  {
    target: "mod-tal", phase: "do",
    title: "TALENTO (TAL)",
    desc: "Gestión del capital humano, competencia y planes de formación.",
  },
  {
    target: "mod-sop", phase: "do",
    title: "SOPORTE (SOP)",
    desc: "Gestión de la infraestructura, documentación, proveedores y recursos de información.",
  },
  // D. Fase 3: CHECK
  {
    target: "mod-mej", phase: "check",
    title: "MEJORA (MEJ)",
    desc: "Gestión de auditorías y evaluación del desempeño mediante el control de desviaciones.",
    phaseIntro: "Módulo destinado al seguimiento y la medición de los procesos respecto a las políticas y objetivos.",
  },
  // E. Fase 4: ACT
  {
    target: "mod-adm", phase: "act",
    title: "ADMINISTRACIÓN (ADM)",
    desc: "Configuración global, gobernanza del sistema y control de accesos.",
    phaseIntro: "Gobernanza y ajustes necesarios para mejorar continuamente el desempeño de los procesos.",
  },
];

// ── Highlight ring style injected on target element ─────────────────────────
const HIGHLIGHT_CLASS = "guided-tour-highlight";
const HIGHLIGHT_STYLE_ID = "guided-tour-style";

function ensureHighlightStyle() {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      outline: 3px solid #A91E22 !important;
      outline-offset: 4px !important;
      border-radius: 8px;
      transition: outline 0.2s;
    }
  `;
  document.head.appendChild(style);
}

function removeHighlightStyle() {
  const el = document.getElementById(HIGHLIGHT_STYLE_ID);
  if (el) el.remove();
}

// ── Component ────────────────────────────────────────────────────────────────
export default function GuidedTour({ onClose }) {
  const [step, setStep] = useState(0);
  const [dragOffset, setDragOffset] = useState(null);
  const [pos, setPos] = useState(null); // { x, y } when dragged
  const [targetRect, setTargetRect] = useState(null);
  const dragging = useRef(false);
  const cardRef = useRef(null);

  const current = TOUR_STEPS[step];
  const phase   = PHASE_COLORS[current.phase];
  const isFirst = step === 0;
  const isLast  = step === TOUR_STEPS.length - 1;

  // ── Measure & highlight target element ────────────────────────────────────
  const measure = useCallback(() => {
    const el = document.querySelector(`[data-tour="${current.target}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
  }, [current.target]);

  useEffect(() => {
    ensureHighlightStyle();
    const el = document.querySelector(`[data-tour="${current.target}"]`);
    if (el) {
      el.classList.add(HIGHLIGHT_CLASS);
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    const t = setTimeout(measure, 80);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      if (el) el.classList.remove(HIGHLIGHT_CLASS);
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [current.target, measure]);

  // Reset drag position when step changes
  useEffect(() => { setPos(null); }, [step]);

  // Cleanup highlight style on unmount
  useEffect(() => () => removeHighlightStyle(), []);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && !isLast) setStep(s => s + 1);
      if (e.key === "ArrowLeft" && !isFirst) setStep(s => s - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFirst, isLast, onClose]);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    // Only drag from the header area of the card (not buttons)
    if (e.target.tagName === "BUTTON") return;
    dragging.current = true;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!dragOffset) return;

    const onMove = (e) => {
      if (!dragging.current) return;
      setPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    };
    const onUp = () => { dragging.current = false; };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragOffset]);

  // ── Overlay spotlight geometry ────────────────────────────────────────────
  const spotPad = 10;
  const spot = targetRect ? {
    top:    targetRect.top - spotPad,
    left:   targetRect.left - spotPad,
    width:  targetRect.width + spotPad * 2,
    height: targetRect.height + spotPad * 2,
  } : null;

  // ── Default position: centered in header area ─────────────────────────────
  const defaultStyle = pos
    ? { position: "fixed", left: pos.x, top: pos.y }
    : { position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)" };

  return (
    <>
      {/* Soft dark overlay with spotlight cutout */}
      {spot && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }}>
          {/* Top */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: Math.max(0, spot.top), background: "rgba(0,0,0,0.25)" }} />
          {/* Bottom */}
          <div style={{ position: "absolute", top: spot.top + spot.height, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.25)" }} />
          {/* Left */}
          <div style={{ position: "absolute", top: spot.top, left: 0, width: Math.max(0, spot.left), height: spot.height, background: "rgba(0,0,0,0.25)" }} />
          {/* Right */}
          <div style={{ position: "absolute", top: spot.top, left: spot.left + spot.width, right: 0, height: spot.height, background: "rgba(0,0,0,0.25)" }} />
          {/* Spotlight border */}
          <div style={{
            position: "absolute", top: spot.top, left: spot.left, width: spot.width, height: spot.height,
            borderRadius: 10, border: "2px solid rgba(255,255,255,0.5)",
          }} />
        </div>
      )}

      {/* Draggable tooltip card */}
      <div
        ref={cardRef}
        onPointerDown={onPointerDown}
        style={{
          ...defaultStyle,
          width: 420, maxWidth: "calc(100vw - 32px)",
          background: COLORS.white, borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          overflow: "hidden",
          zIndex: 10000,
          cursor: dragging.current ? "grabbing" : "grab",
          userSelect: "none",
          touchAction: "none",
        }}
      >
      {/* Drag hint bar */}
      <div style={{
        height: 5, display: "flex", justifyContent: "center", alignItems: "center",
        background: phase.bg, cursor: "grab",
      }}>
        <div style={{
          width: 36, height: 3, borderRadius: 2, background: phase.color, opacity: 0.35,
        }} />
      </div>

      {/* Header: progress dots + nav buttons */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", borderBottom: `1px solid ${COLORS.border}`, background: "#FAFAFA",
      }}>
        {/* Step progress dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 16 : 6, height: 6, borderRadius: 3,
              background: i === step ? PHASE_COLORS[TOUR_STEPS[i].phase].color : "#DDD",
              transition: "all 0.2s",
            }} />
          ))}
          <span style={{ fontSize: 10, color: COLORS.grayLight, fontFamily: B, marginLeft: 6 }}>
            {step + 1}/{TOUR_STEPS.length}
          </span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {/* Skip */}
          <button onClick={onClose} style={{
            padding: "5px 12px", border: "none", borderRadius: 6, background: "transparent",
            color: COLORS.grayLight, cursor: "pointer", fontSize: 12, fontFamily: B,
          }}>Omitir</button>

          {/* Previous */}
          {!isFirst && (
            <button onClick={() => setStep(s => s - 1)} style={{
              padding: "5px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 6,
              background: COLORS.white, color: COLORS.gray, cursor: "pointer",
              fontSize: 12, fontWeight: 700, fontFamily: H,
            }}>Anterior</button>
          )}

          {/* Next / Finish */}
          <button onClick={isLast ? onClose : () => setStep(s => s + 1)} style={{
            padding: "5px 14px", border: "none", borderRadius: 6,
            background: COLORS.red, color: "#fff", cursor: "pointer",
            fontSize: 12, fontWeight: 800, fontFamily: H,
          }}>
            {isLast ? "Finalizar" : "Siguiente"}
          </button>
        </div>
      </div>

      {/* Phase intro banner (only on first step of each phase) */}
      {current.phaseIntro && (
        <div style={{ background: phase.bg, padding: "12px 20px", borderBottom: `1px solid ${phase.color}22` }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: phase.color, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: H, marginBottom: 4 }}>
            {phase.label}
          </div>
          <div style={{ fontSize: 12, color: COLORS.gray, fontFamily: B, lineHeight: 1.5 }}>
            {current.phaseIntro}
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ padding: "14px 20px 16px" }}>
        {/* Phase badge (when no intro banner) */}
        {!current.phaseIntro && (
          <span style={{
            display: "inline-block", padding: "2px 10px", borderRadius: 20, marginBottom: 8,
            background: phase.bg, color: phase.color, fontSize: 10, fontWeight: 800, fontFamily: H,
          }}>
            {phase.label}
          </span>
        )}

        <h3 style={{ margin: current.phaseIntro ? 0 : "0 0 6px", fontSize: 15, fontWeight: 800, color: COLORS.gray, fontFamily: H }}>
          {current.title}
        </h3>
        <p style={{ fontSize: 13, color: COLORS.grayLight, fontFamily: B, lineHeight: 1.6, margin: "8px 0 0" }}>
          {current.desc}
        </p>
      </div>
    </div>
    </>
  );
}
