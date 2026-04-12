"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";

// ─── Two-Process Model of Sleep Regulation (Borbély, 1982) ───────────────────
//
// Process S  — Homeostatic sleep pressure
//   Rises exponentially during waking (τ_w ≈ 18.2h)
//   Falls exponentially during sleep  (τ_s ≈ 3.0h)
//   Assumes typical schedule: wake 07:00, sleep 23:00
//
// Process C  — Circadian alerting signal
//   Sinusoidal, ~24h period
//   Peaks ~16:00 (afternoon alertness peak / "wake maintenance zone")
//   Nadir  ~04:00 (circadian trough, hardest to stay awake)
//
// Sleep Pressure = S + (1 − C)
//   High when S is high (long wake) AND C is low (circadian trough)
//   Peaks at ~04:00–05:00 if you haven't slept

const WAKE_H  = 7;   // assumed wake time
const SLEEP_H = 23;  // assumed sleep time
const TAU_W   = 18.2;
const TAU_S   = 3.0;
const S_BASE  = 0.12; // S at end of full sleep
const S_PEAK  = 0.88; // theoretical max S

// Steady-state converged values — avoids discontinuity at phase transitions
const S_WAKE_START = 0.152; // S at 7am after 8h sleep (converged steady-state)
const S_ONSET      = 0.578; // S at 11pm after 16h wake (converged steady-state)

function S_drive(h: number): number {
  // Clamp to [0,24), handle wrap
  h = ((h % 24) + 24) % 24;
  if (h >= WAKE_H && h < SLEEP_H) {
    // Waking phase — starts from steady-state sleep-end value
    const t = h - WAKE_H;
    return S_WAKE_START + (S_PEAK - S_WAKE_START) * (1 - Math.exp(-t / TAU_W));
  } else {
    // Sleeping phase — starts from steady-state wake-end value
    const t = h >= SLEEP_H ? h - SLEEP_H : h + 24 - SLEEP_H;
    return S_BASE + (S_ONSET - S_BASE) * Math.exp(-t / TAU_S);
  }
}

function C_drive(h: number): number {
  // Circadian alerting signal: peaks at 16h, nadir at 4h
  return 0.5 + 0.5 * Math.cos((2 * Math.PI * (h - 16)) / 24);
}

function sleepPressure(h: number): number {
  // Combined: high when S high + circadian sleep-promoting (1-C high)
  return (S_drive(h) + (1 - C_drive(h))) / 2;
}

// ─── Build SVG path string from a function over 24h ──────────────────────────
function buildPath(fn: (h: number) => number, W: number, H: number, steps = 240): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const h = (i / steps) * 24;
    const x = (i / steps) * W;
    const y = H - fn(h) * H * 0.82 - H * 0.06;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

// ─── Stage label from time ────────────────────────────────────────────────────
function getStageName(h: number, m: number): { label: string; color: string; detail: string } {
  const t = h + m / 60;
  // During "sleeping" hours — what stage would you likely be in
  if (t >= 23 || t < 0.5) return { label: "N1",   color: "#7a9fc4", detail: "sleep onset · theta waves" };
  if (t >= 0.5 && t < 2)  return { label: "N2",   color: "#60a5ff", detail: "sleep spindles · K-complexes" };
  if (t >= 2   && t < 4)  return { label: "N3",   color: "#4a8adc", detail: "slow-wave sleep · delta waves" };
  if (t >= 4   && t < 6)  return { label: "REM",  color: "#9b8fce", detail: "rapid eye movement · memory replay" };
  if (t >= 6   && t < 7)  return { label: "N2",   color: "#60a5ff", detail: "late-cycle consolidation" };
  // Waking hours — circadian phase description
  if (t >= 7   && t < 9)  return { label: "Wake", color: "#d4d4d4", detail: "cortisol peak · circadian arousal" };
  if (t >= 9   && t < 12) return { label: "Wake", color: "#d4d4d4", detail: "peak cognitive performance" };
  if (t >= 12  && t < 13) return { label: "Wake", color: "#d4d4d4", detail: "midday alertness" };
  if (t >= 13  && t < 15) return { label: "Dip",  color: "#7a9fc4", detail: "post-prandial dip · microsleep risk" };
  if (t >= 15  && t < 18) return { label: "Wake", color: "#d4d4d4", detail: "afternoon motor & reflex peak" };
  if (t >= 18  && t < 20) return { label: "DLMO", color: "#9b8fce", detail: "dim-light melatonin onset" };
  if (t >= 20  && t < 22) return { label: "Wind", color: "#7a9fc4", detail: "adenosine accumulating · wind-down" };
  return                          { label: "N1",   color: "#7a9fc4", detail: "sleep pressure high · N1 likely" };
}

