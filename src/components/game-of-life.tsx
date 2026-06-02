"use client";

import { useEffect, useRef, useLayoutEffect, useState } from "react";

// Matches kdrag0n.dev's constants exactly
const CELL = 8;       // cell size px
const TICK = 85;      // ms per generation
const LINE_GAP = 20;  // ms threshold — draw line vs single cell

// Gosper's Glider Gun (rotated 90° as on kdrag0n.dev)
const GLIDER_GUN_RAW = `........................O
......................O.O
............OO......OO............OO
...........O...O....OO............OO
OO........O.....O...OO
OO........O...O.OO....O.O
..........O.....O.......O
...........O...O
............OO`;

function rotatePattern(src: string): string {
  const rows = src.split("\n");
  const w = Math.max(...rows.map(r => r.length));
  const cols: string[] = Array.from({ length: w }, () => "");
  for (let c = 0; c < w; c++)
    for (let r = 0; r < rows.length; r++)
      cols[c] += rows[rows.length - 1 - r][c] ?? ".";
  return cols.join("\n");
}

const GLIDER_GUN = rotatePattern(GLIDER_GUN_RAW);
function patternSize(p: string): [number, number] {
  const rows = p.split("\n");
  return [Math.max(...rows.map(r => r.length)), rows.length];
}

// ── Rake and puffer seed patterns ─────────────────────────────────────────────
// Natural glider producers and known rake-building components
const SPAWN_PATTERNS = [
  // R-pentomino — explosive natural glider producer
  `.OO\nOO.\n.O.`,
  // Acorn — 7 cells, stabilises after 5206 gen with many gliders
  `.O.....\n...O...\nOO..OOO`,
  // Diehard — 12 cells, dies after 130 gen leaving gliders
  `......O.\nOO......\n.O...OOO`,
  // Herschel — 7-cell fundamental rake building block
  `O..\nOOO\n.O.\n.OO`,
  // Switch engine — diagonal puffer, leaves debris trail indefinitely
  `.O.O...\n.....O.\nO....O.\n.OOOO..`,
  // Pi-heptomino — chaotic, produces gliders during long evolution
  `OOO\nO.O\nO.O`,
  // Glider stream — 6 gliders in a column, all heading SE; creates a diagonal sweep
  `.O.\n..O\nOOO\n...\n...\n...\n...\n...\n...\n.O.\n..O\nOOO\n...\n...\n...\n...\n...\n...\n.O.\n..O\nOOO\n...\n...\n...\n...\n...\n...\n.O.\n..O\nOOO\n...\n...\n...\n...\n...\n...\n.O.\n..O\nOOO\n...\n...\n...\n...\n...\n...\n.O.\n..O\nOOO`,
  // Queen bee shuttle — period-30, interacts with passing gliders
  `OO...................\n.OO..................\n..O..................\n..O..O...............\n.....O...............\n.....OO.....OO.......\n...........O.O.......\n..........O..........\n..........O.O........\n...........OO........`,
];

// ── Rake patterns ─────────────────────────────────────────────────────────────
// Moving patterns that emit secondary spaceships/gliders as they travel.
// All move rightward in standard orientation; rotation handles other directions.
const RAKE_PATTERNS = [
  // Switch engine — diagonal puffer/rake, leaves a debris wake
  `.O.O...\n.....O.\nO....O.\n.OOOO..`,
  // Double switch engine — two interacting switch engines form a stable rake
  `.O.O...\n.....O.\nO....O.\n.OOOO..\n.......\n.......\n.......\n.O.O...\n.....O.\nO....O.\n.OOOO..`,
  // Blinker puffer — two MWSS in close parallel (period-8, emits blinkers/gliders)
  `..O...\n.O...O\nO.....\nO....O\nOOOOO.\n......\n......\n......\n..O...\n.O...O\nO.....\nO....O\nOOOOO.`,
  // Forward rake — three LWSS stacked, interactions produce secondary objects
  `.O..O\nO....\nO...O\nOOOO.\n.....\n.O..O\nO....\nO...O\nOOOO.\n.....\n.O..O\nO....\nO...O\nOOOO.`,
  // Heavy forward rake — two HWSS in parallel
  `..OO...\n.O....O\nO......\nO.....O\nOOOOOO.\n.......\n.......\n..OO...\n.O....O\nO......\nO.....O\nOOOOOO.`,
  // LWSS squadron — 4 lightweight spaceships in formation, 6-row safe gap
  `.O..O\nO....\nO...O\nOOOO.\n......\n......\n......\n......\n......\n......\n.O..O\nO....\nO...O\nOOOO.\n......\n......\n......\n......\n......\n......\n.O..O\nO....\nO...O\nOOOO.\n......\n......\n......\n......\n......\n......\n.O..O\nO....\nO...O\nOOOO.`,
];

