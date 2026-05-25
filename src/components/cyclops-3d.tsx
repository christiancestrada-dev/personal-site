"use client";
import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// ── CYCLOPS 3D ────────────────────────────────────────────────────────────────
// Three clock genes at 120° phase offsets always sum to zero — so all 24 hourly
// samples lie on a perfect circle embedded in 3D gene-expression space.
// The shadow ellipses on each coordinate plane show the key CYCLOPS insight:
// ANY 2D slice of this 3D structure gives an ellipse that encodes circadian order.

const N_RING = 180;
const N_SMPL = 24;
type V3 = [number, number, number];

function genePos(t: number, total: number): V3 {
  const a = (t / total) * 2 * Math.PI;
  return [
    Math.cos(a),
    Math.cos(a + (2 * Math.PI) / 3),
    Math.cos(a + (4 * Math.PI) / 3),
  ];
}

function timeCol(t: number): [number, number, number] {
  const s = Math.sin((t / N_SMPL) * Math.PI);
  return [
    Math.round(93  + (219 - 93)  * s),
    Math.round(202 + (112 - 202) * s),
    Math.round(165 + (147 - 165) * s),
  ];
}

function rotY(v: V3, a: number): V3 {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0]*c + v[2]*s, v[1], -v[0]*s + v[2]*c];
}
function rotX(v: V3, a: number): V3 {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0], v[1]*c - v[2]*s, v[1]*s + v[2]*c];
}

const FOV = 4.8;
function proj3(v: V3, cx: number, cy: number, sc: number): [number, number, number] {
  const d = FOV / (FOV + v[2] + 2.0);
  return [cx + v[0]*sc*d, cy - v[1]*sc*d, v[2]];
}

// Cube edges: all 12 edges of the [-1,1]³ bounding box
const CUBE_EDGES: [V3, V3][] = [
  [[-1,-1,-1],[1,-1,-1]], [[1,-1,-1],[1,-1,1]], [[1,-1,1],[-1,-1,1]], [[-1,-1,1],[-1,-1,-1]],
  [[-1, 1,-1],[1, 1,-1]], [[1, 1,-1],[1, 1,1]], [[1, 1,1],[-1, 1,1]], [[-1, 1,1],[-1, 1,-1]],
  [[-1,-1,-1],[-1,1,-1]], [[1,-1,-1],[1,1,-1]], [[1,-1,1],[1,1,1]], [[-1,-1,1],[-1,1,1]],
];

const LW = 900, LH = 480;

