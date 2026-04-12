"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";

// ─── Core Body Temperature Rhythm ───────────────────────────────────────────
//
// Core body temperature (CBT) follows a robust circadian pattern:
//   Nadir  ~04:30  (~36.2°C / 97.2°F)  — deepest sleep, max melatonin
//   Peak   ~18:30  (~37.2°C / 99.0°F)  — late afternoon
//
// Temperature gates sleep onset: you fall asleep on the descending slope.
// REM sleep is most abundant when CBT is at its lowest.
//
// Sources: Czeisler et al. (1999), Kräuchi (2007)

const W = 480;
const H = 130;
const STEPS = 240;

// CBT model: sinusoid with realistic phase and amplitude
// Nadir at 4.5h (4:30am), peak at 18.5h (6:30pm)
// Range: ~36.2–37.2°C
const CBT_MIN = 36.2;
const CBT_MAX = 37.2;
const CBT_MID = (CBT_MIN + CBT_MAX) / 2;
const CBT_AMP = (CBT_MAX - CBT_MIN) / 2;
const NADIR_H = 4.5;

function cbt(h: number): number {
  // Cosine centered on nadir (inverted: nadir = min)
  return CBT_MID - CBT_AMP * Math.cos((2 * Math.PI * (h - NADIR_H)) / 24);
}

// Normalize to 0–1 for plotting
function cbtNorm(h: number): number {
  return (cbt(h) - CBT_MIN) / (CBT_MAX - CBT_MIN);
}

