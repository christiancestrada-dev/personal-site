"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

// ─── Chronotype Spectrum ────────────────────────────────────────────────────
//
// Chronotype is your genetically-influenced tendency toward earlier or later
// sleep/wake timing. Modeled as a bell curve (Roenneberg et al., 2007):
//   - Distribution is roughly Gaussian with slight right skew
//   - Mid-sleep on free days (MSF) is the standard measure
//   - Population mean MSF ≈ 4:00am (sleep midnight–8am)
//
// DLMO (dim-light melatonin onset) correlates with chronotype:
//   Extreme lark: DLMO ~19:00, sleep ~21:00–05:00
//   Average:      DLMO ~21:00, sleep ~23:00–07:00
//   Extreme owl:  DLMO ~01:00, sleep ~03:00–11:00
//
// Social jet lag = difference between free-day and work-day mid-sleep.

const W = 480;
const H = 180;
const CURVE_Y_START = 30;
const CURVE_H = 100;

// Chronotype distribution: Gaussian centered at midpoint
// x-axis: MSF from 1:00am to 7:00am (maps to 1–7)
const MSF_MIN = 1; // 1:00am
const MSF_MAX = 7; // 7:00am
const MSF_MEAN = 4; // 4:00am
const MSF_SD = 1.1;

function gaussian(x: number, mean: number, sd: number): number {
  return Math.exp(-0.5 * ((x - mean) / sd) ** 2);
}

// Map MSF hour to x position
function msfToX(msf: number): number {
  return ((msf - MSF_MIN) / (MSF_MAX - MSF_MIN)) * (W - 80) + 40;
}

// Map gaussian value to y
function valToY(v: number): number {
  return CURVE_Y_START + CURVE_H - v * CURVE_H * 0.92;
}

interface ChronotypeProfile {
  label: string;
  msf: number; // mid-sleep on free days (hour)
  dlmo: string;
  sleepWindow: string;
  naturalWake: string;
  color: string;
}

const PROFILES: Record<string, ChronotypeProfile> = {
  "extreme-lark": { label: "Extreme lark", msf: 1.5, dlmo: "19:00", sleepWindow: "21:00–05:00", naturalWake: "5:00am", color: "#EF9F27" },
  "moderate-lark": { label: "Moderate lark", msf: 2.5, dlmo: "20:00", sleepWindow: "22:00–06:00", naturalWake: "6:00am", color: "#5dcaa5" },
  "average": { label: "Average", msf: 4.0, dlmo: "21:00", sleepWindow: "23:00–07:00", naturalWake: "7:00am", color: "#60a5ff" },
  "moderate-owl": { label: "Moderate owl", msf: 5.5, dlmo: "23:00", sleepWindow: "01:00–09:00", naturalWake: "9:00am", color: "#9b8fce" },
  "extreme-owl": { label: "Extreme owl", msf: 6.5, dlmo: "01:00", sleepWindow: "03:00–11:00", naturalWake: "11:00am", color: "#db7093" },
};

const PROFILE_KEYS = Object.keys(PROFILES);

// Social jet lag for each type if forced to an 8am schedule
function socialJetLag(msf: number): number {
  // Work mid-sleep = (sleep_onset + 8h_wake) / 2
  // For 8am wake, assume ~7.5h sleep → onset ~00:30 → work mid-sleep = 4.25
  const workMidSleep = 4.25;
  return Math.abs(msf - workMidSleep);
}

