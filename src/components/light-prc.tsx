"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

// ─── Light Phase Response Curve (PRC) ───────────────────────────────────────
//
// The PRC describes how light at different times of day shifts the circadian
// clock. It's the foundation of jet lag treatment, shift work adaptation,
// and the science behind light-based circadian interventions.
//
// Key principle:
//   - Light BEFORE the CBT nadir (~4:30am) → DELAYS the clock (shifts later)
//   - Light AFTER the CBT nadir → ADVANCES the clock (shifts earlier)
//   - Light around the nadir → largest shifts (~2-3h with bright light)
//   - Light in midday → negligible effect (dead zone)
//
// Sources: Khalsa et al., J Physiol 2003; St Hilaire et al., PNAS 2012

const W = 480;
const H = 160;
const AXIS_Y = H / 2 + 5;
const LEFT_PAD = 40;
const RIGHT_PAD = 20;
const USABLE_W = W - LEFT_PAD - RIGHT_PAD;

// PRC model: light sensitivity as a function of circadian time
// Approximated as a skewed sinusoid with dead zone during daytime
function prcShift(h: number): number {
  // Normalize to circadian time (CBT nadir = 0)
  const ct = ((h - 4.5) % 24 + 24) % 24; // hours since nadir

  // Smooth continuous PRC using sum of Gaussians
  // Delay lobe (before nadir): centered at ct = -2 (i.e., ct = 22)
  const t1 = ct >= 12 ? ct - 24 : ct;
  const delay = -2.5 * Math.exp(-0.5 * ((t1 + 2) / 1.8) ** 2);

  // Advance lobe (after nadir): centered at ct = 3
  const advance = 2.8 * Math.exp(-0.5 * ((ct - 3) / 2.2) ** 2);

  // Small residual bump in transition zone
  const transition = 0.3 * Math.exp(-0.5 * ((ct - 7) / 1.5) ** 2);

  return delay + advance + transition;
}

// Map clock hour to x
function hourToX(h: number): number {
  return LEFT_PAD + (h / 24) * USABLE_W;
}

// Map shift magnitude to y (positive = up = advance, negative = down = delay)
function shiftToY(shift: number): number {
  const maxShift = 3.5;
  return AXIS_Y - (shift / maxShift) * (H * 0.38);
}

