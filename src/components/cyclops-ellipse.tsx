"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

// ─── CYCLOPS Ellipse Intuition ──────────────────────────────────────────────
//
// Demonstrates how two oscillating genes, when plotted against each other,
// form an ellipse that reveals hidden circadian time (phase) without timestamps.
//
// Step 1 — Two genes oscillating over 24h, offset in phase
// Step 2 — Gene A vs Gene B → ellipse emerges
// Step 3 — Position on ellipse = circadian phase → order recovered

const N = 24;
const times = Array.from({ length: N }, (_, i) => i);
const geneA = times.map((t) => Math.cos((2 * Math.PI * t) / 24));
const geneB = times.map((t) => Math.sin((2 * Math.PI * t) / 24));
const hours = [
  "12a", "1", "2", "3", "4", "5", "6a", "7", "8", "9", "10", "11",
  "12p", "1", "2", "3", "4", "5", "6p", "7", "8", "9", "10", "11",
];

// Site-matched palette
const COL = {
  geneA: "#60a5ff",
  geneB: "#db7093",
  dot: "#5dcaa5",
  ellipse: "rgba(93,202,165,0.25)",
  highlight: "#EF9F27",
  axis: "var(--site-text-dim)",
  textP: "var(--site-text)",
  textS: "var(--site-text-muted)",
};

const CAPTIONS = [
  "Each gene rises and falls with a 24-hour rhythm, but they peak at different times. Gene A peaks around noon; Gene B peaks around 6 PM.",
  "Forget about time. Plot each sample's Gene A value (x) against Gene B (y). Because they oscillate at the same frequency but are offset, points fall on an ellipse.",
  "Position on the ellipse reveals place in the 24-hour cycle. CYCLOPS uses a neural network to find this ellipse across thousands of noisy genes, recovering the clock without timestamps.",
];

const STEP_LABELS = [
  "Two genes over time",
  "Plot against each other",
  "The ellipse reveals order",
];

// ─── SVG helpers ─────────────────────────────────────────────────────────────

