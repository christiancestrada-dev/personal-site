"use client";

import React, { useEffect, useState } from "react";
import { LocationTag } from "@/components/ui/location-tag";

// ─── Sleep stage config ───────────────────────────────────────────────────────

interface NavStage {
  label: string;
  color: string;
  amplitude: number;  // px above/below center — larger = deeper sleep
  frequency: number;  // wave cycles across the SVG
  speed: number;      // animation duration (s) — slower = deeper sleep
  opacity: number;
}

function getNavStage(hour: number): NavStage {
  if (hour >= 22 || hour < 1)  return { label: "N1",   color: "#7a9fc4", amplitude: 5,  frequency: 4, speed: 4,   opacity: 0.5 };
  if (hour >= 1  && hour < 2)  return { label: "N2",   color: "#60a5ff", amplitude: 8,  frequency: 3, speed: 5.5, opacity: 0.5 };
  if (hour >= 2  && hour < 4)  return { label: "N3",   color: "#4a8adc", amplitude: 14, frequency: 1, speed: 8,   opacity: 0.6 };
  if (hour >= 4  && hour < 6)  return { label: "REM",  color: "#9b8fce", amplitude: 4,  frequency: 6, speed: 2,   opacity: 0.5 };
  if (hour >= 6  && hour < 7)  return { label: "N2",   color: "#60a5ff", amplitude: 7,  frequency: 3, speed: 5,   opacity: 0.4 };
  if (hour >= 13 && hour < 15) return { label: "Dip",  color: "#7a9fc4", amplitude: 4,  frequency: 4, speed: 4,   opacity: 0.35 };
  return                               { label: "Wake", color: "#d4d4d4", amplitude: 2,  frequency: 7, speed: 1.5, opacity: 0.3 };
}

function useSleepStage(): NavStage {
  const [stage, setStage] = useState<NavStage>(() => getNavStage(new Date().getHours()));
  useEffect(() => {
    const update = () => setStage(getNavStage(new Date().getHours()));
    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, []);
  return stage;
}

// ─── Bezier wave path builder ─────────────────────────────────────────────────
// Generates a smooth sinusoidal SVG path using cubic bezier approximation.
// Both pathA and pathB always have identical command counts (required for SMIL).

function buildWavePath(amplitude: number, frequency: number, invert: boolean): string {
  const W = 300; // draw 2× wide so the scrolling translate never shows a seam
  const cy = 14;
  const cycleW = W / frequency;
  const cp = amplitude * 0.5523; // bezier sine approximation constant

  let d = `M 0 ${cy}`;

  for (let i = 0; i < frequency; i++) {
    const x0 = i * cycleW;
    const x1 = x0 + cycleW / 2;
    const x2 = x0 + cycleW;
    const yUp = cy - amplitude;
    const yDn = cy + amplitude;

    if (!invert) {
      d += ` C ${(x0 + cycleW / 4).toFixed(1)} ${(yUp - cp).toFixed(1)}, ${(x1 - cycleW / 4).toFixed(1)} ${(yUp - cp).toFixed(1)}, ${x1.toFixed(1)} ${cy}`;
      d += ` C ${(x1 + cycleW / 4).toFixed(1)} ${(yDn + cp).toFixed(1)}, ${(x2 - cycleW / 4).toFixed(1)} ${(yDn + cp).toFixed(1)}, ${x2.toFixed(1)} ${cy}`;
    } else {
      d += ` C ${(x0 + cycleW / 4).toFixed(1)} ${(yDn + cp).toFixed(1)}, ${(x1 - cycleW / 4).toFixed(1)} ${(yDn + cp).toFixed(1)}, ${x1.toFixed(1)} ${cy}`;
      d += ` C ${(x1 + cycleW / 4).toFixed(1)} ${(yUp - cp).toFixed(1)}, ${(x2 - cycleW / 4).toFixed(1)} ${(yUp - cp).toFixed(1)}, ${x2.toFixed(1)} ${cy}`;
    }
  }

  return d;
}

// ─── EEG Wave SVG ─────────────────────────────────────────────────────────────

function EEGWave({ stage, className = "" }: { stage: NavStage; className?: string }) {
  const pathA = buildWavePath(stage.amplitude, stage.frequency, false);
  const pathB = buildWavePath(stage.amplitude, stage.frequency, true);
  const scrollDist = 300 / stage.frequency; // one full wavelength

  return (
    <div key={stage.label} className={`overflow-hidden ${className}`} style={{ animation: "fadeInWave 1.5s ease" }}>
      <svg
        viewBox="0 0 150 28"
        width="100%"
        height="28"
        style={{ display: "block", overflow: "hidden" }}
        aria-hidden="true"
      >
        <defs>
          <clipPath id="eeg-clip">
            <rect x="0" y="0" width="150" height="28" />
          </clipPath>
        </defs>
        <g clipPath="url(#eeg-clip)">
          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0,0"
              to={`${-scrollDist},0`}
              dur={`${stage.speed}s`}
              repeatCount="indefinite"
            />
            <path
              fill="none"
              stroke={stage.color}
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity={stage.opacity}
            >
              <animate
                attributeName="d"
                values={`${pathA};${pathB};${pathA}`}
                dur={`${stage.speed * 2}s`}
                repeatCount="indefinite"
              />
            </path>
          </g>
        </g>
      </svg>
    </div>
  );
}

// ─── Phase badge ──────────────────────────────────────────────────────────────

function PhaseBadge({ stage }: { stage: NavStage }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: stage.color,
          animation: `breathe ${stage.label === "N3" ? "8s" : stage.label === "REM" ? "2s" : "4s"} ease-in-out infinite`,
        }}
      />
      <span className="text-[10px] uppercase tracking-wider" style={{ color: stage.color }}>
        {stage.label}
      </span>
    </div>
  );
}

// ─── Sleep Navbar (main export) ───────────────────────────────────────────────

export function SleepNavbar() {
  const stage = useSleepStage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 border-b overflow-hidden"
      style={{ borderColor: "#1a1a1a", backgroundColor: "rgba(0,0,0,0.88)" }}
    >
      {/* Fading grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
          WebkitMaskImage: "radial-gradient(ellipse 70% 200% at 0% 50%, #000 30%, transparent 80%)",
          maskImage: "radial-gradient(ellipse 70% 200% at 0% 50%, #000 30%, transparent 80%)",
          opacity: 0.35,
        }}
      />

      {/* ── Left: name + wave stacked ── */}
      <div className="relative z-10 flex flex-col justify-center gap-0.5">
        <h1
          className="text-[11px] font-bold italic uppercase tracking-[0.2em]"
          style={{ color: "#d4d4d4" }}
        >
          christian estrada
        </h1>
        {mounted && <EEGWave stage={stage} className="w-36" />}
      </div>

      {/* ── Center: wider wave (desktop only) ── */}
      <div className="relative z-10 hidden md:flex flex-1 items-center justify-center mx-8 max-w-xs">
        {mounted && <EEGWave stage={stage} className="w-full" />}
      </div>

      {/* ── Right: location + phase ── */}
      <div className="relative z-10 flex items-center gap-3">
        {mounted && (
          <>
            <LocationTag city="Boston" timezone="America/New_York" />
            <div
              className="hidden sm:block w-px h-4"
              style={{ backgroundColor: "#1a1a1a" }}
            />
            <PhaseBadge stage={stage} />
          </>
        )}
      </div>
    </nav>
  );
}

// Keep SimpleNavbar export so nothing breaks if imported elsewhere
export function SimpleNavbar({ title }: { title: string }) {
  return <SleepNavbar />;
}
