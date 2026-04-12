"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

// ─── Sleep stage definitions ────────────────────────────────────────────────

interface StageInfo {
  label: string;
  y: number;     // 0=Wake (top), 1=REM, 2=N1, 3=N2, 4=N3 (bottom)
  color: string;
}

const STAGES: Record<string, StageInfo> = {
  Wake: { label: "Wake", y: 0, color: "#d4d4d4" },
  REM:  { label: "REM",  y: 1, color: "#9b8fce" },
  N1:   { label: "N1",   y: 2, color: "#7a9fc4" },
  N2:   { label: "N2",   y: 3, color: "#60a5ff" },
  N3:   { label: "N3",   y: 4, color: "#4a8adc" },
};

// ─── Realistic hypnogram data ───────────────────────────────────────────────
// Based on standard adult sleep architecture for a 22:30–07:00 sleep window.
// ~5 cycles of ~90–100 min. N3 dominates cycles 1-2, REM dominates cycles 4-5.
// Brief awakenings (W) between cycles are normal (~2-5% of night).
// N2 is ~50-55% of total sleep, N3 ~15-20%, REM ~20-25%, N1 ~5%.
//
// Each entry: [decimal hour (22.5 = 10:30pm, 0 = midnight), stage key]

const HYPNO_DATA: [number, string][] = [
  // ── Cycle 1 (22:30–00:10) — deepest N3 of the night ──
  [22.5,  "Wake"],   // lights out
  [22.55, "N1"],     // sleep onset (~3 min)
  [22.6,  "N2"],     // transition to N2
  [22.85, "N3"],     // first deep sleep descent (~15 min into sleep)
  [23.4,  "N3"],     // sustained N3 (~33 min block)
  [23.5,  "N2"],     // ascending out of deep
  [23.65, "N2"],     // brief N2
  [23.75, "REM"],    // first REM — short (~10 min)
  [23.92, "REM"],    // end of first REM

  // ── Cycle 2 (00:10–01:50) — still significant N3 ──
  [0.17,  "Wake"],   // brief arousal between cycles
  [0.2,   "N1"],     // re-entry
  [0.25,  "N2"],
  [0.55,  "N3"],     // second N3 block — shorter than first
  [1.05,  "N3"],     // ~30 min of N3
  [1.1,   "N2"],
  [1.25,  "N2"],
  [1.4,   "REM"],    // second REM — longer (~20 min)
  [1.72,  "REM"],

  // ── Cycle 3 (01:50–03:25) — N3 diminishes, REM grows ──
  [1.83,  "Wake"],   // brief arousal
  [1.87,  "N1"],
  [1.92,  "N2"],
  [2.25,  "N3"],     // lighter N3, ~15 min
  [2.5,   "N3"],
  [2.55,  "N2"],
  [2.75,  "N2"],
  [2.92,  "REM"],    // third REM — ~25 min
  [3.33,  "REM"],

  // ── Cycle 4 (03:25–05:00) — mostly N2 + long REM ──
  [3.42,  "Wake"],   // brief arousal
  [3.45,  "N1"],
  [3.5,   "N2"],
  [3.85,  "N2"],     // N2 dominates, minimal/no N3
  [4.0,   "N2"],
  [4.1,   "REM"],    // fourth REM — long (~30 min)
  [4.6,   "REM"],

  // ── Cycle 5 (05:00–06:50) — REM dominant, light sleep ──
  [4.67,  "Wake"],   // brief arousal
  [4.72,  "N1"],
  [4.8,   "N2"],
  [5.1,   "N2"],
  [5.25,  "N2"],
  [5.35,  "REM"],    // fifth REM — longest (~35 min)
  [5.93,  "REM"],

  // ── Final awakening ──
  [6.0,   "N1"],     // light sleep
  [6.15,  "N2"],     // brief N2
  [6.35,  "N1"],     // surfacing
  [6.5,   "Wake"],   // natural waking ~6:30
  [7.0,   "Wake"],   // alarm / out of bed
];