// Build smooth PRC path
function buildPRCPath(): string {
  const pts: string[] = [];
  const steps = 240;
  for (let i = 0; i <= steps; i++) {
    const h = (i / steps) * 24;
    const x = hourToX(h);
    const y = shiftToY(prcShift(h));
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

// Build area paths for delay (below axis) and advance (above axis)
function buildAreaPaths(): { advancePath: string; delayPath: string } {
  const steps = 240;
  const advPts: Array<[number, number]> = [];
  const delPts: Array<[number, number]> = [];

  for (let i = 0; i <= steps; i++) {
    const h = (i / steps) * 24;
    const x = hourToX(h);
    const shift = prcShift(h);
    if (shift > 0) {
      advPts.push([x, shiftToY(shift)]);
    }
    if (shift < 0) {
      delPts.push([x, shiftToY(shift)]);
    }
  }

  const makePath = (pts: Array<[number, number]>): string => {
    if (pts.length < 2) return "";
    let d = `M${pts[0][0].toFixed(1)},${AXIS_Y}`;
    for (const [x, y] of pts) {
      d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
    }
    d += ` L${pts[pts.length - 1][0].toFixed(1)},${AXIS_Y} Z`;
    return d;
  };

  return { advancePath: makePath(advPts), delayPath: makePath(delPts) };
}

const HOUR_LABELS = [
  { h: 0, label: "12am" }, { h: 4, label: "4am" }, { h: 8, label: "8am" },
  { h: 12, label: "12pm" }, { h: 16, label: "4pm" }, { h: 20, label: "8pm" },
];

interface SelectedPoint {
  hour: number;
  shift: number;
}

export function LightPRC() {
  const [time, setTime] = useState<Date | null>(null);
  const [clickedPoint, setClickedPoint] = useState<SelectedPoint | null>(null);
  const [hoverPoint, setHoverPoint] = useState<SelectedPoint | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setTime(new Date());
    const i = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  const prcPath = buildPRCPath();
  const { advancePath, delayPath } = buildAreaPaths();

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const svgX = (x / rect.width) * W;
    const h = ((svgX - LEFT_PAD) / USABLE_W) * 24;
    if (h >= 0 && h <= 24) {
      setHoverPoint({ hour: h, shift: prcShift(h) });
    } else {
      setHoverPoint(null);
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const svgX = (x / rect.width) * W;
    const h = ((svgX - LEFT_PAD) / USABLE_W) * 24;
    if (h >= 0 && h <= 24) {
      setClickedPoint({ hour: h, shift: prcShift(h) });
    }
  }, []);

  if (!time) return null;

  const t = time.getHours() + time.getMinutes() / 60;
  const currentShift = prcShift(t);
  const dotX = hourToX(t);
  const dotY = shiftToY(currentShift);

  // Active point (clicked takes priority over hover)
  const active = clickedPoint || hoverPoint;

  let currentAdvice: string;
  if (Math.abs(currentShift) < 0.3) {
    currentAdvice = "dead zone, light has minimal clock-shifting effect right now";
  } else if (currentShift > 0) {
    currentAdvice = `light now would advance your clock by ~${currentShift.toFixed(1)}h (shift earlier)`;
  } else {
    currentAdvice = `light now would delay your clock by ~${Math.abs(currentShift).toFixed(1)}h (shift later)`;
  }

  return (
    <div className="space-y-3">
      {/* Status */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-xs px-2 py-0.5 rounded border"
          style={{
            color: Math.abs(currentShift) < 0.3 ? "var(--site-text-muted)" : currentShift > 0 ? "#5dcaa5" : "#db7093",
            borderColor: Math.abs(currentShift) < 0.3 ? "var(--site-border)" : currentShift > 0 ? "#5dcaa5" : "#db7093",
            backgroundColor: Math.abs(currentShift) < 0.3 ? "transparent" : (currentShift > 0 ? "#5dcaa518" : "#db709318"),
          }}
        >
          {Math.abs(currentShift) < 0.3 ? "dead zone" : currentShift > 0 ? `+${currentShift.toFixed(1)}h advance` : `${currentShift.toFixed(1)}h delay`}
        </span>
        <span className="text-xs" style={{ color: "var(--site-text-secondary)" }}>{currentAdvice}</span>
      </div>

      {/* Graph */}
      <div className="rounded overflow-hidden" style={{ border: "1px solid var(--site-border)" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: "block", cursor: "crosshair" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverPoint(null)}
          onClick={handleClick}
        >
          <defs>
            <linearGradient id="grad-advance" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#5dcaa5" stopOpacity="0" />
              <stop offset="100%" stopColor="#5dcaa5" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="grad-delay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#db7093" stopOpacity="0" />
              <stop offset="100%" stopColor="#db7093" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* CBT nadir marker */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <line x1={hourToX(4.5)} y1={10} x2={hourToX(4.5)} y2={H - 10} stroke="#4a8adc" strokeWidth="0.8" strokeDasharray="3,4" opacity="0.5" />
            <text x={hourToX(4.5)} y={10} textAnchor="middle" fontSize="8" fill="#4a8adc" fontFamily="var(--font-mono)">
              CBT nadir
            </text>
          </motion.g>

          {/* Axis labels */}
          <text x={LEFT_PAD - 4} y={shiftToY(2.5)} textAnchor="end" fontSize="8" fill="#5dcaa5" fontFamily="var(--font-mono)">
            advance
          </text>
          <text x={LEFT_PAD - 4} y={shiftToY(-2.5)} textAnchor="end" fontSize="8" fill="#db7093" fontFamily="var(--font-mono)">
            delay
          </text>

          {/* Zero axis */}
          <line x1={LEFT_PAD} y1={AXIS_Y} x2={W - RIGHT_PAD} y2={AXIS_Y} stroke="var(--site-text-dim)" strokeWidth="0.8" />

          {/* Grid lines */}
          {[-2, -1, 1, 2].map((v) => (
            <line key={v} x1={LEFT_PAD} y1={shiftToY(v)} x2={W - RIGHT_PAD} y2={shiftToY(v)} stroke="var(--site-border)" strokeWidth="0.5" strokeDasharray="4,6" />
          ))}

          {/* Area fills */}
          {advancePath && (
            <motion.path d={advancePath} fill="url(#grad-advance)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} />
          )}
          {delayPath && (
            <motion.path d={delayPath} fill="url(#grad-delay)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} />
          )}

          {/* PRC curve */}
          <motion.path
            d={prcPath}
            fill="none"
            stroke="var(--site-text)"
            strokeWidth="2"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          />

          {/* Hover / clicked point */}
          {active && (
            <g>
              <line
                x1={hourToX(active.hour)}
                y1={10}
                x2={hourToX(active.hour)}
                y2={H - 10}
                stroke="var(--site-text-dim)"
                strokeWidth="0.8"
                strokeDasharray="2,3"
              />
              <circle
                cx={hourToX(active.hour)}
                cy={shiftToY(active.shift)}
                r="5"
                fill={Math.abs(active.shift) < 0.3 ? "var(--site-text-muted)" : active.shift > 0 ? "#5dcaa5" : "#db7093"}
              />
              <rect
                x={hourToX(active.hour) - 50}
                y={shiftToY(active.shift) - 28}
                width={100}
                height={20}
                rx={4}
                fill="var(--site-bg-card)"
                stroke="var(--site-border)"
                strokeWidth="1"
              />
              <text
                x={hourToX(active.hour)}
                y={shiftToY(active.shift) - 15}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill={Math.abs(active.shift) < 0.3 ? "var(--site-text-muted)" : active.shift > 0 ? "#5dcaa5" : "#db7093"}
                fontFamily="var(--font-mono)"
              >
                {Math.abs(active.shift) < 0.1
                  ? "no effect"
                  : active.shift > 0
                    ? `+${active.shift.toFixed(1)}h advance`
                    : `${active.shift.toFixed(1)}h delay`}
              </text>
            </g>
          )}

          {/* Current time marker */}
          <motion.line
            x1={dotX} y1={10} x2={dotX} y2={H - 10}
            stroke="#525252" strokeWidth="0.8" strokeDasharray="2,3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          />
          <motion.circle
            cx={dotX} cy={dotY} r="4"
            fill={Math.abs(currentShift) < 0.3 ? "var(--site-text-muted)" : currentShift > 0 ? "#5dcaa5" : "#db7093"}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.5 }}
          />
          <circle cx={dotX} cy={dotY} r="7" fill="none" stroke={currentShift > 0 ? "#5dcaa5" : "#db7093"} strokeWidth="0.8" opacity="0.3">
            <animate attributeName="r" values="6;11;6" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" repeatCount="indefinite" />
          </circle>

          {/* Hour labels */}
          {HOUR_LABELS.map(({ h, label }) => (
            <text key={label} x={hourToX(h)} y={H - 4} textAnchor="middle" fontSize="9" fill="var(--site-text-dim)" fontFamily="var(--font-mono)">
              {label}
            </text>
          ))}
        </svg>
      </div>

      {/* Instruction */}
      <p className="text-[10px]" style={{ color: "var(--site-text-dim)", fontFamily: "var(--font-mono)" }}>
        click anywhere on the graph to see the predicted phase shift at that time
      </p>

      {/* Legend */}
      <div className="flex items-center gap-5 text-[9px] uppercase tracking-wider flex-wrap" style={{ color: "var(--site-text-muted)" }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm" style={{ backgroundColor: "#5dcaa530" }} />
          <span style={{ color: "#5dcaa5" }}>advance zone</span>
          <span>(shifts clock earlier)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm" style={{ backgroundColor: "#db709330" }} />
          <span style={{ color: "#db7093" }}>delay zone</span>
          <span>(shifts clock later)</span>
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <StatCard label="max advance" value="+2.8h" color="#5dcaa5" detail="light at ~7:30am" />
        <StatCard label="max delay" value="-2.5h" color="#db7093" detail="light at ~2:30am" />
        <StatCard label="dead zone" value="10am–8pm" color="var(--site-text-muted)" detail="minimal effect" />
      </div>

      {/* Info */}
      <PRCInfo />
    </div>
  );
}

function StatCard({ label, value, color, detail }: { label: string; value: string; color: string; detail: string }) {
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

function PRCInfo() {
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
        <span>how this applies to jet lag</span>
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
            The PRC is why jet lag advice isn&apos;t just &ldquo;get sunlight.&rdquo; Light at the{" "}
            <strong style={{ color: "var(--site-text)" }}>wrong time</strong> pushes your clock in the wrong direction and makes adaptation slower.
          </p>
          <p>
            <span style={{ color: "#5dcaa5" }}>Eastward travel</span> (e.g., NYC → London) requires advancing your clock. You need bright light in the{" "}
            <strong style={{ color: "var(--site-text)" }}>morning</strong> and darkness in the evening.
          </p>
          <p>
            <span style={{ color: "#db7093" }}>Westward travel</span> (e.g., London → NYC) requires delaying. You need bright light in the{" "}
            <strong style={{ color: "var(--site-text)" }}>evening</strong> and avoiding early morning light.
          </p>
          <p>
            The critical boundary is your CBT nadir (~4:30am home time). Light before it delays; light after advances. Timed light exposure is the single most effective tool for shifting your clock.
          </p>
          <div className="pt-1" style={{ borderTop: "1px solid var(--site-border)", color: "var(--site-text-dim)", fontSize: "9px" }}>
            Khalsa et al., J Physiol 2003 &middot; St Hilaire et al., PNAS 2012
          </div>
        </div>
      )}
    </div>
  );
}