// ─── Graph component ──────────────────────────────────────────────────────────
const W = 480;
const H = 110;

const HOUR_LABELS = [
  { h: 0, label: "12am" }, { h: 6, label: "6am" }, { h: 12, label: "12pm" },
  { h: 16, label: "4pm" }, { h: 20, label: "8pm" }, { h: 23, label: "11pm" },
];

export function MelatoninGraph() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const i = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  if (!time) return null;

  const h = time.getHours();
  const m = time.getMinutes();
  const t = h + m / 60;
  const stage = getStageName(h, m);

  // Curve paths
  const pathS    = buildPath(S_drive,      W, H);
  const pathC    = buildPath(C_drive,      W, H);
  const pathSP   = buildPath(sleepPressure, W, H);
  const areaS    = pathS    + ` L${W},${H} L0,${H} Z`;
  const areaSP   = pathSP   + ` L${W},${H} L0,${H} Z`;

  // Dot positions on each curve
  const dotX = (t / 24) * W;
  const dotYs = S_drive(t);
  const dotYc = C_drive(t);
  const dotYp = sleepPressure(t);
  const toDotY = (v: number) => H - v * H * 0.82 - H * 0.06;

  // Sleep zone x range
  const sleepX1 = (SLEEP_H / 24) * W;
  const sleepX2 = W; // 23–24h

  return (
    <div className="space-y-3">

      {/* Stage badge row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-xs px-2 py-0.5 rounded border"
          style={{ color: stage.color, borderColor: stage.color, backgroundColor: stage.color + "18" }}
        >
          {stage.label}
        </span>
        <span className="text-xs" style={{ color: "var(--site-text-secondary)" }}>{stage.detail}</span>
        <span className="text-xs ml-auto tabular-nums" style={{ color: "var(--site-text-muted)" }}>
          {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </span>
      </div>

      {/* ── Main graph ── */}
      <div className="rounded overflow-hidden" style={{ border: "1px solid var(--site-border)" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ display: "block" }}>
          <defs>
            <linearGradient id="grad-s" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5ff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#60a5ff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="grad-sp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ddeeff" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ddeeff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="graph-clip">
              <rect x="0" y="0" width={W} height={H} />
            </clipPath>
          </defs>

          <g clipPath="url(#graph-clip)">
            {/* Sleep zone (11pm–midnight band) */}
            <motion.rect x={sleepX1} y="0" width={W - sleepX1} height={H} style={{ fill: "var(--site-bg-card)" }} initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ duration: 0.6 }} />
            {/* Also 0am–7am zone */}
            <motion.rect x="0" y="0" width={(WAKE_H / 24) * W} height={H} style={{ fill: "var(--site-bg-card)" }} initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ duration: 0.6 }} />

            {/* Midday dip reference line at 1pm */}
            <motion.line x1={(13/24)*W} y1="0" x2={(13/24)*W} y2={H} stroke="#1a1a1a" strokeWidth="0.8" strokeDasharray="3,4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.3 }} />

            {/* S-drive area + line */}
            <motion.path d={areaS} fill="url(#grad-s)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }} />
            <motion.path d={pathS} fill="none" stroke="#60a5ff" strokeWidth="1.5" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeInOut" }} />

            {/* C-drive line (circadian alerting) */}
            <motion.path d={pathC} fill="none" stroke="#9b8fce" strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="5,3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeInOut", delay: 0.2 }} />

            {/* Combined sleep pressure area + line */}
            <motion.path d={areaSP} fill="url(#grad-sp)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }} />
            <motion.path d={pathSP} fill="none" stroke="#ddeeff" strokeWidth="2" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeInOut", delay: 0.4 }} />

            {/* Current time vertical line */}
            <motion.line x1={dotX} y1="0" x2={dotX} y2={H} stroke="#525252" strokeWidth="0.8" strokeDasharray="2,3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 1.2 }} />

            {/* Dots on each curve at current time */}
            {/* S-drive dot */}
            <motion.circle cx={dotX} cy={toDotY(dotYs)} r="3.5" fill="#60a5ff" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 1.3 }} />
            <circle cx={dotX} cy={toDotY(dotYs)} r="6" fill="none" stroke="#60a5ff" strokeWidth="0.8" opacity="0.4">
              <animate attributeName="r" values="5;9;5" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
            </circle>
            {/* C-drive dot */}
            <motion.circle cx={dotX} cy={toDotY(dotYc)} r="3" fill="#9b8fce" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 1.4 }} />
            {/* Sleep pressure dot */}
            <motion.circle cx={dotX} cy={toDotY(dotYp)} r="4" fill="#ddeeff" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 1.5 }} />
            <circle cx={dotX} cy={toDotY(dotYp)} r="7" fill="none" stroke="#ddeeff" strokeWidth="0.8" opacity="0.3">
              <animate attributeName="r" values="6;11;6" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>

        {/* Hour axis labels */}
        <div className="relative" style={{ height: 18 }}>
          {HOUR_LABELS.map(({ h: lh, label }) => (
            <span
              key={label}
              className="absolute text-[9px] -translate-x-1/2"
              style={{ left: `${(lh / 24) * 100}%`, color: "var(--site-text-dim)", top: 2 }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-[9px] uppercase tracking-wider flex-wrap" style={{ color: "var(--site-text-muted)" }}>
        <LegendItem color="#60a5ff" label="S-drive" dash={false} detail="homeostatic" />
        <LegendItem color="#9b8fce" label="C-drive" dash={true}  detail="circadian" />
        <LegendItem color="#ddeeff" label="sleep pressure" dash={false} detail="S + (1−C)" />
      </div>

      {/* Live values */}
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <ValueCard label="S-drive"  value={dotYs} color="#60a5ff" desc="adenosine" peak="11pm" peakVal={S_ONSET} />
        <ValueCard label="C-drive"  value={dotYc} color="#9b8fce" desc="alerting" peak="4pm" peakVal={1.0} />
        <ValueCard label="pressure" value={dotYp} color="#ddeeff" desc="combined" peak="3am" peakVal={sleepPressure(3)} />
      </div>

      {/* Info tooltip */}
      <InfoTooltip />

    </div>
  );
}

function LegendItem({ color, label, dash, detail }: { color: string; label: string; dash: boolean; detail: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="20" height="8" style={{ flexShrink: 0 }}>
        <line
          x1="0" y1="4" x2="20" y2="4"
          stroke={color}
          strokeWidth="1.8"
          strokeDasharray={dash ? "4,2" : "none"}
        />
      </svg>
      <span style={{ color }}>{label}</span>
      <span style={{ color: "var(--site-text-dim)" }}>({detail})</span>
    </span>
  );
}

function ValueCard({ label, value, color, desc, peak, peakVal }: { label: string; value: number; color: string; desc: string; peak: string; peakVal: number }) {
  const pct = (value * 100).toFixed(0);
  const peakPct = (peakVal * 100).toFixed(0);
  return (
    <div
      className="rounded px-2 py-2 flex flex-col gap-1"
      style={{ border: "1px solid var(--site-border)", backgroundColor: "var(--site-bg-card)" }}
    >
      <span className="text-[8px] uppercase tracking-wider" style={{ color: "var(--site-text-muted)" }}>{label} · {desc}</span>
      <span className="text-sm font-bold tabular-nums" style={{ color }}>
        {pct}<span className="text-[9px] font-normal" style={{ color: "var(--site-text-muted)" }}>%</span>
      </span>
      {/* Mini progress bar showing current vs peak */}
      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--site-border)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }} />
      </div>
      <span className="text-[8px]" style={{ color: "var(--site-text-dim)" }}>
        peak {peakPct}% at {peak}
      </span>
    </div>
  );
}

function InfoTooltip() {
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
        <span>how to read this</span>
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
            Your sleepiness comes from two competing forces.{" "}
            <span style={{ color: "#60a5ff" }}>S-drive</span> is adenosine building up the longer you stay awake. After roughly 16 hours it peaks and your body demands sleep.{" "}
            <span style={{ color: "#9b8fce" }}>C-drive</span> is your circadian clock fighting to keep you alert, peaking around 4pm.
          </p>
          <p>
            <span style={{ color: "#ddeeff" }}>Sleep pressure</span> = high adenosine + low circadian alerting.
            It peaks between <strong style={{ color: "var(--site-text)" }}>2–4am</strong> and dips again around{" "}
            <strong style={{ color: "var(--site-text)" }}>1–3pm</strong> (afternoon slump).
            Caffeine masks this by blocking adenosine receptors. It hides the debt without reducing it.
          </p>
          <div className="pt-1" style={{ borderTop: "1px solid var(--site-border)", color: "var(--site-text-dim)", fontSize: "9px" }}>
            Based on Borbély&apos;s Two-Process Model of Sleep Regulation (1982)
          </div>
        </div>
      )}
    </div>
  );
}