// ── Grid (non-toroidal, bounds-checked like kdrag0n.dev) ──────────────────────
class Grid {
  w: number; h: number;
  cells: Uint8Array;
  pink: Uint8Array;
  constructor(w: number, h: number) {
    this.w = w; this.h = h;
    this.cells = new Uint8Array(w * h);
    this.pink = new Uint8Array(w * h);
  }
  get(x: number, y: number) { return this.cells[y * this.w + x]; }
  set(x: number, y: number, v: number) { this.cells[y * this.w + x] = v; }
  getPink(x: number, y: number) { return this.pink[y * this.w + x]; }
  setPink(x: number, y: number, v: number) { this.pink[y * this.w + x] = v; }
  copyFrom(src: Grid, srcX: number, srcY: number, dstX: number, dstY: number, cw: number, ch: number) {
    for (let dy = 0; dy < ch; dy++)
      for (let dx = 0; dx < cw; dx++) {
        this.set(dstX + dx, dstY + dy, src.get(srcX + dx, srcY + dy));
        this.setPink(dstX + dx, dstY + dy, src.getPink(srcX + dx, srcY + dy));
      }
  }
}

// ── Simulation ────────────────────────────────────────────────────────────────
class Sim {
  ctx: CanvasRenderingContext2D;
  w = 0; h = 0;
  cur: Grid = new Grid(0, 0);
  nxt: Grid = new Grid(0, 0);
  lastMouse: { t: number; x: number; y: number } | null = null;
  touches: Map<number, { x: number; y: number }> = new Map();

  constructor(ctx: CanvasRenderingContext2D, pattern: string) {
    this.ctx = ctx;
    this.resize();
    // Place Gosper's Gun near top-right (matches kdrag0n.dev placement)
    const [pw] = patternSize(pattern);
    const ox = Math.max(0, this.w - pw - 5);
    this.stampPattern(ox, 5, pattern);
    // Small random block top-left for entropy
    const seed = Math.max(10, Math.floor(Math.max(this.w, this.h) / 6));
    for (let y = 5; y < seed + 5; y++)
      for (let x = 5; x < seed + 5; x++)
        this.cur.set(x, y, Math.random() < 0.5 ? 1 : 0);
    // Run a few generations to settle
    for (let i = 0; i < 10; i++) this.tick();
  }

  stampPattern(ox: number, oy: number, pattern: string) {
    const rows = pattern.split("\n");
    for (let y = 0; y < rows.length; y++)
      for (let x = 0; x < rows[y].length; x++)
        this.cur.set(ox + x, oy + y, rows[y][x] === "O" ? 1 : 0);
  }

  // Runs pattern in an unbounded set-sim for `gens` generations.
  // Returns cells normalized so the leftmost column is at x=0.
  preEvolve(pattern: string, gens: number): Array<{ x: number; y: number }> {
    let alive = new Set<string>();
    for (const [y, row] of pattern.split("\n").entries())
      for (let x = 0; x < row.length; x++)
        if (row[x] === "O") alive.add(`${x},${y}`);

    for (let g = 0; g < gens; g++) {
      const counts = new Map<string, number>();
      for (const key of alive) {
        const [cx, cy] = key.split(",").map(Number);
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nk = `${cx + dx},${cy + dy}`;
            counts.set(nk, (counts.get(nk) ?? 0) + 1);
          }
      }
      const next = new Set<string>();
      for (const [key, cnt] of counts)
        if (cnt === 3 || (cnt === 2 && alive.has(key))) next.add(key);
      alive = next;
    }

