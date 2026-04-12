"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

// ─── Sleep Debt Accumulator ─────────────────────────────────────────────────
//
// Models how partial sleep loss compounds across a week.
// Based on Van Dongen et al. (2003): chronic restriction of sleep to 6h/night
// for 14 days produces cognitive impairment equivalent to ~2 nights of total
// sleep deprivation. Sleep debt is roughly additive and does not fully
// discharge with a single recovery night.
//
// The "weekend reset" is a myth — you recover some, but the deficit lingers.

const RECOMMENDED = 8; // recommended hours per night

interface Scenario {
  label: string;
  description: string;
  nights: number[]; // hours slept each night, Mon–Sun
  color: string;
}

const SCENARIOS: Scenario[] = [
  {
    label: "Healthy",
    description: "8h every night",
    nights: [8, 8, 8, 8, 8, 8, 8],
    color: "#5dcaa5",
  },
  {
    label: "Mild restriction",
    description: "7h weeknights, 8h weekends",
    nights: [7, 7, 7, 7, 7, 8, 8],
    color: "#EF9F27",
  },
  {
    label: "College student",
    description: "6h weeknights, 10h weekends",
    nights: [6, 6, 6, 6, 6, 10, 10],
    color: "#db7093",
  },
  {
    label: "Severe restriction",
    description: "5h every night",
    nights: [5, 5, 5, 5, 5, 5, 5],
    color: "#ff4444",
  },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Cumulative debt calculation
// Each night: debt += max(0, recommended - actual)
// Weekend "recovery" modeled: excess sleep recovers ~60% of its value
// (you can't bank sleep efficiently — Kitamura et al., 2016)
function computeDebt(nights: number[]): { daily: number[]; cumulative: number[] } {
  const daily: number[] = [];
  const cumulative: number[] = [];
  let total = 0;

  for (let i = 0; i < nights.length; i++) {
    const diff = RECOMMENDED - nights[i];
    if (diff > 0) {
      // Under-slept: full debt added
      daily.push(diff);
      total += diff;
    } else {
      // Over-slept: partial recovery (60% efficiency)
      const recovery = Math.min(total, Math.abs(diff) * 0.6);
      daily.push(-recovery);
      total -= recovery;
    }
    cumulative.push(Math.max(0, total));
  }

  return { daily, cumulative };
}

// Equivalent impairment mapping (Van Dongen et al.)
function debtToBAC(debtHours: number): string {
  // Rough: 17h awake ≈ 0.05% BAC, 24h ≈ 0.10% BAC
  // Cumulative debt of ~16h ≈ one all-nighter
  if (debtHours < 2) return "minimal";
  if (debtHours < 5) return "~0.02% BAC equivalent";
  if (debtHours < 10) return "~0.05% BAC equivalent";
  if (debtHours < 16) return "~0.08% BAC equivalent";
  return "~0.10% BAC (legally impaired)";
}

// ─── Chart constants ─────────────────────────────────────────────────────────

const CHART_W = 480;
const CHART_H = 200;
const BAR_W = 44;
const GAP = 14;
const LEFT_PAD = 36;
const TOP_PAD = 20;
const BOTTOM_PAD = 30;
const USABLE_H = CHART_H - TOP_PAD - BOTTOM_PAD;

// Max debt for y-axis scaling (hours)
const MAX_DEBT_DISPLAY = 22;
const MAX_SLEEP_DISPLAY = 11;

function debtToY(debt: number): number {
  return TOP_PAD + (1 - debt / MAX_DEBT_DISPLAY) * USABLE_H;
}

function sleepToBarH(hours: number): number {
  return (hours / MAX_SLEEP_DISPLAY) * (USABLE_H * 0.55);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SleepDebt() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const scenario = SCENARIOS[activeIdx];
  const { daily, cumulative } = computeDebt(scenario.nights);
  const totalDebt = cumulative[cumulative.length - 1];

  // Build cumulative line path
  const linePoints = cumulative.map((d, i) => {
    const x = LEFT_PAD + i * (BAR_W + GAP) + BAR_W / 2;
    const y = debtToY(d);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = "M " + linePoints.join(" L ");

  // Area under cumulative line
  const firstX = LEFT_PAD + BAR_W / 2;
  const lastX = LEFT_PAD + 6 * (BAR_W + GAP) + BAR_W / 2;
  const baseY = debtToY(0);
  const areaPath = linePath + ` L ${lastX},${baseY} L ${firstX},${baseY} Z`;

  return (
    <div className="space-y-3">
      {/* Scenario selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {SCENARIOS.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className="text-[10px] px-3 py-1.5 rounded-md font-medium transition-all duration-200"
            style={{
              fontFamily: "var(--font-mono)",
              border: `1px solid ${activeIdx === i ? s.color : "var(--site-border)"}`,
              backgroundColor: activeIdx === i ? s.color + "18" : "transparent",
              color: activeIdx === i ? s.color : "var(--site-text-secondary)",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <AnimatePresence mode="wait">
        <motion.p
          key={activeIdx}
          className="text-[11px]"
          style={{ color: "var(--site-text-muted)", fontFamily: "var(--font-mono)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {scenario.description}
        </motion.p>
      </AnimatePresence>

      {/* Chart */}
      <div className="rounded overflow-hidden" style={{ border: "1px solid var(--site-border)" }}>
        <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" style={{ display: "block" }}>
          <defs>
            <linearGradient id={`debt-grad-${activeIdx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={scenario.color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={scenario.color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 5, 10, 15, 20].map((v) => (
            <g key={v}>
              <line
                x1={LEFT_PAD - 4}
                y1={debtToY(v)}
                x2={CHART_W}
                y2={debtToY(v)}
                stroke="var(--site-border)"
                strokeWidth="0.5"
                strokeDasharray={v === 0 ? "none" : "4,6"}
              />
              <text
                x={LEFT_PAD - 8}
                y={debtToY(v) + 3}
                textAnchor="end"
                fontSize="8"
                fill="var(--site-text-dim)"
                fontFamily="var(--font-mono)"
              >
                {v}h
              </text>
            </g>
          ))}

          {/* "One all-nighter" reference line at ~16h */}
          <line
            x1={LEFT_PAD}
            y1={debtToY(16)}
            x2={CHART_W - 10}
            y2={debtToY(16)}
            stroke="#ff4444"
            strokeWidth="0.8"
            strokeDasharray="3,4"
            opacity="0.4"
          />
          <text
            x={CHART_W - 12}
            y={debtToY(16) - 4}
            textAnchor="end"
            fontSize="8"
            fill="#ff4444"
            fontFamily="var(--font-mono)"
            opacity="0.6"
          >
            = one all-nighter
          </text>

          {/* Sleep bars (hours slept each night) */}
          <AnimatePresence mode="wait">
            {scenario.nights.map((hours, i) => {
              const x = LEFT_PAD + i * (BAR_W + GAP);
              const barH = sleepToBarH(hours);
              const barY = debtToY(0) - barH;
              const isHovered = hoveredDay === i;
              const isUnderslept = hours < RECOMMENDED;

              return (
                <motion.g
                  key={`${activeIdx}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  onMouseEnter={() => setHoveredDay(i)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{ cursor: "default" }}
                >
                  {/* Bar */}
                  <motion.rect
                    x={x}
                    y={barY}
                    width={BAR_W}
                    rx={3}
                    fill={isUnderslept ? scenario.color + "30" : "#5dcaa520"}
                    stroke={isUnderslept ? scenario.color + "60" : "#5dcaa540"}
                    strokeWidth={isHovered ? 1.5 : 0.8}
                    initial={{ height: 0, y: debtToY(0) }}
                    animate={{ height: barH, y: barY }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                  />
                  {/* Hours label inside bar */}
                  <motion.text
                    x={x + BAR_W / 2}
                    y={barY + barH / 2 + 3}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="var(--font-mono)"
                    fill={isUnderslept ? scenario.color : "#5dcaa5"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.08 + 0.4 }}
                  >
                    {hours}h
                  </motion.text>
                  {/* Recommended line on each bar */}
                  {isUnderslept && (
                    <line
                      x1={x + 4}
                      y1={debtToY(0) - sleepToBarH(RECOMMENDED)}
                      x2={x + BAR_W - 4}
                      y2={debtToY(0) - sleepToBarH(RECOMMENDED)}
                      stroke="var(--site-text-dim)"
                      strokeWidth="0.8"
                      strokeDasharray="2,2"
                      opacity="0.5"
                    />
                  )}
                  {/* Day label */}
                  <text
                    x={x + BAR_W / 2}
                    y={CHART_H - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fill={isHovered ? "var(--site-text)" : "var(--site-text-muted)"}
                    fontFamily="var(--font-mono)"
                  >
                    {DAYS[i]}
                  </text>
                </motion.g>
              );
            })}
          </AnimatePresence>

          {/* Cumulative debt area */}
          <motion.path
            d={areaPath}
            fill={`url(#debt-grad-${activeIdx})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          />

          {/* Cumulative debt line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke={scenario.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
          />

          {/* Cumulative debt dots */}
          {cumulative.map((d, i) => {
            const x = LEFT_PAD + i * (BAR_W + GAP) + BAR_W / 2;
            const y = debtToY(d);
            return (
              <motion.circle
                key={`${activeIdx}-dot-${i}`}
                cx={x}
                cy={y}
                r={hoveredDay === i ? 5 : 3.5}
                fill={scenario.color}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
              />
            );
          })}

          {/* Hover tooltip */}
          {hoveredDay !== null && (() => {
            const d = hoveredDay;
            const x = LEFT_PAD + d * (BAR_W + GAP) + BAR_W / 2;
            const y = debtToY(cumulative[d]);
            const slept = scenario.nights[d];
            const debtChange = daily[d];
            const ttY = Math.max(y - 32, 8);
            return (
              <g>
                <rect
                  x={x - 48}
                  y={ttY}
                  width={96}
                  height={24}
                  rx={4}
                  fill="var(--site-bg-card)"
                  stroke="var(--site-border)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={ttY + 10}
                  textAnchor="middle"
                  fontSize="8"
                  fill="var(--site-text)"
                  fontFamily="var(--font-mono)"
                >
                  {debtChange > 0 ? `+${debtChange.toFixed(1)}h debt` : debtChange < 0 ? `${debtChange.toFixed(1)}h recovered` : "no change"}
                </text>
                <text
                  x={x}
                  y={ttY + 20}
                  textAnchor="middle"
                  fontSize="8"
                  fill="var(--site-text-muted)"
                  fontFamily="var(--font-mono)"
                >
                  total: {cumulative[d].toFixed(1)}h debt
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Summary stats */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIdx}
          className="grid grid-cols-3 gap-2 text-[10px]"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
        >
          <StatCard
            label="weekly debt"
            value={`${totalDebt.toFixed(1)}h`}
            color={scenario.color}
            detail={totalDebt > 0 ? "accumulated" : "none"}
          />
          <StatCard
            label="avg/night"
            value={`${(scenario.nights.reduce((a, b) => a + b, 0) / 7).toFixed(1)}h`}
            color={scenario.color}
            detail={`vs ${RECOMMENDED}h recommended`}
          />
          <StatCard
            label="impairment"
            value={debtToBAC(totalDebt)}
            color={totalDebt > 10 ? "#ff4444" : scenario.color}
            detail="cognitive equiv."
          />
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center gap-5 text-[9px] uppercase tracking-wider flex-wrap" style={{ color: "var(--site-text-muted)" }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm" style={{ backgroundColor: scenario.color + "30", border: `1px solid ${scenario.color}60` }} />
          hours slept
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="20" height="8" style={{ flexShrink: 0 }}>
            <line x1="0" y1="4" x2="20" y2="4" stroke={scenario.color} strokeWidth="2" />
          </svg>
          <span style={{ color: scenario.color }}>cumulative debt</span>
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="14" height="8" style={{ flexShrink: 0 }}>
            <line x1="0" y1="4" x2="14" y2="4" stroke="var(--site-text-dim)" strokeWidth="0.8" strokeDasharray="2,2" />
          </svg>
          8h target
        </span>
      </div>

      {/* Info */}
      <SleepDebtInfo />
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
      <span className="text-sm font-bold tabular-nums" style={{ color, fontFamily: "var(--font-mono)" }}>
        {value}
      </span>
      <span className="text-[8px]" style={{ color: "var(--site-text-dim)" }}>{detail}</span>
    </div>
  );
}

function SleepDebtInfo() {
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
        <span>the weekend reset myth</span>
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
            Sleep debt is roughly <strong style={{ color: "var(--site-text)" }}>additive</strong>. Missing 2 hours a night for 5 days builds 10 hours of debt &mdash; cognitively similar to staying awake for 24+ hours straight.
          </p>
          <p>
            Sleeping in on weekends helps, but recovery is only about <strong style={{ color: "var(--site-text)" }}>60% efficient</strong>. Sleeping 10 hours (2 extra) recovers ~1.2 hours of debt, not 2. The &ldquo;college student&rdquo; pattern shows this: despite weekend catch-up, debt never fully clears.
          </p>
          <p>
            The impairment estimate maps cumulative debt to blood alcohol equivalents. After a week of 6h nights, your reaction time resembles someone at the legal limit.
          </p>
          <div className="pt-1" style={{ borderTop: "1px solid var(--site-border)", color: "var(--site-text-dim)", fontSize: "9px" }}>
            Van Dongen et al., Sleep 2003 &middot; Kitamura et al., Sci Rep 2016
          </div>
        </div>
      )}
    </div>
  );
}
