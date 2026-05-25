"use client";
import { useRef, useEffect, useCallback } from "react";

// ── Two-Process Model (Borbély 1982) ──────────────────────────────────────────
function circadian(h: number) {
  // Dual-harmonic alerting signal: peaks ~9am, trough ~4am
  return 0.75 * Math.cos(2 * Math.PI * (h - 9) / 24)
       + 0.22 * Math.cos(4 * Math.PI * (h - 9) / 24);
}

function homeostat(tw: number) {
  // Homeostatic sleep pressure: saturating exponential during wakefulness
  return 1.05 * (1 - Math.exp(-tw / 14));
}

function alertness(h: number, tw: number) {
  return circadian(h) - homeostat(tw);
}

// ── Grid ──────────────────────────────────────────────────────────────────────
const NX = 38, NZ = 30;
const Y_SCALE = 0.48;
const A_LO = alertness(4, 16);   // worst: 4am, 16h awake  ≈ −1.5
const A_HI = alertness(9, 0);    // best:  9am, just woke  ≈ +0.97

function normA(a: number) {
  return Math.max(0, Math.min(1, (a - A_LO) / (A_HI - A_LO)));
}

function aColor(t: number): [number, number, number] {
  // t=0 → site pink #db7093 · t=1 → site teal #5dcaa5
  return [
    Math.round(219 + (93  - 219) * t),
    Math.round(112 + (202 - 112) * t),
    Math.round(147 + (165 - 147) * t),
  ];
}

type V3 = [number, number, number];

function rotY(v: V3, a: number): V3 {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0]*c + v[2]*s, v[1], -v[0]*s + v[2]*c];
}

function rotX(v: V3, a: number): V3 {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0], v[1]*c - v[2]*s, v[1]*s + v[2]*c];
}

const FOV = 4.0;
function project(v: V3, cx: number, cy: number, sc: number): [number, number, number] {
  const d = FOV / (FOV + v[2] + 2.5);
  return [cx + v[0]*sc*d, cy - v[1]*sc*d, v[2]];
}

// Pre-build grid at module load (not per-render)
type GPt = { pos: V3; a: number };
const GRID: GPt[][] = (() => {
  const g: GPt[][] = [];
  for (let iz = 0; iz <= NZ; iz++) {
    g[iz] = [];
    for (let ix = 0; ix <= NX; ix++) {
      const h  = (ix / NX) * 24;
      const tw = (iz / NZ) * 16;
      const a  = alertness(h, tw);
      g[iz][ix] = { pos: [(ix/NX)*2 - 1, a * Y_SCALE, (iz/NZ)*2 - 1], a };
    }
  }
  return g;
})();

const LW = 900, LH = 480; // logical canvas dimensions