// Melatonin onset/offset overlay (rough)
// Onset ~21:00, peak ~03:00, offset ~07:00
function melatonin(h: number): number {
  // Bell-shaped curve centered at 3am
  const center = 3;
  const sigma = 2.5;
  const d = h < 12 ? h - center : h - center - 24;
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

function buildPath(fn: (h: number) => number, w: number, h: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const hour = (i / STEPS) * 24;
    const x = (i / STEPS) * w;
    const y = h - fn(hour) * h * 0.75 - h * 0.08;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

const HOUR_LABELS = [
  { h: 0, label: "12am" }, { h: 4, label: "4am" }, { h: 8, label: "8am" },
  { h: 12, label: "12pm" }, { h: 16, label: "4pm" }, { h: 20, label: "8pm" },
];

const ZONES = [
  { start: 21, end: 24, label: "sleep onset zone", color: "#4a8adc" },
  { start: 0, end: 7, label: null, color: "#4a8adc" },
];

export function BodyTempRhythm() {
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

  const pathCBT = buildPath(cbtNorm, W, H);
  const pathMel = buildPath(melatonin, W, H);
  const areaCBT = pathCBT + ` L${W},${H} L0,${H} Z`;

  const dotX = (t / 24) * W;
  const dotY = H - cbtNorm(t) * H * 0.75 - H * 0.08;
  const currentTemp = cbt(t);

  // Nadir / peak markers
  const nadirX = (NADIR_H / 24) * W;
  const nadirY = H - cbtNorm(NADIR_H) * H * 0.75 - H * 0.08;
  const peakH = 18.5;
  const peakX = (peakH / 24) * W;
  const peakY = H - cbtNorm(peakH) * H * 0.75 - H * 0.08;

  // Descending slope indicator (sleep onset window ~21:00–23:00)
  const isDescending = t >= 18.5 && t <= 24;
  const isNearNadir = (t >= 2 && t <= 7);

  let phaseLabel: string;
  let phaseColor: string;
  if (t >= 2 && t < 6) {
    phaseLabel = "CBT nadir — deepest sleep, max REM propensity";
    phaseColor = "#4a8adc";
  } else if (t >= 6 && t < 10) {
    phaseLabel = "rising — cortisol surge, waking up";
    phaseColor = "#EF9F27";
  } else if (t >= 10 && t < 15) {
    phaseLabel = "ascending — peak cognitive performance";
    phaseColor = "#5dcaa5";
  } else if (t >= 15 && t < 19) {
    phaseLabel = "peak — motor performance, reaction time best";
    phaseColor = "#5dcaa5";
  } else if (t >= 19 && t < 22) {
    phaseLabel = "descending — melatonin onset, sleep gate opening";
    phaseColor = "#9b8fce";
  } else {
    phaseLabel = "low — sleep onset favorable";
    phaseColor = "#4a8adc";
  }

  return (
    <div className="space-y-3">
      {/* Status */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-xs px-2 py-0.5 rounded border"
          style={{ color: phaseColor, borderColor: phaseColor, backgroundColor: phaseColor + "18" }}
        >
          {currentTemp.toFixed(1)}°C
        </span>
        <span className="text-xs" style={{ color: "var(--site-text-secondary)" }}>{phaseLabel}</span>
        <span className="text-xs ml-auto tabular-nums" style={{ color: "var(--site-text-muted)" }}>
          {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </span>
      </div>

      {/* Graph */}
      <div className="rounded overflow-hidden" style={{ border: "1px solid var(--site-border)" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ display: "block" }}>
          <defs>
            <linearGradient id="grad-cbt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF9F27" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#EF9F27" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="grad-mel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9b8fce" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#9b8fce" stopOpacity="0" />
            </linearGradient>
            <clipPath id="cbt-clip">
              <rect x="0" y="0" width={W} height={H} />
            </clipPath>
          </defs>

          <g clipPath="url(#cbt-clip)">
            {/* Sleep zone shading */}
            {ZONES.map((z, i) => (
              <motion.rect
                key={i}
                x={(z.start / 24) * W}
                y={0}
                width={((z.end - z.start) / 24) * W}
                height={H}
                fill={z.color}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.06 }}
                transition={{ duration: 0.6 }}
              />
            ))}

            {/* Melatonin area */}
            <motion.path
              d={pathMel + ` L${W},${H} L0,${H} Z`}
              fill="url(#grad-mel)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            />
            {/* Melatonin curve */}
            <motion.path
              d={pathMel}
              fill="none"
              stroke="#9b8fce"
              strokeWidth="1.2"
              strokeLinejoin="round"
              strokeDasharray="4,3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, ease: "easeInOut", delay: 0.3 }}
            />

            {/* CBT area */}
            <motion.path
              d={areaCBT}
              fill="url(#grad-cbt)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
            {/* CBT curve */}
            <motion.path
              d={pathCBT}
              fill="none"
              stroke="#EF9F27"
              strokeWidth="2"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />

            {/* Nadir marker */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
              <line x1={nadirX} y1={nadirY} x2={nadirX} y2={nadirY + 12} stroke="#4a8adc" strokeWidth="0.8" />
              <text x={nadirX} y={nadirY + 20} textAnchor="middle" fontSize="8" fill="#4a8adc" fontFamily="var(--font-mono)">
                nadir 4:30am
              </text>
            </motion.g>

            {/* Peak marker */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
              <line x1={peakX} y1={peakY} x2={peakX} y2={peakY - 10} stroke="#EF9F27" strokeWidth="0.8" />
              <text x={peakX} y={peakY - 14} textAnchor="middle" fontSize="8" fill="#EF9F27" fontFamily="var(--font-mono)">
                peak 6:30pm
              </text>
            </motion.g>

            {/* Current time */}
            <motion.line
              x1={dotX} y1={0} x2={dotX} y2={H}
              stroke="#525252" strokeWidth="0.8" strokeDasharray="2,3"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
            />
            <motion.circle
              cx={dotX} cy={dotY} r="4" fill="#EF9F27"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.5 }}
            />
            <circle cx={dotX} cy={dotY} r="7" fill="none" stroke="#EF9F27" strokeWidth="0.8" opacity="0.3">
              <animate attributeName="r" values="6;11;6" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>

        {/* Hour labels */}
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
        <span className="flex items-center gap-1.5">
          <svg width="20" height="8" style={{ flexShrink: 0 }}>
            <line x1="0" y1="4" x2="20" y2="4" stroke="#EF9F27" strokeWidth="2" />
          </svg>
          <span style={{ color: "#EF9F27" }}>core body temp</span>
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="20" height="8" style={{ flexShrink: 0 }}>
            <line x1="0" y1="4" x2="20" y2="4" stroke="#9b8fce" strokeWidth="1.2" strokeDasharray="4,2" />
          </svg>
          <span style={{ color: "#9b8fce" }}>melatonin</span>
        </span>
      </div>

      {/* Values */}
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <ValueCard label="current" value={`${currentTemp.toFixed(1)}°C`} color="#EF9F27" detail={`${(currentTemp * 9/5 + 32).toFixed(1)}°F`} />
        <ValueCard label="nadir" value="36.2°C" color="#4a8adc" detail="4:30am · max REM" />
        <ValueCard label="peak" value="37.2°C" color="#EF9F27" detail="6:30pm · alertness" />
      </div>

      {/* Info */}
      <CBTInfo />
    </div>
  );
}

function ValueCard({ label, value, color, detail }: { label: string; value: string; color: string; detail: string }) {
  return (
    <div
      className="rounded px-2 py-2 flex flex-col gap-1"
      style={{ border: "1px solid var(--site-border)", backgroundColor: "var(--site-bg-card)" }}
    >
      <span className="text-[8px] uppercase tracking-wider" style={{ color: "var(--site-text-muted)" }}>{label}</span>
      <span className="text-sm font-bold tabular-nums" style={{ color, fontFamily: "var(--font-mono)" }}>{value}</span>
      <span className="text-[8px]" style={{ color: "var(--site-text-dim)" }}>{detail}</span>
    </div>
  );
}

function CBTInfo() {
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
        <span>why temperature matters for sleep</span>
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
            Core body temperature is one of the most reliable circadian markers. You fall asleep on the{" "}
            <strong style={{ color: "var(--site-text)" }}>descending slope</strong> of the temperature curve and wake on the ascending slope.
          </p>
          <p>
            The <span style={{ color: "#9b8fce" }}>melatonin</span> onset around 9pm triggers peripheral vasodilation (warm hands and feet), which dumps heat from the core. This 1°C drop is what makes you feel sleepy.
          </p>
          <p>
            REM sleep is concentrated around the{" "}
            <span style={{ color: "#4a8adc" }}>temperature nadir</span> (~4:30am). A hot bedroom fights this natural cooling and fragments sleep.
          </p>
          <div className="pt-1" style={{ borderTop: "1px solid var(--site-border)", color: "var(--site-text-dim)", fontSize: "9px" }}>
            Czeisler et al., Science 1999 &middot; Kräuchi, Sleep Med Rev 2007
          </div>
        </div>
      )}
    </div>
  );
}