    const cells = [...alive].map(k => { const [x, y] = k.split(",").map(Number); return { x, y }; });
    if (!cells.length) return [];
    const minX = Math.min(...cells.map(c => c.x));
    const minY = Math.min(...cells.map(c => c.y));
    return cells.map(c => ({ x: c.x - minX, y: c.y - minY }));
  }

  stampEvolved(cells: Array<{ x: number; y: number }>, oy: number) {
    for (const { x, y } of cells) {
      const gx = x, gy = oy + y;
      if (gx >= 0 && gx < this.w && gy >= 0 && gy < this.h)
        this.cur.set(gx, gy, 1);
    }
  }

  stampRandom() {
    const raw = SPAWN_PATTERNS[Math.floor(Math.random() * SPAWN_PATTERNS.length)];
    const cells = this.preEvolve(raw, 80);
    if (!cells.length) return;
    const maxY = Math.max(...cells.map(c => c.y));
    // Center at a random y; edge clipping is fine
    const oy = Math.max(0, Math.floor(Math.random() * this.h) - Math.floor(maxY / 2));
    this.stampEvolved(cells, oy);
  }

  spawnRake() {
    const raw = RAKE_PATTERNS[Math.floor(Math.random() * RAKE_PATTERNS.length)];
    const cells = this.preEvolve(raw, 60);
    if (!cells.length) return;
    const maxY = Math.max(...cells.map(c => c.y));
    const oy = Math.max(0, Math.floor(Math.random() * this.h) - Math.floor(maxY / 2));
    this.stampEvolved(cells, oy);
  }

  neighbors(x: number, y: number): number {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= this.w || ny < 0 || ny >= this.h) continue;
        n += this.cur.get(nx, ny);
      }
    return n;
  }

  tick() {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const n = this.neighbors(x, y);
        const alive = this.cur.get(x, y);
        const nextAlive = alive ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
        this.nxt.set(x, y, nextAlive);
        // Pink only if the cell survived (was alive last gen AND stays alive)
        this.nxt.setPink(x, y, alive && nextAlive ? 1 : 0);
      }
    const tmp = this.cur; this.cur = this.nxt; this.nxt = tmp;
  }

  draw() {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w * CELL, h * CELL);
    const dark = document.documentElement.getAttribute("data-theme") !== "light";
    const normalColor = dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)";
    const pinkColor = "rgba(219,112,147,0.32)";
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (this.cur.get(x, y)) {
          ctx.fillStyle = this.cur.getPink(x, y) ? pinkColor : normalColor;
          ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
        }
  }

  resize() {
    const canvas = this.ctx.canvas;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const nw = Math.floor(rect.width / CELL);
    const nh = Math.floor(rect.height / CELL);
    if (nw !== this.w || nh !== this.h) {
      const next = new Grid(nw, nh);
      const cw = Math.min(this.w, nw), ch = Math.min(this.h, nh);
      const sx = Math.max(0, this.w - cw);
      const dx = Math.max(0, nw - cw);
      if (this.cur.cells.length) next.copyFrom(this.cur, sx, 0, dx, 0, cw, ch);
      this.w = nw; this.h = nh;
      this.cur = next;
      this.nxt = new Grid(nw, nh);
    }
  }

  // Bresenham's line — draws a line of cells between two grid points
  setLine(x0: number, y0: number, x1: number, y1: number) {
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, x = x0, y = y0;
    for (let i = 0; i < 250; i++) {
      if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.cur.set(x, y, 1);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx)  { err += dx; y += sy; }
    }
    this.draw();
  }

  onMouseMove(t: number, x: number, y: number) {
    if (this.lastMouse && t - this.lastMouse.t < LINE_GAP)
      this.setLine(this.lastMouse.x, this.lastMouse.y, x, y);
    else if (x >= 0 && x < this.w && y >= 0 && y < this.h)
      this.cur.set(x, y, 1);
    this.lastMouse = { t, x, y };
  }

  onTouchStart(id: number, x: number, y: number) {
    this.touches.set(id, { x, y });
    if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.cur.set(x, y, 1);
  }

  onTouchMove(id: number, x: number, y: number) {
    const prev = this.touches.get(id);
    if (prev) this.setLine(prev.x, prev.y, x, y);
    this.touches.set(id, { x, y });
  }

  onTouchEnd(id: number) { this.touches.delete(id); }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function GameOfLife() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Sim | null>(null);
  const [visible, setVisible] = useState(() => document.visibilityState === "visible");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Wait one frame so CSS layout (100vw × 100vh) is fully computed
    const raf = requestAnimationFrame(() => {
      const sim = new Sim(ctx, GLIDER_GUN);
      simRef.current = sim;
      sim.draw();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Tick loop — pauses when tab hidden
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      simRef.current?.tick();
      simRef.current?.draw();
    }, TICK);
    return () => clearInterval(id);
  }, [visible]);

  // Random pattern spawner — stamps a new GoL artifact every 2–5 seconds
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(() => {
        simRef.current?.stampRandom();
        schedule();
      }, 2000 + Math.random() * 3000);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, []);

  // Rake spawner — flies one in from a random edge every 5–12 seconds
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(() => {
        simRef.current?.spawnRake();
        schedule();
      }, 5000 + Math.random() * 7000);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, []);

  // Visibility API
  useEffect(() => {
    const fn = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", fn);
    return () => document.removeEventListener("visibilitychange", fn);
  }, []);

  // Resize
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      simRef.current?.resize();
      simRef.current?.draw();
    });
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  // Mouse — draw on hover (no click required)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = Math.floor(e.clientX / CELL);
      const y = Math.floor(e.clientY / CELL);
      simRef.current?.onMouseMove(e.timeStamp, x, y);
    };
    const onDown = (e: MouseEvent) => {
      const x = Math.floor(e.clientX / CELL);
      const y = Math.floor(e.clientY / CELL);
      simRef.current?.onMouseMove(e.timeStamp, x, y);
    };
    const onUp = () => {
      if (simRef.current) simRef.current.lastMouse = null;
    };
    const onTouchStart = (e: TouchEvent) => {
      for (const t of Array.from(e.touches))
        simRef.current?.onTouchStart(t.identifier, Math.floor(t.clientX / CELL), Math.floor(t.clientY / CELL));
    };
    const onTouchMove = (e: TouchEvent) => {
      for (const t of Array.from(e.touches))
        simRef.current?.onTouchMove(t.identifier, Math.floor(t.clientX / CELL), Math.floor(t.clientY / CELL));
    };
    const onTouchEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches))
        simRef.current?.onTouchEnd(t.identifier);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div className="print:hidden" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100vw", height: "100vh", userSelect: "none" }}
      />
    </div>
  );
}