export function ChronotypeSpectrum() {
  const [selected, setSelected] = useState("average");
  const [hoverMSF, setHoverMSF] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const profile = PROFILES[selected];

  // Build the bell curve path
  const curveSteps = 200;
  const curvePts: string[] = [];
  for (let i = 0; i <= curveSteps; i++) {
    const msf = MSF_MIN + (i / curveSteps) * (MSF_MAX - MSF_MIN);
    const x = msfToX(msf);
    const y = valToY(gaussian(msf, MSF_MEAN, MSF_SD));
    curvePts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const curvePath = curvePts.join(" ");
  const areaPath = curvePath + ` L${msfToX(MSF_MAX)},${valToY(0)} L${msfToX(MSF_MIN)},${valToY(0)} Z`;

  // Selected marker position
  const markerX = msfToX(profile.msf);
  const markerY = valToY(gaussian(profile.msf, MSF_MEAN, MSF_SD));

  const jetLag = socialJetLag(profile.msf);

  // Handle SVG hover to show MSF
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const svgX = (x / rect.width) * W;
    const msf = MSF_MIN + ((svgX - 40) / (W - 80)) * (MSF_MAX - MSF_MIN);
    if (msf >= MSF_MIN && msf <= MSF_MAX) {
      setHoverMSF(msf);
    } else {
      setHoverMSF(null);
    }
  }, []);

  return (
    <div className="space-y-3">
      {/* Type selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {PROFILE_KEYS.map((key) => {
          const p = PROFILES[key];
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className="text-[10px] px-2.5 py-1.5 rounded-md font-medium transition-all duration-200"
              style={{
                fontFamily: "var(--font-mono)",
                border: `1px solid ${selected === key ? p.color : "var(--site-border)"}`,
                backgroundColor: selected === key ? p.color + "18" : "transparent",
                color: selected === key ? p.color : "var(--site-text-secondary)",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Graph */}
      <div className="rounded overflow-hidden" style={{ border: "1px solid var(--site-border)" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: "block" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverMSF(null)}
        >
          <defs>
            <linearGradient id="grad-chrono" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#EF9F27" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#60a5ff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#db7093" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* X-axis labels */}
          {[1, 2, 3, 4, 5, 6, 7].map((h) => (
            <text
              key={h}
              x={msfToX(h)}
              y={H - 6}
              textAnchor="middle"
              fontSize="9"
              fill="var(--site-text-dim)"
              fontFamily="var(--font-mono)"
            >
              {h === 1 ? "1am" : h === 4 ? "4am" : h === 7 ? "7am" : `${h}`}
            </text>
          ))}
          <text x={W / 2} y={H - 16} textAnchor="middle" fontSize="9" fill="var(--site-text-muted)" fontFamily="var(--font-mono)">
            mid-sleep on free days
          </text>

          {/* Bell curve area */}
          <motion.path
            d={areaPath}
            fill="url(#grad-chrono)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />

          {/* Bell curve line */}
          <motion.path
            d={curvePath}
            fill="none"
            stroke="var(--site-text-secondary)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />

          {/* Label zones at top */}
          <text x={msfToX(1.5)} y={20} textAnchor="middle" fontSize="8" fill="#EF9F27" fontFamily="var(--font-mono)">lark</text>
          <text x={msfToX(4)} y={20} textAnchor="middle" fontSize="8" fill="#60a5ff" fontFamily="var(--font-mono)">average</text>
          <text x={msfToX(6.5)} y={20} textAnchor="middle" fontSize="8" fill="#db7093" fontFamily="var(--font-mono)">owl</text>

          {/* Hover line */}
          {hoverMSF !== null && (
            <>
              <line
                x1={msfToX(hoverMSF)}
                y1={CURVE_Y_START}
                x2={msfToX(hoverMSF)}
                y2={valToY(0)}
                stroke="var(--site-text-dim)"
                strokeWidth="0.8"
                strokeDasharray="2,3"
              />
              <text
                x={msfToX(hoverMSF)}
                y={CURVE_Y_START - 4}
                textAnchor="middle"
                fontSize="9"
                fill="var(--site-text)"
                fontFamily="var(--font-mono)"
              >
                {Math.floor(hoverMSF)}:{String(Math.round((hoverMSF % 1) * 60)).padStart(2, "0")}am
              </text>
            </>
          )}

          {/* Selected marker */}
          <motion.line
            x1={markerX}
            y1={markerY}
            x2={markerX}
            y2={valToY(0)}
            stroke={profile.color}
            strokeWidth="1.5"
            strokeDasharray="3,3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 0.3 }}
          />
          <motion.circle
            cx={markerX}
            cy={markerY}
            r="5"
            fill={profile.color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
          <circle cx={markerX} cy={markerY} r="9" fill="none" stroke={profile.color} strokeWidth="0.8" opacity="0.4">
            <animate attributeName="r" values="7;12;7" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
          </circle>

          {/* Percentage label */}
          <motion.text
            x={markerX}
            y={markerY - 12}
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill={profile.color}
            fontFamily="var(--font-mono)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {(gaussian(profile.msf, MSF_MEAN, MSF_SD) * 100).toFixed(0)}th %ile
          </motion.text>
        </svg>
      </div>

      {/* Profile cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          className="grid grid-cols-3 gap-2 text-[10px]"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          <ProfileCard label="DLMO" value={profile.dlmo} color={profile.color} detail="melatonin onset" />
          <ProfileCard label="sleep window" value={profile.sleepWindow} color={profile.color} detail="natural timing" />
          <ProfileCard
            label="social jet lag"
            value={jetLag < 0.25 ? "minimal" : `${jetLag.toFixed(1)}h`}
            color={jetLag > 1.5 ? "#ff4444" : jetLag > 0.75 ? "#EF9F27" : "#5dcaa5"}
            detail="vs 8am schedule"
          />
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[9px] uppercase tracking-wider flex-wrap" style={{ color: "var(--site-text-muted)" }}>
        <span className="flex items-center gap-1.5">
          <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="var(--site-text-secondary)" strokeWidth="1.5" /></svg>
          population distribution
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: profile.color }} />
          <span style={{ color: profile.color }}>selected type</span>
        </span>
      </div>

      {/* Info */}
      <ChronotypeInfo />
    </div>
  );
}

function ProfileCard({ label, value, color, detail }: { label: string; value: string; color: string; detail: string }) {
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

function ChronotypeInfo() {
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
        <span>what is a chronotype?</span>
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
            Your <strong style={{ color: "var(--site-text)" }}>chronotype</strong> is your body&apos;s preferred sleep-wake timing, measured by when your mid-sleep falls on free days (no alarm).
          </p>
          <p>
            It&apos;s largely genetic (the PER3 gene is a major driver) and shifts across your life: teenagers skew owl, then drift earlier with age. Only ~25% of people are true larks or owls.
          </p>
          <p>
            <strong style={{ color: "var(--site-text)" }}>Social jet lag</strong> is the mismatch between your biological clock and your social schedule. An extreme owl forced to wake at 7am experiences the equivalent of flying 3-4 time zones, every single day.
          </p>
          <p>
            <strong style={{ color: "var(--site-text)" }}>DLMO</strong> (dim-light melatonin onset) is the gold-standard phase marker, the moment your brain starts secreting melatonin under dim conditions. It reliably predicts your natural sleep onset.
          </p>
          <div className="pt-1" style={{ borderTop: "1px solid var(--site-border)", color: "var(--site-text-dim)", fontSize: "9px" }}>
            Roenneberg et al., Sleep Med Rev 2007 &middot; MCTQ questionnaire
          </div>
        </div>
      )}
    </div>
  );
}
