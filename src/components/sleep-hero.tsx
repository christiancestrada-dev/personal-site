"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CircadianClock } from "@/components/circadian-clock";

// ─── Annotated clock with arrow pointing to phase text ──────────────────────
function AnnotatedClock() {
  return (
    <div className="relative">
      {/* Label + arrow from the left */}
      <div
        className="absolute text-xs italic whitespace-nowrap"
        style={{
          color: "#ff6b60",
          right: "100%",
          top: "50%",
          transform: "translateY(-50%)",
          marginRight: 8,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          my live sleep phase!
        </motion.span>
        <motion.svg
          width="28" height="16" viewBox="0 0 28 16" fill="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3, duration: 0.5 }}
        >
          <motion.path
            d="M2 8 C10 8, 18 6, 24 8"
            stroke="#ff6b60" strokeWidth="1.5" fill="none" strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 2.5, duration: 0.6, ease: "easeOut" }}
          />
          <motion.path
            d="M21 4 L25 8 L21 12"
            stroke="#ff6b60" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 3, duration: 0.3 }}
          />
        </motion.svg>
      </div>
      <CircadianClock />
    </div>
  );
}

// ─── Lunar phase calculation ─────────────────────────────────────────────────
function getLunarPhase(): { name: string; emoji: string; age: number } {
  const now = new Date();
  const known = new Date(2000, 0, 6, 18, 14, 0).getTime();
  const cycle = 29.53058770576;
  const days = (now.getTime() - known) / (1000 * 60 * 60 * 24);
  const age = ((days % cycle) + cycle) % cycle;

  if (age < 1.85) return { name: "New Moon", emoji: "\u{1F311}", age };
  if (age < 5.53) return { name: "Waxing Crescent", emoji: "\u{1F312}", age };
  if (age < 9.22) return { name: "First Quarter", emoji: "\u{1F313}", age };
  if (age < 12.91) return { name: "Waxing Gibbous", emoji: "\u{1F314}", age };
  if (age < 16.61) return { name: "Full Moon", emoji: "\u{1F315}", age };
  if (age < 20.30) return { name: "Waning Gibbous", emoji: "\u{1F316}", age };
  if (age < 23.99) return { name: "Last Quarter", emoji: "\u{1F317}", age };
  if (age < 27.68) return { name: "Waning Crescent", emoji: "\u{1F318}", age };
  return { name: "New Moon", emoji: "\u{1F311}", age };
}

// ─── Stars ───────────────────────────────────────────────────────────────────
const STARS = [
  { x:  5, y: 12, r: 1.1, d: 0.0 }, { x: 12, y:  5, r: 0.8, d: 0.6 },
  { x: 22, y: 18, r: 1.3, d: 1.2 }, { x: 31, y:  7, r: 0.9, d: 0.3 },
  { x: 40, y: 22, r: 1.2, d: 1.9 }, { x: 48, y:  3, r: 1.5, d: 0.8 },
  { x: 56, y: 14, r: 0.7, d: 0.1 }, { x: 64, y: 24, r: 1.0, d: 2.2 },
  { x: 72, y:  8, r: 1.4, d: 0.5 }, { x: 81, y: 19, r: 0.8, d: 1.4 },
  { x: 88, y:  9, r: 1.1, d: 1.0 }, { x: 94, y: 26, r: 0.9, d: 0.4 },
  { x: 17, y: 28, r: 0.7, d: 1.1 }, { x: 46, y: 27, r: 1.0, d: 2.5 },
  { x: 60, y: 30, r: 0.8, d: 0.7 }, { x: 77, y: 28, r: 1.2, d: 1.6 },
  { x:  3, y: 20, r: 0.6, d: 0.9 }, { x: 93, y: 13, r: 1.0, d: 1.3 },
];