function Step0({ w, h }: { w: number; h: number }) {
  const gW = w - 100;
  const gH = h - 60;
  const ox = 50;
  const oy = 20;
  const xScale = (t: number) => (t / 23) * gW + ox;
  const yScale = (v: number) => (-v * 0.45 + 0.5) * gH + oy;

  const pathA = times.map((t) => `${t === 0 ? "M" : "L"}${xScale(t).toFixed(1)} ${yScale(geneA[t]).toFixed(1)}`).join(" ");
  const pathB = times.map((t) => `${t === 0 ? "M" : "L"}${xScale(t).toFixed(1)} ${yScale(geneB[t]).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}>
      {/* Axis */}
      <line x1={ox} y1={yScale(0)} x2={ox + gW} y2={yScale(0)} stroke={COL.axis} strokeWidth="0.5" />
      <line x1={ox} y1={oy} x2={ox} y2={oy + gH} stroke={COL.axis} strokeWidth="0.5" />
      {/* Tick labels */}
      {[0, 6, 12, 18].map((t) => (
        <g key={t}>
          <line x1={xScale(t)} y1={yScale(0) - 3} x2={xScale(t)} y2={yScale(0) + 3} stroke={COL.axis} strokeWidth="0.5" />
          <text x={xScale(t)} y={yScale(0) + 16} textAnchor="middle" fontSize="10" fill={COL.textS} fontFamily="var(--font-mono)">
            {hours[t]}
          </text>
        </g>
      ))}
      <text x={ox + gW / 2} y={oy + gH + 36} textAnchor="middle" fontSize="10" fill={COL.textS} fontFamily="var(--font-mono)">
        time of day
      </text>
      <text x={ox - 6} y={oy + 10} textAnchor="end" fontSize="9" fill={COL.textS} fontFamily="var(--font-mono)">
        high
      </text>
      <text x={ox - 6} y={oy + gH - 4} textAnchor="end" fontSize="9" fill={COL.textS} fontFamily="var(--font-mono)">
        low
      </text>
      {/* Gene A */}
      <motion.path
        d={pathA}
        fill="none"
        stroke={COL.geneA}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      {/* Gene B */}
      <motion.path
        d={pathB}
        fill="none"
        stroke={COL.geneB}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="6 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
      />
      {/* Legend */}
      <circle cx={ox + gW - 120} cy={oy + 12} r="4" fill={COL.geneA} />
      <text x={ox + gW - 112} y={oy + 16} fontSize="10" fill={COL.textP} fontFamily="var(--font-mono)">
        Gene A (peaks noon)
      </text>
      <circle cx={ox + gW - 120} cy={oy + 30} r="4" fill={COL.geneB} />
      <text x={ox + gW - 112} y={oy + 34} fontSize="10" fill={COL.textP} fontFamily="var(--font-mono)">
        Gene B (peaks 6pm)
      </text>
    </svg>
  );
}

function Step1({ w, h }: { w: number; h: number }) {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w * 0.32;
  const ry = h * 0.38;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}>
      {/* Axes */}
      <line x1={cx - rx - 30} y1={cy} x2={cx + rx + 30} y2={cy} stroke={COL.axis} strokeWidth="0.5" />
      <line x1={cx} y1={cy + ry + 30} x2={cx} y2={cy - ry - 30} stroke={COL.axis} strokeWidth="0.5" />
      <text x={cx + rx + 35} y={cy + 4} fontSize="10" fill={COL.geneA} fontFamily="var(--font-mono)" fontWeight="500">
        Gene A →
      </text>
      <text x={cx + 4} y={cy - ry - 35} fontSize="10" fill={COL.geneB} fontFamily="var(--font-mono)" fontWeight="500">
        ↑ Gene B
      </text>
      {/* Ellipse */}
      <motion.ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={COL.ellipse}
        stroke={COL.dot}
        strokeWidth="1.5"
        strokeDasharray="4 3"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      {/* Dots */}
      {times.map((t) => {
        const x = cx + geneA[t] * rx;
        const y = cy - geneB[t] * ry;
        return (
          <motion.circle
            key={t}
            cx={x}
            cy={y}
            r="4.5"
            fill={COL.dot}
            opacity="0.85"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 + t * 0.04 }}
          />
        );
      })}
      {/* Phase labels */}
      <text x={cx + rx + 6} y={cy - 6} fontSize="10" fill={COL.highlight} fontFamily="var(--font-mono)" fontWeight="500">noon</text>
      <text x={cx - rx - 30} y={cy - 6} fontSize="10" fill={COL.highlight} fontFamily="var(--font-mono)" fontWeight="500">midnight</text>
      <text x={cx + 4} y={cy - ry - 8} fontSize="10" fill={COL.highlight} fontFamily="var(--font-mono)" fontWeight="500">6 PM</text>
      <text x={cx + 4} y={cy + ry + 16} fontSize="10" fill={COL.highlight} fontFamily="var(--font-mono)" fontWeight="500">6 AM</text>
    </svg>
  );
}

function Step2({ w, h }: { w: number; h: number }) {
  const cx = w / 2;
  const cy = h / 2 - 10;
  const rx = w * 0.32;
  const ry = h * 0.34;

  // Color gradient: warm (early) → cool (late)
  const dotColor = (t: number) => {
    const frac = t / 24;
    const r = Math.round(220 * (1 - frac) + 30 * frac);
    const g = Math.round(100 * (1 - frac) + 60 * frac);
    const b = Math.round(50 * (1 - frac) + 200 * frac);
    return `rgb(${r},${g},${b})`;
  };

  // Connecting lines
  const lines = times.map((t, i) => {
    const next = (i + 1) % N;
    return {
      x1: cx + geneA[t] * rx,
      y1: cy - geneB[t] * ry,
      x2: cx + geneA[next] * rx,
      y2: cy - geneB[next] * ry,
    };
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}>
      {/* Axes */}
      <line x1={cx - rx - 30} y1={cy} x2={cx + rx + 30} y2={cy} stroke={COL.axis} strokeWidth="0.5" />
      <line x1={cx} y1={cy + ry + 30} x2={cx} y2={cy - ry - 30} stroke={COL.axis} strokeWidth="0.5" />
      <text x={cx + rx + 35} y={cy + 4} fontSize="10" fill={COL.geneA} fontFamily="var(--font-mono)" fontWeight="500">
        Gene A →
      </text>
      <text x={cx + 4} y={cy - ry - 35} fontSize="10" fill={COL.geneB} fontFamily="var(--font-mono)" fontWeight="500">
        ↑ Gene B
      </text>
      {/* Ghost ellipse */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={COL.dot} strokeWidth="1" strokeDasharray="4 3" opacity="0.3" />
      {/* Connecting lines */}
      {lines.map((l, i) => (
        <motion.line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={COL.highlight}
          strokeWidth="1.5"
          opacity="0.45"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: i * 0.06 }}
        />
      ))}
      {/* Colored dots */}
      {times.map((t, i) => {
        const x = cx + geneA[t] * rx;
        const y = cy - geneB[t] * ry;
        return (
          <motion.circle
            key={t}
            cx={x}
            cy={y}
            r="6"
            fill={dotColor(t)}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="0.8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
          />
        );
      })}
      {/* Hour labels every 3h */}
      {times
        .filter((t) => t % 3 === 0)
        .map((t) => {
          const angle = (2 * Math.PI * t) / 24;
          const lx = cx + Math.cos(angle) * (rx + 20);
          const ly = cy - Math.sin(angle) * (ry + 20);
          return (
            <text key={t} x={lx} y={ly + 4} textAnchor="middle" fontSize="9" fill={COL.textS} fontFamily="var(--font-mono)">
              {hours[t]}
            </text>
          );
        })}
      {/* Bottom label */}
      <text x={cx} y={cy + ry + 50} textAnchor="middle" fontSize="10" fill={COL.textP} fontFamily="var(--font-mono)" fontWeight="500">
        walking the ellipse = walking the 24-hour cycle
      </text>
      <text x={cx} y={cy + ry + 66} textAnchor="middle" fontSize="9" fill={COL.textS} fontFamily="var(--font-mono)">
        warm = early · cool = late · no timestamps needed
      </text>
    </svg>
  );
}

// ─── Animated dot that traces the ellipse continuously ───────────────────────

function TracerDot({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  const ref = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let frame: number;
    let t = 0;
    const speed = 0.0008;
    const animate = () => {
      t += speed;
      if (ref.current) {
        const x = cx + Math.cos(t * 2 * Math.PI) * rx;
        const y = cy - Math.sin(t * 2 * Math.PI) * ry;
        ref.current.setAttribute("cx", String(x));
        ref.current.setAttribute("cy", String(y));
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [cx, cy, rx, ry]);

  return (
    <>
      <circle ref={ref} r="5" fill={COL.highlight} opacity="0.9" />
      <circle ref={ref} r="10" fill="none" stroke={COL.highlight} strokeWidth="0.8" opacity="0.4">
        <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
    </>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function CyclopsEllipse() {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    setStep((s) => (s + 1) % 3);
  }, []);

  // Auto-play mode
  useEffect(() => {
    if (!autoPlay) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    timerRef.current = setTimeout(advance, 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [autoPlay, step, advance]);

  const W = 520;
  const H = 340;

  return (
    <div className="space-y-3">
      {/* Step navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        {STEP_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => { setStep(i); setAutoPlay(false); }}
            className="text-[10px] px-3 py-1.5 rounded-md font-medium transition-all duration-200"
            style={{
              fontFamily: "var(--font-mono)",
              border: `1px solid ${step === i ? COL.dot : "var(--site-border)"}`,
              backgroundColor: step === i ? COL.dot + "18" : "transparent",
              color: step === i ? COL.dot : "var(--site-text-secondary)",
            }}
          >
            {i + 1}. {label}
          </button>
        ))}
        <button
          onClick={() => setAutoPlay(!autoPlay)}
          className="text-[10px] px-2 py-1.5 rounded-md ml-auto transition-colors"
          style={{
            fontFamily: "var(--font-mono)",
            color: autoPlay ? COL.highlight : "var(--site-text-dim)",
            border: `1px solid ${autoPlay ? COL.highlight + "40" : "var(--site-border)"}`,
          }}
        >
          {autoPlay ? "⏸" : "▶"} auto
        </button>
      </div>

      {/* Graph */}
      <div className="rounded overflow-hidden" style={{ border: "1px solid var(--site-border)" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {step === 0 && <Step0 w={W} h={H} />}
            {step === 1 && <Step1 w={W} h={H} />}
            {step === 2 && <Step2 w={W} h={H} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => { setStep(i); setAutoPlay(false); }}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor: step === i ? COL.dot : "var(--site-border)",
              transform: step === i ? "scale(1.3)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {/* Caption */}
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          className="text-[11px] leading-relaxed text-center"
          style={{ color: "var(--site-text-prose)", fontFamily: "var(--font-mono)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {CAPTIONS[step]}
        </motion.p>
      </AnimatePresence>

      {/* Info tooltip */}
      <CyclopsInfo />
    </div>
  );
}

function CyclopsInfo() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[10px] transition-colors"
        style={{ color: "var(--site-text-dim)" }}
      >
        <Info size={13} />
        <span>what is CYCLOPS?</span>
      </button>

      {open && (
        <div
          className="absolute left-0 bottom-full mb-2 z-50 w-72 rounded-lg p-4 space-y-2 text-[11px] leading-relaxed shadow-lg"
          style={{
            backgroundColor: "var(--site-bg-card)",
            border: "1px solid var(--site-border)",
            color: "var(--site-text-prose)",
          }}
        >
          <p>
            <strong style={{ color: "var(--site-text)" }}>CYCLOPS</strong> (Cyclic Ordering by Periodic Structure) is a method that recovers circadian phase from a single tissue sample — no time-series needed.
          </p>
          <p>
            It works because clock genes oscillate at the same frequency but with different phase offsets. When plotted pairwise, samples form an ellipse; the angle on that ellipse corresponds to internal time.
          </p>
          <p>
            A neural network fits this ellipse across thousands of genes simultaneously, assigning each sample a phase — effectively reading the body&apos;s clock from one snapshot.
          </p>
          <div className="pt-1" style={{ borderTop: "1px solid var(--site-border)", color: "var(--site-text-dim)", fontSize: "9px" }}>
            Anafi et al., PNAS 2017 · Used in circadian medicine &amp; gene expression studies
          </div>
        </div>
      )}
    </div>
  );
}