// ── Component ─────────────────────────────────────────────────────────────────
export function SleepSurface() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const st = useRef({ ry: -0.52, rx: 0.42, drag: false, lx: 0, ly: 0, raf: 0 });

  // DPR-aware canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = LW * dpr;
    canvas.height = LH * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { ry, rx } = st.current;
    const W = LW, H = LH;
    const cx = W / 2, cy = H * 0.50;
    const sc = W * 0.32;

    // Background
    ctx.fillStyle = "#010509";
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(cx, cy * 0.75, 0, cx, cy * 0.75, W * 0.52);
    glow.addColorStop(0, "rgba(18, 10, 40, 0.75)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Project all grid points
    const proj: [number, number, number][][] = GRID.map(row =>
      row.map(({ pos }) => {
        let v = rotY(pos, ry);
        v = rotX(v, rx);
        return project(v, cx, cy, sc);
      })
    );

    // Build face list
    type Face = { p: [number, number][]; depth: number; a: number };
    const faces: Face[] = [];

    for (let iz = 0; iz < NZ; iz++) {
      for (let ix = 0; ix < NX; ix++) {
        const p0 = proj[iz][ix], p1 = proj[iz][ix+1];
        const p2 = proj[iz+1][ix+1], p3 = proj[iz+1][ix];

        const h  = (ix + 0.5) / NX * 24;
        const tw = (iz + 0.5) / NZ * 16;

        faces.push({
          p: [[p0[0],p0[1]], [p1[0],p1[1]], [p2[0],p2[1]], [p3[0],p3[1]]],
          depth: (p0[2]+p1[2]+p2[2]+p3[2]) / 4,
          a: alertness(h, tw),
        });
      }
    }

    faces.sort((a, b) => a.depth - b.depth);

    // Draw faces
    for (const { p, a: aVal } of faces) {
      const t = normA(aVal);
      const [r, g, b] = aColor(t);

      ctx.beginPath();
      ctx.moveTo(p[0][0], p[0][1]);
      ctx.lineTo(p[1][0], p[1][1]);
      ctx.lineTo(p[2][0], p[2][1]);
      ctx.lineTo(p[3][0], p[3][1]);
      ctx.closePath();

      if (t > 0.78) {
        ctx.shadowColor = `rgb(${r},${g},${b})`;
        ctx.shadowBlur = 9;
      }
      ctx.fillStyle = `rgba(${r},${g},${b},0.84)`;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Dark grid lines
      ctx.strokeStyle = "rgba(1, 5, 12, 0.88)";
      ctx.lineWidth = 0.55;
      ctx.stroke();
    }

    // Bright top-edge highlights on alert faces
    ctx.lineWidth = 0.8;
    for (const { p, a: aVal } of faces) {
      const t = normA(aVal);
      if (t < 0.55) continue;
      const [r, g, b] = aColor(t);
      ctx.beginPath();
      ctx.moveTo(p[0][0], p[0][1]);
      ctx.lineTo(p[1][0], p[1][1]);
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.12 + t * 0.28})`;
      ctx.stroke();
    }

    // ── Axis helpers ───────────────────────────────────────────────────────────
    function ppt(pos: V3): [number, number] {
      let v = rotY(pos, ry);
      v = rotX(v, rx);
      const p = project(v, cx, cy, sc);
      return [p[0], p[1]];
    }

    const yFloor = A_LO * Y_SCALE;
    const yTop   = A_HI * Y_SCALE;

    // Floor frame
    const [fl, fr, br, bl] = [
      ppt([-1, yFloor, -1]), ppt([1, yFloor, -1]),
      ppt([1, yFloor, 1]),   ppt([-1, yFloor, 1]),
    ];
    ctx.beginPath();
    ctx.moveTo(fl[0], fl[1]); ctx.lineTo(fr[0], fr[1]);
    ctx.lineTo(br[0], br[1]); ctx.lineTo(bl[0], bl[1]);
    ctx.closePath();
    ctx.strokeStyle = "rgba(70, 90, 130, 0.22)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Vertical Y axis (back-left corner)
    const [vtop, vbot] = [ppt([-1, yTop, -1]), ppt([-1, yFloor, -1])];
    ctx.beginPath();
    ctx.moveTo(vtop[0], vtop[1]); ctx.lineTo(vbot[0], vbot[1]);
    ctx.strokeStyle = "rgba(70, 90, 130, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Labels ─────────────────────────────────────────────────────────────────
    const c2d = ctx; // alias to satisfy TS narrowing inside nested function
    function lbl(text: string, x: number, y: number, align: "center" | "right" | "left", color: string) {
      c2d.textAlign = align;
      const m = c2d.measureText(text);
      const pad = 4;
      const bx = align === "center" ? x - m.width/2 - pad
               : align === "right"  ? x - m.width - pad
               : x - pad;
      c2d.fillStyle = "rgba(1, 4, 10, 0.82)";
      c2d.fillRect(bx, y - 12, m.width + pad*2, 16);
      c2d.fillStyle = color;
      c2d.fillText(text, x, y);
    }

    c2d.font = "bold 12px var(--font-mono, 'Courier New', monospace)";

    // X axis (clock time) — front edge
    for (const h of [0, 6, 12, 18]) {
      const x  = (h / 24) * 2 - 1;
      const [px, py] = ppt([x, yFloor, 1]);
      const label = h === 0 ? "12am" : h === 12 ? "12pm" : `${h < 12 ? h : h-12}${h < 12 ? "am" : "pm"}`;
      lbl(label, px, py + 16, "center", "rgba(180, 205, 240, 0.92)");
    }
    const [xMidL, xMidR] = [ppt([-1, yFloor, 1]), ppt([1, yFloor, 1])];
    const xMid: [number, number] = [(xMidL[0]+xMidR[0])/2, (xMidL[1]+xMidR[1])/2];
    c2d.font = "11px var(--font-mono, 'Courier New', monospace)";
    lbl("clock time", xMid[0], xMid[1] + 32, "center", "rgba(160, 180, 220, 0.75)");

    c2d.font = "bold 12px var(--font-mono, 'Courier New', monospace)";

    for (const tw of [0, 4, 8, 12, 16]) {
      const z  = (tw / 16) * 2 - 1;
      const [px, py] = ppt([-1, yFloor, z]);
      lbl(`${tw}h`, px - 8, py + 4, "right", "rgba(180, 205, 240, 0.92)");
    }
    const [zMidF, zMidB] = [ppt([-1, yFloor, 1]), ppt([-1, yFloor, -1])];
    const zMid: [number, number] = [(zMidF[0]+zMidB[0])/2, (zMidF[1]+zMidB[1])/2];
    c2d.font = "11px var(--font-mono, 'Courier New', monospace)";
    lbl("hours awake", zMid[0] - 10, zMid[1] - 2, "right", "rgba(160, 180, 220, 0.75)");

    c2d.font = "bold 12px var(--font-mono, 'Courier New', monospace)";

    for (const [aVal, text] of [[-1.2, "sleepy"], [0.0, "neutral"], [0.8, "alert"]] as [number, string][]) {
      const [px, py] = ppt([-1, aVal * Y_SCALE, -1]);
      const t = normA(aVal);
      const [r, g, b] = aColor(t);
      lbl(text, px - 10, py + 4, "right", `rgba(${r},${g},${b},0.9)`);
    }

  }, []);

  const animate = useCallback(() => {
    if (!st.current.drag) st.current.ry += 0.004;
    draw();
    st.current.raf = requestAnimationFrame(animate);
  }, [draw]);

  useEffect(() => {
    st.current.raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(st.current.raf);
  }, [animate]);

  const onDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const pt = "touches" in e ? e.touches[0] : e;
    st.current.drag = true;
    st.current.lx = pt.clientX;
    st.current.ly = pt.clientY;
  }, []);

  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!st.current.drag) return;
    const pt = "touches" in e ? e.touches[0] : e;
    st.current.ry += (pt.clientX - st.current.lx) * 0.012;
    st.current.rx  = Math.max(-0.1, Math.min(1.2, st.current.rx + (pt.clientY - st.current.ly) * 0.008));
    st.current.lx  = pt.clientX;
    st.current.ly  = pt.clientY;
  }, []);

  const onUp = useCallback(() => { st.current.drag = false; }, []);

  return (
    <div className="w-full rounded overflow-hidden"
      style={{ border: "1px solid var(--site-border)", background: "#010509" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", display: "block", cursor: "grab" }}
        onMouseDown={onDown as React.MouseEventHandler}
        onMouseMove={onMove as React.MouseEventHandler}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={onDown as React.TouchEventHandler}
        onTouchMove={onMove as React.TouchEventHandler}
        onTouchEnd={onUp}
      />
      <div className="flex items-center gap-3 px-4 pb-3 pt-2 flex-wrap text-[9px]"
        style={{ color: "var(--site-text-muted)", fontFamily: "var(--font-mono)" }}>
        <span>drag to rotate</span>
        <span style={{ color: "#5dcaa5" }}>■ alert</span>
        <span style={{ color: "#db7093" }}>■ sleepy</span>
        <span className="ml-auto opacity-50">Two-Process Model · Borbély 1982</span>
      </div>
    </div>
  );
}