// ─── Circadian color ─────────────────────────────────────────────────────────
function getCircadianColor(): string {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const t = h + m / 60;
  if (t >= 22 || t < 1)  return "#525252";
  if (t >= 1  && t < 3)  return "#60a5ff";
  if (t >= 3  && t < 5)  return "#9b8fce";
  if (t >= 5  && t < 7)  return "#e89b5a";
  if (t >= 7  && t < 10) return "#d4d4d4";
  if (t >= 10 && t < 13) return "#d4d4d4";
  if (t >= 13 && t < 15) return "#7a9fc4";
  if (t >= 15 && t < 18) return "#d4d4d4";
  if (t >= 18 && t < 20) return "#7a9fc4";
  return "#525252";
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount;
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`;
}

function withOpacity(hex: string, opacity: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// ─── Sheep ────────────────────────────────────────────────────────────────────
function SheepSVG({ num, golden = false }: { num: number; golden?: boolean }) {
  const bodyFill = golden ? "#4a3a10" : "#db7093";
  const bodyHighlight = golden ? "#7a6a20" : "#e890a8";
  const headFill = golden ? "#7a6a20" : "#1a1a1a";
  const counterFill = golden ? "#fbbf24" : "#f0b0c0";
  const eyeFill = golden ? "#fbbf24" : "#ffffff";

  return (
    <svg viewBox="-38 -52 80 72" width="72" height="65" aria-hidden="true">
      {/* Astronaut glow */}
      <circle cx="-2" cy="-5" r="34" fill="rgba(255,255,255,0.12)">
        <animate attributeName="opacity" values="0.06;0.16;0.06" dur="3s" repeatCount="indefinite" />
      </circle>
      {golden && (
        <circle cx="-2" cy="-5" r="32" fill="#fbbf24" opacity="0.08">
          <animate attributeName="opacity" values="0.05;0.12;0.05" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      {/* Body - layered fluffy puffs */}
      <circle cx="-2"  cy=" 4" r="20" fill={bodyFill} />
      <circle cx="-16" cy="-4" r="14" fill={bodyFill} />
      <circle cx=" 10" cy="-6" r="15" fill={bodyFill} />
      <circle cx="-6"  cy="-14" r="12" fill={bodyFill} />
      <circle cx=" 4"  cy=" 4" r="14" fill={bodyFill} />
      {/* Highlight layer for depth */}
      <circle cx="-2"  cy=" 4" r="20" fill={bodyHighlight} opacity="0.55" />
      <circle cx=" 8"  cy="-8" r="12" fill={bodyHighlight} opacity="0.45" />
      <circle cx="-10" cy="-10" r="10" fill={bodyHighlight} opacity="0.35" />
      {/* Head (black, faces left) */}
      <circle cx="-28" cy="2" r="11" fill={headFill} />
      <circle cx="-26" cy="-1" r="6" fill="rgba(60,60,60,0.3)" />
      {/* Eye */}
      <circle cx="-32" cy="0" r="2"  fill={eyeFill} opacity="0.9" />
      <circle cx="-32.5" cy="-0.5" r="0.8" fill="#000000" />
      {/* Ear */}
      <ellipse cx="-24" cy="-10" rx="4" ry="6" fill={headFill} transform="rotate(15 -24 -10)" />
      {/* Counter */}
      <text
        x="-2" y="-36"
        textAnchor="middle"
        fill={counterFill}
        fontSize="12"
        fontFamily="var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
        fontWeight="bold"
      >
        {golden ? "\u2605" : num}
      </text>
    </svg>
  );
}

// ─── Fence ────────────────────────────────────────────────────────────────────
function Fence() {
  const posts = Array.from({ length: 12 }, (_, i) => i * 9.5 + 0.5);
  return (
    <svg viewBox="0 0 100 36" preserveAspectRatio="none" width="100%" height="36" aria-hidden="true">
      <rect x="0" y="10" width="100" height="2.5" rx="1" fill="var(--site-border)" />
      <rect x="0" y="22" width="100" height="2.5" rx="1" fill="var(--site-border)" />
      {posts.map((x) => (
        <rect key={x} x={x} y="4" width="1.5" height="30" rx="0.7" fill="var(--site-border)" />
      ))}
    </svg>
  );
}

// ─── Sheep spawning ───────────────────────────────────────────────────────────
interface SheepData {
  id: number;
  num: number;
  golden?: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  rotation: number;
  duration: number;
  scale: number;
  phaseColor: string;
}
const FLOAT_MIN = 10;
const FLOAT_MAX = 18;
const SPAWN_INTERVAL = 1200;

function randomTrajectory() {
  // Spawn from left or right edge, travel across
  const fromLeft = Math.random() > 0.5;
  const startX = fromLeft ? -12 : 112;
  const endX = fromLeft ? 112 : -12;
  // Use % of container height so sheep appear everywhere on the page
  const startY = Math.random() * 95;
  const endY = startY + (Math.random() - 0.5) * 20;

  return { startX, startY, endX, endY };
}

// ─── Floating Sheep Layer (full-page) ────────────────────────────────────────
const GOLDEN_THRESHOLD = 10;

export function FloatingSheep() {
  const [sheep,      setSheep]     = useState<SheepData[]>([]);
  const [poppedIds,  setPoppedIds] = useState<Set<number>>(new Set());
  const [popCount,   setPopCount]  = useState(0);
  const [goldenUnlocked, setGoldenUnlocked] = useState(false);
  const [showGoldenMsg, setShowGoldenMsg] = useState(false);
  const counterRef = useRef(0);
  const goldenRef = useRef(false);

  const popSheep = (id: number) => {
    setPoppedIds(prev => new Set(prev).add(id));
    setPopCount(prev => {
      const next = prev + 1;
      if (next >= GOLDEN_THRESHOLD && !goldenUnlocked) {
        setGoldenUnlocked(true);
        goldenRef.current = true;
        setShowGoldenMsg(true);
        setTimeout(() => setShowGoldenMsg(false), 3000);
      }
      return next;
    });
    setTimeout(() => {
      setSheep(prev => prev.filter(s => s.id !== id));
      setPoppedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 380);
  };

  useEffect(() => {
    const spawn = () => {
      counterRef.current += 1;
      const id  = Date.now() + Math.random();
      const num = counterRef.current;
      const golden = goldenRef.current && Math.random() < 0.2;
      const traj = randomTrajectory();
      const duration = FLOAT_MIN + Math.random() * (FLOAT_MAX - FLOAT_MIN);
      const rotation = (Math.random() - 0.5) * 720;
      const scale = 1;
      const phaseColor = getCircadianColor();

      setSheep(prev => [...prev, {
        id, num, golden,
        ...traj, rotation, duration, scale, phaseColor,
      }]);
      setTimeout(() => {
        setSheep(prev => prev.filter(s => s.id !== id));
      }, duration * 1000 + 800);
    };

    spawn();
    setTimeout(spawn, 300);
    const interval = setInterval(spawn, SPAWN_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full pointer-events-none" style={{ zIndex: 2, bottom: 0, overflow: "hidden" }}>
      {/* ── Sheep pop counter ── */}
      {popCount > 0 && (
        <div
          className="absolute top-4 left-4 z-30 text-[10px] px-2 py-1 rounded pointer-events-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid var(--site-border)", color: "var(--site-text-muted)" }}
        >
          {popCount} popped{!goldenUnlocked && ` · ${GOLDEN_THRESHOLD - popCount} to go`}
        </div>
      )}

      {/* ── Golden unlock message ── */}
      <AnimatePresence>
        {showGoldenMsg && (
          <motion.div
            className="absolute top-16 left-1/2 z-50 text-xs px-4 py-2 rounded-md"
            style={{ backgroundColor: "rgba(251,191,36,0.15)", border: "1px solid #fbbf24", color: "#fbbf24", transform: "translateX(-50%)" }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            golden sheep unlocked!
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sheep ── */}
      {sheep.map((s) => {
        const isPopped = poppedIds.has(s.id);
        return (
          <motion.div
            key={s.id}
            className="absolute cursor-pointer pointer-events-auto"
            style={{ left: 0, top: `${s.startY}%` }}
            initial={{
              x: `${s.startX}vw`,
              rotate: 0,
              opacity: 0,
            }}
            animate={{
              x: `${s.endX}vw`,
              y: `${(s.endY - s.startY)}vh`,
              rotate: s.rotation,
              opacity: [0, 1, 1, 1, 0],
            }}
            transition={{
              duration: s.duration,
              ease: "linear",
              opacity: { times: [0, 0.05, 0.5, 0.9, 1], duration: s.duration },
            }}
            onClick={() => popSheep(s.id)}
          >
            <motion.div
              animate={isPopped ? { scale: [1, 1.9, 0], opacity: [1, 1, 0] } : {}}
              transition={isPopped ? { duration: 0.35, ease: "easeOut" } : {}}
            >
              <SheepSVG num={s.num} golden={s.golden} />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export function SleepHero() {
  const [showMoonTip, setShowMoonTip] = useState(false);
  const [showQuoteInfo, setShowQuoteInfo] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="relative w-full"
      style={{
        minHeight: "70vh",
        background: "var(--site-hero-bg, #000000)",
      }}
    >
      {/* ── Stars (dark mode) ── */}
      {isDark && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          {STARS.map((s, i) => (
            <motion.circle
              key={i}
              cx={`${s.x}%`} cy={`${s.y}%`} r={s.r}
              fill="#d4d4d4"
              initial={{ opacity: 0.15 }}
              animate={{ opacity: [0.15, 0.8, 0.15] }}
              transition={{ duration: 3 + s.d, repeat: Infinity, delay: s.d, ease: "easeInOut" }}
            />
          ))}
        </svg>
      )}

      {isDark ? (
        /* ── Moon (dark mode) ── */
        <div
          className="absolute z-30 cursor-pointer"
          style={{ right: "8%", top: "5%" }}
          onClick={() => setShowMoonTip(prev => !prev)}
        >
          <svg width="52" height="52" viewBox="0 0 52 52" aria-label="Moon">
            <circle cx="26" cy="26" r="26" fill="#cfc4a8" opacity="0.12" />
            <circle cx="30" cy="24" r="21" fill="#000000" />
          </svg>
          <AnimatePresence>
            {showMoonTip && (
              <motion.div
                className="absolute top-full mt-2 right-0 px-3 py-2 rounded-md text-[10px] whitespace-nowrap z-50"
                style={{ backgroundColor: "rgba(0,0,0,0.95)", border: "1px solid var(--site-border)", color: "var(--site-text)" }}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                {(() => {
                  const phase = getLunarPhase();
                  return <span>{phase.emoji} {phase.name} · day {phase.age.toFixed(1)}</span>;
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* ── Sun (light mode) ── */
        <div className="absolute z-20" style={{ right: "8%", top: "5%" }}>
          <motion.svg width="64" height="64" viewBox="0 0 64 64" aria-label="Sun"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          >
            {/* Rays */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.line
                key={i}
                x1="32" y1="4" x2="32" y2="10"
                stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"
                style={{ transformOrigin: "32px 32px", transform: `rotate(${i * 30}deg)` }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
            {/* Core */}
            <circle cx="32" cy="32" r="14" fill="#fbbf24" />
            <circle cx="32" cy="32" r="18" fill="#fbbf24" opacity="0.2" />
          </motion.svg>
        </div>
      )}


      {/* ── Greeting — top half ── */}
      <div
        className="absolute left-0 right-0 flex flex-col justify-center z-10"
        style={{ top: 0, height: "50%", paddingLeft: "max(2rem, calc((100% - 72rem) / 2 + 2rem))" }}
      >
        <div className="text-left space-y-4" style={{ maxWidth: "clamp(300px, 70vw, 680px)" }}>
          <h1
            className="font-bold whitespace-nowrap"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", lineHeight: 1.1, letterSpacing: "-0.03em", color: "var(--site-text-bright)" }}
          >
            {(() => {
              const hour = new Date().getHours();
              if (hour >= 5 && hour < 12) return "Good morning";
              if (hour >= 12 && hour < 17) return "Good afternoon";
              return "Good evening";
            })()}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--site-text-secondary)" }}>
            My name is Christian. Welcome to christian-estrada.com. Feel free to use the hotkey numbers to go between tabs on the lefthand side.
          </p>
        </div>
      </div>

      {/* ── Fence at 50% mark ── */}
      <div className="absolute left-0 right-0 z-10" style={{ top: "50%" }}>
        <div style={{ height: 1, background: "var(--site-border)" }} />
        <Fence />
      </div>

      {/* ── Quote — below fence ── */}
      <div
        className="absolute left-0 right-0 flex flex-col justify-center z-10"
        style={{ top: "54%", bottom: "5%", paddingLeft: "max(2rem, calc((100% - 72rem) / 2 + 2rem))" }}
      >
        <div style={{ maxWidth: "clamp(280px, 55vw, 580px)" }} className="space-y-4">
          <p style={{ fontSize: "1.1rem", lineHeight: 1.8 }}>
            <span style={{ color: "var(--site-text-bright)", fontWeight: 700 }}>
              Don&apos;t count <span style={{ color: "#db7093" }}>sheep</span>!
            </span>{" "}
            <span style={{ color: "var(--site-text)", fontStyle: "italic" }}>
              It actually keeps you awake.
            </span>{" "}
            <button
              onClick={() => setShowQuoteInfo(prev => !prev)}
              className="inline-flex items-center justify-center rounded-full transition-colors"
              style={{
                width: 18,
                height: 18,
                fontSize: "10px",
                fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
                fontStyle: "normal",
                fontWeight: 600,
                backgroundColor: showQuoteInfo ? "var(--site-accent)" : "var(--site-nav-active)",
                color: showQuoteInfo ? "#fff" : "var(--site-text-muted)",
                border: `1px solid ${showQuoteInfo ? "var(--site-accent)" : "var(--site-border)"}`,
                verticalAlign: "middle",
                marginLeft: 4,
              }}
              aria-label="More info"
            >
              i
            </button>
          </p>
          <AnimatePresence>
            {showQuoteInfo && (
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p style={{ color: "var(--site-text-muted)", fontSize: "0.85rem", lineHeight: 1.75 }}>
                  Sleep only comes when you stop trying. The harder you reach for it,
                  the further it gets. The sheep just keep floating.
                </p>
                <p style={{ color: "var(--site-text-prose)", fontSize: "0.9rem", lineHeight: 1.75 }}>
                  So stop counting, and dream on!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