export function Cyclops3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const st = useRef({ ry: 0.3, rx: 0.3, drag: false, lx: 0, ly: 0, raf: 0, t: 0, intro: 0 });
  const introStarted = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = LW * dpr; c.height = LH * dpr;
    c.getContext("2d")!.scale(dpr, dpr);
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { introStarted.current = true; obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(c);
    return () => obs.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { ry, rx, t, intro } = st.current;
    // Ease-out: fast start, decelerates to 1
    const scale = 1 - Math.pow(1 - intro, 3);
    const W = LW, H = LH;
    const cx = W / 2, cy = H * 0.50;
    const sc = W * 0.24;

    ctx.fillStyle = "#010408";
    ctx.fillRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.52);
    bg.addColorStop(0,   "rgba(8, 20, 55, 0.65)");
    bg.addColorStop(0.5, "rgba(18, 4, 40, 0.35)");
    bg.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    function ppt(v: V3): [number, number, number] {
      return proj3(rotX(rotY(v, ry), rx), cx, cy, sc);
    }
    function pp2(v: V3): [number, number] { const r = ppt(v); return [r[0], r[1]]; }

    function sg(ti: number, total: number): V3 {
      const p = genePos(ti, total);
      return [p[0]*scale, p[1]*scale, p[2]*scale];
    }

    // Raw ring points (not projected) for shadow math
    const rawRing: V3[] = Array.from({ length: N_RING + 1 }, (_, i) => sg(i, N_RING));

    // ── 1. Bounding cube ──────────────────────────────────────────────────────
    for (const [a, b] of CUBE_EDGES) {
      const [ax, ay] = pp2(a), [bx, by] = pp2(b);
      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      ctx.strokeStyle = "rgba(55, 75, 130, 0.14)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // ── 2. Shadow projections (ring projected onto each coordinate plane) ─────
    // Each projection forms an ellipse — any 2D gene-pair slice always does.
    const shadows: { pts: [number,number][]; color: string; label: string }[] = [
      {
        pts: rawRing.map(p => pp2([p[0], p[1], -1])),  // z=-1 back wall (Gene A × B)
        color: "rgba(96, 165, 255, 0.28)",
        label: "A×B",
      },
      {
        pts: rawRing.map(p => pp2([p[0], -1, p[2]])),  // y=-1 floor (Gene A × C)
        color: "rgba(167, 139, 250, 0.28)",
        label: "A×C",
      },
      {
        pts: rawRing.map(p => pp2([-1, p[1], p[2]])),  // x=-1 left wall (Gene B × C)
        color: "rgba(219, 112, 147, 0.28)",
        label: "B×C",
      },
    ];

    ctx.setLineDash([5, 5]);
    for (const { pts, color } of shadows) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i <= N_RING; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Shadow labels near the start of each ellipse
    ctx.font = "bold 10px var(--font-mono, monospace)";
    const shadowColors = ["rgba(96,165,255,0.55)", "rgba(167,139,250,0.55)", "rgba(219,112,147,0.55)"];
    const shadowLabels = ["Gene A×B  ellipse", "Gene A×C  ellipse", "Gene B×C  ellipse"];
    for (let si = 0; si < 3; si++) {
      const p = shadows[si].pts[N_RING / 6 | 0];
      ctx.textAlign = "left";
      const m = ctx.measureText(shadowLabels[si]);
      ctx.fillStyle = "rgba(1,4,10,0.7)";
      ctx.fillRect(p[0] + 4, p[1] - 11, m.width + 6, 14);
      ctx.fillStyle = shadowColors[si];
      ctx.fillText(shadowLabels[si], p[0] + 7, p[1]);
    }

    // ── 3. Axes with scale ticks ──────────────────────────────────────────────
    const O = pp2([0, 0, 0]);
    const AXES: [V3, V3, string, string][] = [
      [[1.4,0,0],  [1,0,0],  "Gene A", "#60a5ff"],
      [[0,1.4,0],  [0,1,0],  "Gene B", "#db7093"],
      [[0,0,1.4],  [0,0,1],  "Gene C", "#a78bfa"],
    ];

    for (const [tipV, , label, color] of AXES) {
      const [ex, ey] = pp2(tipV);
      // Axis line
      ctx.beginPath();
      ctx.moveTo(O[0], O[1]); ctx.lineTo(ex, ey);
      ctx.strokeStyle = color + "45";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Tick marks at −1, 0, +1
      for (const val of [-1, 0, 1]) {
        const tickV: V3 = [tipV[0] ? val/tipV[0]*tipV[0] : 0,
                           tipV[1] ? val/tipV[1]*tipV[1] : 0,
                           tipV[2] ? val/tipV[2]*tipV[2] : 0];
        // simplify: just scale the unit axis direction by val
        const unit: V3 = [tipV[0] ? val : 0, tipV[1] ? val : 0, tipV[2] ? val : 0];
        const [tx2, ty2] = pp2(unit);

        // Dot at tick
        ctx.beginPath();
        ctx.arc(tx2, ty2, val === 0 ? 2 : 3, 0, Math.PI * 2);
        ctx.fillStyle = val === 0 ? color + "55" : color + "99";
        ctx.fill();

        // Tick label
        if (val !== 0) {
          const tick2: V3 = [0, 0, 0];
          if (tipV[0]) tick2[0] = val; else if (tipV[1]) tick2[1] = val; else tick2[2] = val;
          ctx.font = "10px var(--font-mono, monospace)";
          ctx.textAlign = "center";
          ctx.fillStyle = color + "88";
          ctx.fillText(val === 1 ? "+1" : "−1", tx2, ty2 - 8);
        }
        // Suppress unused var warning
        void tickV;
      }

      // Axis label at tip
      const [lx, ly] = pp2([tipV[0]*1.22, tipV[1]*1.22, tipV[2]*1.22]);
      ctx.font = "bold 13px var(--font-mono, monospace)";
      ctx.textAlign = "center";
      const m = ctx.measureText(label);
      ctx.fillStyle = "rgba(1,4,10,0.85)";
      ctx.fillRect(lx - m.width/2 - 5, ly - 13, m.width + 10, 17);
      ctx.fillStyle = color + "ee";
      ctx.fillText(label, lx, ly);
    }

    // ── 4. Spokes ─────────────────────────────────────────────────────────────
    for (let i = 0; i < N_SMPL; i++) {
      const [px, py] = pp2(sg(i, N_SMPL));
      const [r, g, b] = timeCol(i);
      ctx.beginPath();
      ctx.moveTo(O[0], O[1]); ctx.lineTo(px, py);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.07)`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    // ── 5. Ring ───────────────────────────────────────────────────────────────
    const ringPts = rawRing.map(p => ppt(p as V3));

    ctx.beginPath();
    ctx.moveTo(ringPts[0][0], ringPts[0][1]);
    for (let i = 1; i <= N_RING; i++) ctx.lineTo(ringPts[i][0], ringPts[i][1]);
    ctx.strokeStyle = "rgba(93, 202, 165, 0.13)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    for (let i = 0; i < N_RING; i++) {
      const p0 = ringPts[i], p1 = ringPts[i+1];
      const bright = Math.max(0, Math.min(1, (-(p0[2]+p1[2])/2 + 1.2) / 2.4));
      if (bright < 0.08) continue;
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]);
      ctx.strokeStyle = `rgba(93, 202, 165, ${0.08 + bright * 0.62})`;
      ctx.lineWidth = 1 + bright * 2.8;
      ctx.stroke();
    }

    // ── 6. Sample dots ────────────────────────────────────────────────────────
    const samples = Array.from({ length: N_SMPL }, (_, i) => {
      const p = ppt(sg(i, N_SMPL));
      const [r, g, b] = timeCol(i);
      return { p, r, g, b };
    }).sort((a, b) => a.p[2] - b.p[2]);

    for (const { p: [px, py, pz], r, g, b } of samples) {
      const bright = Math.max(0.3, Math.min(1, (-pz + 1.4) / 2.8));
      ctx.beginPath();
      ctx.arc(px, py, 3 + bright * 2.5, 0, Math.PI * 2);
      if (bright > 0.65) { ctx.shadowColor = `rgb(${r},${g},${b})`; ctx.shadowBlur = 10; }
      ctx.fillStyle = `rgba(${r},${g},${b},${0.45 + bright * 0.5})`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // ── 7. Tracer ─────────────────────────────────────────────────────────────
    const [tx, ty, tz] = ppt(sg(t, N_SMPL));
    const tb = Math.max(0.5, (-tz + 1.4) / 2.8);
    ctx.beginPath();
    ctx.arc(tx, ty, 9, 0, Math.PI * 2);
    ctx.shadowColor = "#EF9F27"; ctx.shadowBlur = 22;
    ctx.fillStyle = `rgba(239,159,39,${0.55 + tb * 0.45})`;
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(tx, ty, 14, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(239,159,39,${0.12 + tb * 0.22})`;
    ctx.lineWidth = 1.5; ctx.stroke();

    // ── 8. Phase labels on ring ───────────────────────────────────────────────
    ctx.font = "bold 12px var(--font-mono, monospace)";
    for (const [h, text] of [[0,"12am"],[6,"6am"],[12,"12pm"],[18,"6pm"]] as [number,string][]) {
      const p = sg(h, N_SMPL);
      const outer: V3 = [p[0]*1.28, p[1]*1.28, p[2]*1.28];
      const [lx, ly, lz] = ppt(outer);
      const lb = Math.max(0.3, (-lz + 1.4) / 2.8);
      ctx.textAlign = "center";
      const m = ctx.measureText(text);
      ctx.fillStyle = `rgba(1,4,10,${0.75*lb})`;
      ctx.fillRect(lx - m.width/2 - 4, ly - 12, m.width + 8, 16);
      ctx.fillStyle = `rgba(220,230,255,${0.5 + lb * 0.45})`;
      ctx.fillText(text, lx, ly);
    }

    // ── 9. Footer ─────────────────────────────────────────────────────────────
    ctx.font = "10px var(--font-mono, monospace)";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(100, 125, 170, 0.5)";
    ctx.fillText("dashed ellipses = 2D projections of the 3D circle · each encodes circadian order · drag to rotate", cx, H - 14);

  }, []);

  const animate = useCallback(() => {
    if (introStarted.current) st.current.intro = Math.min(1, st.current.intro + 1/100);
    if (!st.current.drag) {
      st.current.ry += 0.005;
      st.current.t   = (st.current.t + 0.025) % N_SMPL;
    }
    draw();
    st.current.raf = requestAnimationFrame(animate);
  }, [draw]);

  useEffect(() => {
    st.current.raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(st.current.raf);
  }, [animate]);

  const onDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const p = "touches" in e ? e.touches[0] : e;
    st.current.drag = true; st.current.lx = p.clientX; st.current.ly = p.clientY;
  }, []);
  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!st.current.drag) return;
    const p = "touches" in e ? e.touches[0] : e;
    st.current.ry += (p.clientX - st.current.lx) * 0.012;
    st.current.rx  = Math.max(-1.2, Math.min(1.2, st.current.rx + (p.clientY - st.current.ly) * 0.008));
    st.current.lx = p.clientX; st.current.ly = p.clientY;
  }, []);
  const onUp = useCallback(() => { st.current.drag = false; }, []);

  return (
    <div className="w-full rounded overflow-hidden"
      style={{ border: "1px solid var(--site-border)", background: "#010408" }}>
      <motion.canvas
        ref={canvasRef}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ width: "100%", display: "block", cursor: "grab" }}
        onMouseDown={onDown as React.MouseEventHandler}
        onMouseMove={onMove as React.MouseEventHandler}
        onMouseUp={onUp} onMouseLeave={onUp}
        onTouchStart={onDown as React.TouchEventHandler}
        onTouchMove={onMove as React.TouchEventHandler}
        onTouchEnd={onUp}
      />

      <div className="flex items-center gap-3 px-4 pb-3 pt-2 flex-wrap text-[9px]"
        style={{ color: "var(--site-text-muted)", fontFamily: "var(--font-mono)" }}>
        <span style={{ color: "#60a5ff" }}>■ Gene A</span>
        <span style={{ color: "#db7093" }}>■ Gene B</span>
        <span style={{ color: "#a78bfa" }}>■ Gene C</span>
        <span>·</span>
        <span style={{ color: "#60a5ff88" }}>- - Gene A×B ellipse</span>
        <span style={{ color: "#a78bfa88" }}>- - Gene A×C ellipse</span>
        <span style={{ color: "#db709388" }}>- - Gene B×C ellipse</span>
        <span>·</span>
        <span style={{ color: "#EF9F27" }}>● now</span>
        <span className="ml-auto opacity-50">CYCLOPS · Anafi et al. 2017</span>
      </div>
    </div>
  );
}
