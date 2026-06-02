"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";

// St. Hilaire et al. (2012) — Phase Response Curve to 1h bright white light
// [CT_hours_from_CBTmin, phase_shift_hours]
// CT0  = CBTmin  = Dead Zone 1 — delay→advance crossover (~4:30am)
// CT11 = Dead Zone 2 — advance→delay crossover (~3:30pm)
// CT4  = peak advance +1.20h  (~8:30am)
// CT18 = peak delay  −2.02h  (~10:30pm)
const ST_HILAIRE: [number, number][] = [
  [0,0],[1,.35],[2,.70],[3,.98],[4,1.20],[5,1.10],[6,.92],
  [7,.68],[8,.42],[9,.18],[10,.03],[11,0],[12,-.12],[13,-.38],
  [14,-.70],[15,-1.08],[16,-1.48],[17,-1.82],[18,-2.02],
  [19,-1.88],[20,-1.55],[21,-1.15],[22,-.72],[23,-.32],[24,0],
];

function mkSpline(pts: [number, number][]): (x: number) => number {
  const n = pts.length - 1;
  const h: number[] = [], a: number[] = [], l: number[] = [],
        mu: number[] = [], z: number[] = [], c: number[] = [],
        b: number[] = [], d: number[] = [];
  for (let i = 0; i < n; i++) h[i] = pts[i+1][0] - pts[i][0];
  for (let i = 1; i < n; i++)
    a[i] = (3/h[i])*(pts[i+1][1]-pts[i][1]) - (3/h[i-1])*(pts[i][1]-pts[i-1][1]);
  l[0]=1; mu[0]=0; z[0]=0;
  for (let i=1;i<n;i++){
    l[i]=2*(pts[i+1][0]-pts[i-1][0])-h[i-1]*mu[i-1];
    mu[i]=h[i]/l[i];
    z[i]=(a[i]-h[i-1]*z[i-1])/l[i];
  }
  l[n]=1; z[n]=0; c[n]=0;
  for (let j=n-1;j>=0;j--){
    c[j]=z[j]-mu[j]*c[j+1];
    b[j]=(pts[j+1][1]-pts[j][1])/h[j]-h[j]*(c[j+1]+2*c[j])/3;
    d[j]=(c[j+1]-c[j])/(3*h[j]);
  }
  return (x: number) => {
    if (x <= pts[0][0]) return pts[0][1];
    if (x >= pts[n][0]) return pts[n][1];
    let lo=0, hi=n-1;
    while(lo<hi){const m=(lo+hi)>>1; if(pts[m+1][0]<x) lo=m+1; else hi=m;}
    const dx=x-pts[lo][0];
    return pts[lo][1]+b[lo]*dx+c[lo]*dx*dx+d[lo]*dx*dx*dx;
  };
}

const _spline = mkSpline(ST_HILAIRE);

const CBT_MIN = 4.5;
const WAKE_H  = 7;
const SLEEP_H = 23;
const SUNRISE = 6;
const SUNSET  = 20;
const DZ2_H   = CBT_MIN + 11; // 15.5 = 3:30pm

function prcShift(h: number): number {
  const ct = ((h - CBT_MIN) % 24 + 24) % 24;
  return _spline(ct);
}

// ─── Layout ───────────────────────────────────────────────────────────────────
const W        = 900;
const H        = 260;
const LP       = 52;   // left pad (y-axis labels)
const RP       = 16;   // right pad
const UW       = W - LP - RP;
const SKY_TOP  = 4;
const SKY_H    = 20;
const SKY_BOT  = SKY_TOP + SKY_H;
const AXIS_Y   = 148;  // y of zero line
const SCALE    = 44;   // px per hour of phase shift

function hx(h: number) { return LP + (h / 24) * UW; }
function sy(s: number) { return AXIS_Y - s * SCALE; }

function buildPath(steps = 480): string {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const h = (i / steps) * 24;
    return `${i === 0 ? "M" : "L"}${hx(h).toFixed(1)},${sy(prcShift(h)).toFixed(1)}`;
  }).join(" ");
}

function buildArea(test: (v: number) => boolean, steps = 480): string {
  let d = "", seg: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const h = (i / steps) * 24;
    const v = prcShift(h);
    const x = hx(h), y = sy(v);
    if (test(v) && seg.length === 0) seg.push(`M${x.toFixed(1)},${AXIS_Y}`);
    if (seg.length > 0) seg.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
    if (seg.length > 0 && (!test(v) || i === steps)) {
      seg.push(`L${x.toFixed(1)},${AXIS_Y} Z`);
      d += seg.join(" ") + " ";
      seg = [];
    }
  }
  return d;
}