// Interpolate stage for any hour from the data
function getStageForHour(h: number): StageInfo {
  // During wake hours, return Wake
  if (h >= 7 && h < 22.5) return STAGES.Wake;

  // Normalize to comparable range (hours past 22:00)
  const normalize = (v: number) => (v < 12 ? v + 24 : v);
  const hn = normalize(h);

  // Find the segment we're in
  for (let i = HYPNO_DATA.length - 1; i >= 0; i--) {
    const dataH = normalize(HYPNO_DATA[i][0]);
    if (hn >= dataH) {
      return STAGES[HYPNO_DATA[i][1]];
    }
  }
  return STAGES.Wake;
}

// ─── Chart dimensions ───────────────────────────────────────────────────────

const W = 360;
const H = 80;
const PADDING_Y = 8;
const USABLE_H = H - PADDING_Y * 2;

// Map 22:30–07:00 (8.5 hours) linearly to chart width
const SLEEP_START = 22.5;
const SLEEP_END_NORM = 31; // 7:00 = 24+7
const SLEEP_DURATION = SLEEP_END_NORM - SLEEP_START;

function hourToX(hour: number): number {
  const h = hour < 12 ? hour + 24 : hour;
  return ((h - SLEEP_START) / SLEEP_DURATION) * W;
}

function stageToY(stageY: number): number {
  return PADDING_Y + (stageY / 4) * USABLE_H;
}

