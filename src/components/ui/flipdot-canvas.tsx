"use client";

import { useEffect, useRef } from "react";

const CELL = 22;
const RADIUS = 120;
const SPRING = 0.08;
const DAMPING = 0.88;
const MIN_INTENSITY = 0.04;

interface Cell {
  intensity: number;
  velocity: number;
  pulsePhase: number;
  pulseSpeed: number;
  pulseAmplitude: number;
}

export function FlipDotCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const gridRef = useRef<Cell[][]>([]);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let cssW = 0;
    let cssH = 0;

    function initGrid(w: number, h: number) {
      const cols = Math.ceil(w / CELL) + 1;
      const rows = Math.ceil(h / CELL) + 1;
      gridRef.current = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
          intensity: MIN_INTENSITY,
          velocity: 0,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.003 + Math.random() * 0.005,
          // ~8% of cells twinkle noticeably, rest are very dim
          pulseAmplitude: Math.random() < 0.08 ? 0.12 + Math.random() * 0.18 : 0.01 + Math.random() * 0.03,
        }))
      );
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      cssW = rect.width;
      cssH = rect.height;
      canvas!.width = Math.round(cssW * dpr);
      canvas!.height = Math.round(cssH * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      initGrid(cssW, cssH);
    }

    function roundedRect(x: number, y: number, w: number, h: number, r: number) {
      ctx!.beginPath();
      ctx!.moveTo(x + r, y);
      ctx!.lineTo(x + w - r, y);
      ctx!.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx!.lineTo(x + w, y + h - r);
      ctx!.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx!.lineTo(x + r, y + h);
      ctx!.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx!.lineTo(x, y + r);
      ctx!.quadraticCurveTo(x, y, x + r, y);
      ctx!.closePath();
    }

    function loop() {
      const t = ++tRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const grid = gridRef.current;

      ctx!.clearRect(0, 0, cssW, cssH);

      for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
          const cell = grid[row][col];
          const cx = col * CELL + CELL / 2;
          const cy = row * CELL + CELL / 2;

          // Ambient twinkle
          const ambient = MIN_INTENSITY + cell.pulseAmplitude * (0.5 + 0.5 * Math.sin(cell.pulsePhase + t * cell.pulseSpeed));

          // Cursor influence — cubic falloff within RADIUS
          const dist = Math.sqrt((cx - mx) ** 2 + (cy - my) ** 2);
          const hover = dist < RADIUS ? (1 - dist / RADIUS) ** 3 : 0;

          const target = Math.max(ambient, hover);
          cell.velocity += (target - cell.intensity) * SPRING;
          cell.velocity *= DAMPING;
          cell.intensity = Math.max(MIN_INTENSITY, Math.min(1, cell.intensity + cell.velocity));

          const i = cell.intensity;
          // Blue-white glow on dark navy
          const r = Math.round(i * 160);
          const g = Math.round(50 + i * 180);
          const b = Math.round(180 + i * 75);
          const a = 0.10 + i * 0.75;

          ctx!.fillStyle = `rgba(${r},${g},${b},${a})`;
          roundedRect(col * CELL + 1, row * CELL + 1, CELL - 2, CELL - 2, 3);
          ctx!.fill();
        }
      }

      animRef.current = requestAnimationFrame(loop);
    }

    resize();

    const container = canvas.parentElement;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };

    window.addEventListener("resize", resize);
    container?.addEventListener("mousemove", onMove);
    container?.addEventListener("mouseleave", onLeave);
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      container?.removeEventListener("mousemove", onMove);
      container?.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
    />
  );
}