const PRC_PATH    = buildPath();
const ADV_AREA    = buildArea(v => v > 0.02);
const DEL_AREA    = buildArea(v => v < -0.02);

// Key x positions
const XCbt  = hx(CBT_MIN);
const XWake = hx(WAKE_H);
const XSlp  = hx(SLEEP_H);
const XRise = hx(SUNRISE);
const XSet  = hx(SUNSET);
const XDZ2  = hx(DZ2_H);
const XPAdv = hx(CBT_MIN + 4);
const XPDel = hx(CBT_MIN + 18);
const YPAdv = sy(1.20);
const YPDel = sy(-2.02);

const HOUR_LABELS = [
  { h: 0,   t: "12am" },
  { h: 3,   t: "3am"  },
  { h: 6,   t: "6am"  },
  { h: 9,   t: "9am"  },
  { h: 12,  t: "noon" },
  { h: 15,  t: "3pm"  },
  { h: 18,  t: "6pm"  },
  { h: 21,  t: "9pm"  },
  { h: 24,  t: "12am" },
];

// Stripe pattern spacing
const STRIPE_SZ = 8;

interface Pt { hour: number; shift: number; }

export function LightPRC() {
  const [time, setTime]   = useState<Date | null>(null);
  const [hover, setHover] = useState<Pt | null>(null);
  const [click, setClick] = useState<Pt | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const getPt = useCallback((e: React.MouseEvent<SVGSVGElement>): Pt | null => {
    if (!svgRef.current) return null;
    const r = svgRef.current.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * W;
    const h = ((sx - LP) / UW) * 24;
    if (h < 0 || h > 24) return null;
    return { hour: h, shift: prcShift(h) };
  }, []);

  const onMove  = useCallback((e: React.MouseEvent<SVGSVGElement>) => setHover(getPt(e)), [getPt]);
  const onClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => setClick(getPt(e)), [getPt]);

  if (!time) return null;

  const t     = time.getHours() + time.getMinutes() / 60;
  const shift = prcShift(t);
  const dotX  = hx(t);
  const dotY  = sy(shift);
  const active = click ?? hover;

  const zoneColor =
    Math.abs(shift) < 0.15 ? "var(--site-text-muted)" :
    shift > 0 ? "#5dcaa5" : "#db7093";

  const zoneLabel =
    Math.abs(shift) < 0.15 ? "dead zone" :
    shift > 0 ? `+${shift.toFixed(2)}h advance` :
    `${shift.toFixed(2)}h delay`;

  const advice =
    Math.abs(shift) < 0.15
      ? "light now has minimal clock-shifting effect"
      : shift > 0
        ? `light now would advance your clock by ~${shift.toFixed(1)}h`
        : `light now would delay your clock by ~${Math.abs(shift).toFixed(1)}h`;

  const isNight = t < SUNRISE || t > SUNSET;

  return (
    <div className="space-y-3">
      {/* Status row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded border"
          style={{ color: zoneColor, borderColor: zoneColor,
            backgroundColor: zoneColor === "var(--site-text-muted)" ? "transparent" : zoneColor + "18" }}>
          {zoneLabel}
        </span>
        <span className="text-xs" style={{ color: "var(--site-text-secondary)" }}>
          {advice}{isNight ? " · natural darkness" : ""}
        </span>
        <span className="text-xs ml-auto tabular-nums" style={{ color: "var(--site-text-muted)" }}>
          {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </span>
      </div>

      {/* Graph */}
      <div className="rounded overflow-hidden" style={{ border: "1px solid var(--site-border)" }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%"
          style={{ display: "block", cursor: "crosshair" }}
          onMouseMove={onMove} onMouseLeave={() => setHover(null)} onClick={onClick}>
          <defs>
            {/* Sky gradient */}
            <linearGradient id="lp-sky" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"    stopColor="#010208" />
              <stop offset="22%"   stopColor="#010208" />
              <stop offset="24%"   stopColor="#0f1520" />
              <stop offset="24.5%" stopColor="#521830" />
              <stop offset="25%"   stopColor="#b03015" />
              <stop offset="26%"   stopColor="#d07030" />
              <stop offset="28%"   stopColor="#5aaed4" />
              <stop offset="50%"   stopColor="#7ecbe8" />
              <stop offset="77%"   stopColor="#5aaed4" />
              <stop offset="82%"   stopColor="#d07030" />
              <stop offset="83%"   stopColor="#b03015" />
              <stop offset="83.5%" stopColor="#521830" />
              <stop offset="86%"   stopColor="#0f1520" />
              <stop offset="91%"   stopColor="#010208" />
              <stop offset="100%"  stopColor="#010208" />
            </linearGradient>

            {/* Phase fill gradients */}
            <linearGradient id="lp-adv" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%"   stopColor="#5dcaa5" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#5dcaa5" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="lp-del" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#db7093" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#db7093" stopOpacity="0.55" />
            </linearGradient>

            {/* Diagonal stripe pattern for sleep zones */}
            <pattern id="lp-sleep-stripe" x="0" y="0" width={STRIPE_SZ} height={STRIPE_SZ} patternUnits="userSpaceOnUse">
              <rect width={STRIPE_SZ} height={STRIPE_SZ} fill="#06060e" />
              <line x1="0" y1={STRIPE_SZ} x2={STRIPE_SZ} y2="0" stroke="#14162a" strokeWidth="1.5" />
            </pattern>

            <clipPath id="lp-clip">
              <rect x={LP} y={SKY_BOT} width={UW} height={H - SKY_BOT - 18} />
            </clipPath>
          </defs>

          {/* ── Sky strip ── */}
          <motion.rect x={LP} y={SKY_TOP} width={UW} height={SKY_H} fill="url(#lp-sky)" rx={2}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 4.0 }} />

          <g clipPath="url(#lp-clip)">

            {/* Sleep zones (0→wake, sleep→midnight) — diagonal stripe */}
            <rect x={LP}    y={SKY_BOT} width={XWake - LP}       height={H - SKY_BOT - 18} fill="url(#lp-sleep-stripe)" opacity={0.9} />
            <rect x={XSlp}  y={SKY_BOT} width={LP + UW - XSlp}   height={H - SKY_BOT - 18} fill="url(#lp-sleep-stripe)" opacity={0.9} />

            {/* Zero line */}
            <line x1={LP} y1={AXIS_Y} x2={LP+UW} y2={AXIS_Y} stroke="var(--site-text-dim)" strokeWidth={1} />

            {/* Grid lines */}
            {[-2, -1, 1].map(v => (
              <line key={v} x1={LP} y1={sy(v)} x2={LP+UW} y2={sy(v)}
                stroke="var(--site-border)" strokeWidth={0.6} strokeDasharray="5,7" />
            ))}

            {/* 1 — PRC curve */}
            <motion.path d={PRC_PATH} fill="none" stroke="var(--site-text)" strokeWidth={2.5}
              strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0 }} />

            {/* 2 — Color fills (advance / delay) */}
            <motion.path d={ADV_AREA} fill="url(#lp-adv)"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 1, ease: "easeInOut", delay: 2 }} />
            <motion.path d={DEL_AREA} fill="url(#lp-del)"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 1, ease: "easeInOut", delay: 2 }} />

            {/* 3 — Labels (zone labels first, then peak labels on top) */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.96 }} transition={{ duration: 0.5, delay: 3.0 }}>
              <rect x={hx(10)-51} y={AXIS_Y-48} width={102} height={22} rx={4}
                fill="#050810" fillOpacity={0.9} stroke="#5dcaa5" strokeWidth={0.6} strokeOpacity={0.35} />
              <text x={hx(10)} y={AXIS_Y-32} fontSize={13} fill="#5dcaa5" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="700" letterSpacing="2">▲ ADVANCE</text>
            </motion.g>
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.96 }} transition={{ duration: 0.5, delay: 3.1 }}>
              <rect x={hx(19)-43} y={AXIS_Y+54} width={86} height={22} rx={4}
                fill="#050810" fillOpacity={0.9} stroke="#db7093" strokeWidth={0.6} strokeOpacity={0.35} />
              <text x={hx(19)} y={AXIS_Y+70} fontSize={13} fill="#db7093" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="700" letterSpacing="2">▼ DELAY</text>
            </motion.g>
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 3.2 }}>
              <rect x={XPAdv-27} y={YPAdv-30} width={54} height={16} rx={3}
                fill="#050810" fillOpacity={0.92} stroke="#5dcaa5" strokeWidth={0.5} strokeOpacity={0.4} />
              <text x={XPAdv} y={YPAdv-17} fontSize={11} fill="#5dcaa5" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="700">+1.20h</text>
            </motion.g>
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 3.25 }}>
              <rect x={XPDel-54} y={YPDel-17} width={48} height={15} rx={3}
                fill="#050810" fillOpacity={0.92} stroke="#db7093" strokeWidth={0.5} strokeOpacity={0.4} />
              <text x={XPDel-50} y={YPDel-6} fontSize={11} fill="#db7093" fontFamily="var(--font-mono)" fontWeight="700">−2.02h</text>
            </motion.g>
            {/* Peak dots */}
            <motion.circle cx={XPAdv} cy={YPAdv} r={5} fill="#5dcaa5"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 3.2 }} />
            <circle cx={XPAdv} cy={YPAdv} r={5} fill="none" stroke="#5dcaa5" strokeWidth={1.5} opacity={0.4}>
              <animate attributeName="r" values="6;13;6" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0;0.4" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <motion.circle cx={XPDel} cy={YPDel} r={5} fill="#db7093"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 3.25 }} />
            <circle cx={XPDel} cy={YPDel} r={5} fill="none" stroke="#db7093" strokeWidth={1.5} opacity={0.4}>
              <animate attributeName="r" values="6;13;6" dur="2.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0;0.4" dur="2.8s" repeatCount="indefinite" />
            </circle>

            {/* 4 — Dead zones */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 3.5 }}>
              <line x1={XCbt} y1={SKY_BOT} x2={XCbt} y2={H - 18}
                stroke="#f5c842" strokeWidth={1.4} strokeDasharray="6,3" />
              <path d={`M${XCbt},${AXIS_Y-8} L${XCbt+7},${AXIS_Y} L${XCbt},${AXIS_Y+8} L${XCbt-7},${AXIS_Y} Z`}
                fill="#f5c842" />
              <text x={XCbt+10} y={SKY_BOT+40} fontSize={9.5} fill="#f5c842" fontFamily="var(--font-mono)" fontWeight="600">DZ1 · CBTmin</text>
            </motion.g>
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 3.6 }}>
              <line x1={XDZ2} y1={SKY_BOT} x2={XDZ2} y2={H - 18}
                stroke="#7080a8" strokeWidth={1.2} strokeDasharray="5,4" />
              <path d={`M${XDZ2},${AXIS_Y-8} L${XDZ2+7},${AXIS_Y} L${XDZ2},${AXIS_Y+8} L${XDZ2-7},${AXIS_Y} Z`}
                fill="#7080a8" />
              <text x={XDZ2-10} y={AXIS_Y+38} fontSize={9.5} fill="#7080a8" textAnchor="end" fontFamily="var(--font-mono)" fontWeight="600">DZ2</text>
            </motion.g>

            {/* 5 — Daytime (sunrise / sunset) */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 4.0 }}>
              {[XRise, XSet].map((x, i) => (
                <line key={i} x1={x} y1={SKY_BOT} x2={x} y2={H - 18}
                  stroke="#d07030" strokeWidth={1.2} strokeDasharray="4,5" opacity={0.6} />
              ))}
              <text x={XRise+5} y={SKY_BOT-4} fontSize={9} fill="#d07030" fontFamily="var(--font-mono)" opacity={0.9}>rise</text>
              <text x={XSet+5}  y={SKY_BOT-4} fontSize={9} fill="#d07030" fontFamily="var(--font-mono)" opacity={0.9}>set</text>
            </motion.g>

            {/* 6 — Wake and sleep */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 4.4 }}>
              <line x1={XWake} y1={SKY_BOT} x2={XWake} y2={H - 18}
                stroke="#50c8f8" strokeWidth={1.2} strokeDasharray="4,4" opacity={0.7} />
              <line x1={XSlp}  y1={SKY_BOT} x2={XSlp}  y2={H - 18}
                stroke="#6068a0" strokeWidth={1.2} strokeDasharray="4,4" opacity={0.65} />
              <text x={XWake+5} y={SKY_BOT+26} fontSize={10} fill="#50c8f8" fontFamily="var(--font-mono)" fontWeight="600" opacity={0.85}>wake</text>
              <text x={XSlp-5}  y={SKY_BOT+26} fontSize={10} fill="#6068a0" textAnchor="end" fontFamily="var(--font-mono)" fontWeight="600" opacity={0.8}>sleep</text>
            </motion.g>

            {/* Y-axis labels */}
            {[-2, -1, 0, 1].map(v => (
              <text key={v} x={LP-6} y={sy(v)+4}
                textAnchor="end" fontSize={10} fill="var(--site-text-secondary)" fontFamily="var(--font-mono)">
                {v > 0 ? `+${v}h` : v === 0 ? "0" : `${v}h`}
              </text>
            ))}

            {/* Hover / click tooltip */}
            {active && (() => {
              const tx = hx(active.hour);
              const ty = sy(active.shift);
              const col = Math.abs(active.shift) < 0.15 ? "var(--site-text-muted)" : active.shift > 0 ? "#5dcaa5" : "#db7093";
              const label = Math.abs(active.shift) < 0.05 ? "dead zone"
                : active.shift > 0 ? `+${active.shift.toFixed(2)}h advance`
                : `${active.shift.toFixed(2)}h delay`;
              const tipX = Math.min(Math.max(tx - 56, LP), LP + UW - 116);
              const tipY = ty > AXIS_Y + 40 ? ty - 38 : ty + 16;
              return (
                <g>
                  <line x1={tx} y1={SKY_BOT} x2={tx} y2={H-18}
                    stroke="var(--site-text-dim)" strokeWidth={1} strokeDasharray="2,3" />
                  <circle cx={tx} cy={ty} r={6} fill={col} />
                  <rect x={tipX} y={tipY} width={114} height={22} rx={4}
                    fill="var(--site-bg-card)" stroke="var(--site-border)" strokeWidth={1} />
                  <text x={tipX+57} y={tipY+15} textAnchor="middle" fontSize={10} fontWeight="700"
                    fill={col} fontFamily="var(--font-mono)">{label}</text>
                </g>
              );
            })()}

            {/* Current time dot — appears last */}
            <motion.line x1={dotX} y1={SKY_BOT} x2={dotX} y2={H-18}
              stroke="#404040" strokeWidth={1} strokeDasharray="2,3"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.7 }} />
            <motion.circle cx={dotX} cy={dotY} r={5} fill={zoneColor}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 4.7 }} />
            <circle cx={dotX} cy={dotY} r={8} fill="none" stroke={zoneColor} strokeWidth={1} opacity={0.25}>
              <animate attributeName="r" values="7;14;7" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.25;0;0.25" dur="3s" repeatCount="indefinite" />
            </circle>

          </g>

          {/* Hour axis */}
          {HOUR_LABELS.map(({ h, t }) => (
            <text key={t+h} x={hx(h)} y={H-4}
              textAnchor="middle" fontSize={10} fill="var(--site-text-secondary)" fontFamily="var(--font-mono)">
              {t}
            </text>
          ))}
        </svg>
      </div>

      {/* Instruction */}
      <p className="text-[10px]" style={{ color: "var(--site-text-dim)", fontFamily: "var(--font-mono)" }}>
        click or hover anywhere on the graph to see predicted phase shift · dot = now
      </p>

      <PRCInfo />
    </div>
  );
}