export function Hypnogram() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const i = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  if (!time) return null;

  const currentH = time.getHours() + time.getMinutes() / 60;
  const currentStage = getStageForHour(currentH);

  // Is current time within the hypnogram range (22:30 - 07:00)?
  const inSleepWindow = currentH >= 22.5 || currentH < 7;

  // Build the stepped path from data points
  let pathD = "";
  for (let i = 0; i < HYPNO_DATA.length; i++) {
    const [h, stageKey] = HYPNO_DATA[i];
    const stage = STAGES[stageKey];
    const x = hourToX(h);
    const y = stageToY(stage.y);

    if (i === 0) {
      pathD += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
    } else {
      // Step: horizontal to new x at previous y, then vertical to new y
      const prevStage = STAGES[HYPNO_DATA[i - 1][1]];
      const prevY = stageToY(prevStage.y);
      pathD += ` L ${x.toFixed(1)} ${prevY.toFixed(1)}`;
      pathD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }

  // Current time marker position
  const markerX = inSleepWindow ? hourToX(currentH) : null;
  const markerY = inSleepWindow ? stageToY(currentStage.y) : null;

  // Stage labels on the left
  const stageLabels = [
    { label: "W", y: stageToY(0) },
    { label: "R", y: stageToY(1) },
    { label: "1", y: stageToY(2) },
    { label: "2", y: stageToY(3) },
    { label: "3", y: stageToY(4) },
  ];

  // Hour labels along bottom
  const hourLabels = [
    { h: 22.5, label: "10:30p" },
    { h: 0, label: "12a" },
    { h: 2, label: "2a" },
    { h: 4, label: "4a" },
    { h: 6, label: "6a" },
  ];

  return (
    <div className="space-y-3">
      {/* Current stage badge */}
      <div className="flex items-center gap-3">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{
            backgroundColor: currentStage.color,
            animation: `breathe 4s ease-in-out infinite`,
          }}
        />
        <span className="text-xs" style={{ color: currentStage.color }}>
          {currentStage.label}
        </span>
        <span className="text-[10px]" style={{ color: "var(--site-text-muted)" }}>
          {inSleepWindow ? "sleep window active" : "next cycle starts at 10:30pm"}
        </span>
      </div>

      {/* Hypnogram chart */}
      <div className="rounded overflow-hidden" style={{ border: "1px solid var(--site-border)" }}>
        <div className="flex">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between py-2 pr-1 pl-2" style={{ height: H, minWidth: 20 }}>
            {stageLabels.map(({ label, y }) => (
              <span
                key={label}
                className="text-[8px] leading-none"
                style={{ color: "var(--site-text-dim)", position: "relative", top: y - H / 2 }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Chart area */}
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block" }}>
            <defs>
              <linearGradient id="hypno-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5ff" stopOpacity="0" />
                <stop offset="100%" stopColor="#60a5ff" stopOpacity="0.15" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines for each stage */}
            {stageLabels.map(({ label, y }) => (
              <line key={label} x1="0" y1={y} x2={W} y2={y} stroke="var(--site-border)" strokeWidth="0.5" strokeDasharray="4,6" />
            ))}

            {/* The hypnogram stepped line */}
            <path d={pathD} fill="none" stroke="#60a5ff" strokeWidth="2" strokeLinejoin="round" />

            {/* Fill under curve */}
            <path d={pathD + ` L ${W} ${stageToY(0)} L 0 ${stageToY(0)} Z`} fill="url(#hypno-fill)" />

            {/* Current time marker */}
            {markerX !== null && markerY !== null && (
              <>
                <line x1={markerX} y1={0} x2={markerX} y2={H} stroke="var(--site-accent)" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
                <circle cx={markerX} cy={markerY} r="4" fill="var(--site-accent)" />
                <circle cx={markerX} cy={markerY} r="7" fill="none" stroke="var(--site-accent)" strokeWidth="1" opacity="0.4">
                  <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              </>
            )}
          </svg>
        </div>

        {/* X-axis hour labels */}
        <div className="relative" style={{ height: 16, marginLeft: 20 }}>
          {hourLabels.map(({ h, label }) => (
            <span
              key={label}
              className="absolute text-[8px] -translate-x-1/2"
              style={{ left: `${(hourToX(h) / W) * 100}%`, color: "var(--site-text-dim)", top: 2 }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Legend + info */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 text-[9px] flex-wrap" style={{ color: "var(--site-text-muted)" }}>
          {Object.values(STAGES).map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
        <HypnogramInfo />
      </div>
    </div>
  );
}

function HypnogramInfo() {
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
          className="absolute right-0 bottom-full mb-2 z-50 w-72 rounded-lg p-4 space-y-2 text-[11px] leading-relaxed shadow-lg"
          style={{
            backgroundColor: "var(--site-bg-card)",
            border: "1px solid var(--site-border)",
            color: "var(--site-text-prose)",
          }}
        >
          <p>
            A hypnogram maps your sleep stages across the night. It looks like a city skyline — each &ldquo;step&rdquo; is a different depth of sleep.
          </p>
          <p>
            You cycle through <span style={{ color: "#7a9fc4" }}>N1</span> (light),{" "}
            <span style={{ color: "#60a5ff" }}>N2</span> (intermediate),{" "}
            <span style={{ color: "#4a8adc" }}>N3</span> (deep/restorative), and{" "}
            <span style={{ color: "#9b8fce" }}>REM</span> (dreaming) roughly every 90–110 minutes.
          </p>
          <p>
            Deep sleep (<span style={{ color: "#4a8adc" }}>N3</span>) dominates the <strong style={{ color: "var(--site-text)" }}>first half</strong> of the night.
            REM (<span style={{ color: "#9b8fce" }}>dreaming</span>) dominates the <strong style={{ color: "var(--site-text)" }}>second half</strong>, with periods getting longer toward morning.
            Brief awakenings between cycles are normal.
          </p>
          <p>
            The red marker shows where I am right now in this pattern.
          </p>
          <div className="pt-1 text-[9px]" style={{ borderTop: "1px solid var(--site-border)", color: "var(--site-text-dim)" }}>
            Based on a 10:30pm–7:00am sleep schedule · ~5 cycles
          </div>
        </div>
      )}
    </div>
  );
}
