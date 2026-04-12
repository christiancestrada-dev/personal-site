"use client";

import { useEffect, useState } from "react";

interface CircadianState {
  phase: string;
  detail: string;
  color: string;
  breathingRate: number; // breaths per minute
}

function getCircadianState(hour: number, minute: number): CircadianState {
  const t = hour + minute / 60;

  if (t >= 22 || t < 1) return {
    phase: "N1 / N2 onset",
    detail: "adenosine peak — sleep pressure high",
    color: "#525252",
    breathingRate: 14,
  };
  if (t >= 1 && t < 3) return {
    phase: "slow-wave sleep",
    detail: "deep NREM — memory consolidation",
    color: "#60a5ff",
    breathingRate: 10,
  };
  if (t >= 3 && t < 5) return {
    phase: "REM",
    detail: "dreaming — hippocampal replay",
    color: "#9b8fce",
    breathingRate: 16,
  };
  if (t >= 5 && t < 7) return {
    phase: "circadian wake signal",
    detail: "cortisol rising — pre-dawn arousal",
    color: "#e89b5a",
    breathingRate: 14,
  };
  if (t >= 7 && t < 10) return {
    phase: "peak alertness",
    detail: "core body temp rising",
    color: "#d4d4d4",
    breathingRate: 16,
  };
  if (t >= 10 && t < 13) return {
    phase: "cognitive peak",
    detail: "working memory & attention optimal",
    color: "#d4d4d4",
    breathingRate: 16,
  };
  if (t >= 13 && t < 15) return {
    phase: "post-prandial dip",
    detail: "circadian trough — microsleeps likely",
    color: "#7a9fc4",
    breathingRate: 14,
  };
  if (t >= 15 && t < 18) return {
    phase: "afternoon recovery",
    detail: "reaction time & motor speed peak",
    color: "#d4d4d4",
    breathingRate: 16,
  };
  if (t >= 18 && t < 20) return {
    phase: "melatonin onset",
    detail: "dim-light melatonin onset window",
    color: "#7a9fc4",
    breathingRate: 15,
  };
  return {
    phase: "wind-down",
    detail: "adenosine accumulating — sleep debt building",
    color: "#525252",
    breathingRate: 13,
  };
}

export function CircadianClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  const h = time.getHours();
  const m = time.getMinutes();
  const s = time.getSeconds();
  const state = getCircadianState(h, m);

  const timeStr = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Breathing animation duration in seconds
  const breathPeriod = 60 / state.breathingRate;

  return (
    <div className="flex items-center gap-3 text-xs">
      {/* Breathing dot */}
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{
          backgroundColor: state.color,
          animation: `breathe ${breathPeriod}s ease-in-out infinite`,
        }}
      />
      <span style={{ color: state.color }}>{state.phase}</span>
      <span style={{ color: "var(--site-text-muted)" }}>·</span>
      <span style={{ color: "var(--site-text-muted)" }}>{timeStr}</span>
    </div>
  );
}

export function CircadianDetail() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  const state = getCircadianState(time.getHours(), time.getMinutes());

  return (
    <span className="text-xs" style={{ color: "var(--site-text-muted)" }}>
      {state.detail}
    </span>
  );
}