function PRCInfo() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button onClick={() => setOpen(!open)} onMouseEnter={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[11px] transition-colors"
        style={{ color: "var(--site-text-dim)" }}>
        <Info size={13} />
        <span>how this applies to jet lag</span>
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-80 rounded-lg p-4 space-y-2 text-[11px] leading-relaxed shadow-lg"
          style={{ backgroundColor: "var(--site-bg-card)", border: "1px solid var(--site-border)", color: "var(--site-text-prose)" }}>
          <p>
            The PRC tells you <strong style={{ color: "var(--site-text)" }}>when</strong> light shifts your clock and in which direction.
            The two dead zones (DZ1 at 4:30am, DZ2 at 3:30pm) are the zero crossings — light there has no effect.
          </p>
          <p>
            <span style={{ color: "#5dcaa5" }}>Eastward travel</span> requires advancing your clock.
            Seek bright light in the <strong style={{ color: "var(--site-text)" }}>morning advance zone</strong> (after CBTmin)
            and avoid light in the evening delay zone.
          </p>
          <p>
            <span style={{ color: "#db7093" }}>Westward travel</span> requires delaying.
            Seek light in the <strong style={{ color: "var(--site-text)" }}>evening delay zone</strong>
            and avoid early morning light.
          </p>
          <p>
            Striped bands = typical sleep window. Night zones require <strong style={{ color: "var(--site-text)" }}>artificial light</strong> to shift the clock.
          </p>
          <div className="pt-1 text-[9px]" style={{ borderTop: "1px solid var(--site-border)", color: "var(--site-text-dim)" }}>
            St. Hilaire et al. (2012) J Physiology 590(13) · 1h bright white light pulse
          </div>
        </div>
      )}
    </div>
  );
}
