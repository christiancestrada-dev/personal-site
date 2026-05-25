"use client";
import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// ── Adenosine / Melatonin Phase Space ─────────────────────────────────────────
// Parametric 3D trajectory over time:
//   X = circadian alerting signal C(t)
//   Y = homeostatic pressure S(t)  (adenosine proxy)
//   Z = time (hours, 3-day cycle)
//
// Wake episode traces one orbit; sleep traces the recovery arc.
// The 3D path forms a toroidal helix — different from a simple circle
// because Process S charges during wake and decays during sleep.

const HOURS_TOTAL = 72; // 3 complete days
const N_PTS = 1440;     // 10 pts/hour → smooth curve
const SLEEP_START = 23; // 11 pm
const SLEEP_END   = 7;  // 7 am

function circadian(h: number) {
  return 0.75 * Math.cos(2 * Math.PI * (h - 9) / 24)
       + 0.22 * Math.cos(4 * Math.PI * (h - 9) / 24);
}

function isAwake(h: number) {
  const hmod = ((h % 24) + 24) % 24;
  return hmod >= SLEEP_END && hmod < SLEEP_START;
}

// Build trajectory once
type TrajPt = { pos: [number, number, number]; wake: boolean; t: number };
const TRAJ: TrajPt[] = (() => {
  const pts: TrajPt[] = [];
  let s = 0.2; // starting homeostatic pressure (just woke)
  for (let i = 0; i <= N_PTS; i++) {
    const t = (i / N_PTS) * HOURS_TOTAL;
    const c = circadian(t);
    const wake = isAwake(t);
    const dt = HOURS_TOTAL / N_PTS;
    if (wake) s += (1 - s) * (1 - Math.exp(-dt / 14));  // rises toward 1
    else      s -= s       * (1 - Math.exp(-dt / 4.2)); // decays toward 0
    s = Math.max(0, Math.min(1, s));
    // Normalize c: roughly −1.0 to +1.0 → keep raw
    // Normalize s: 0..1 → map to −1..+1
    const z = (t / HOURS_TOTAL) * 2 - 1;
    pts.push({ pos: [c, s * 2 - 1, z], wake, t });
  }
  return pts;
})();

type V3 = [number, number, number];
const FOV = 4.2;

function rotY(v: V3, a: number): V3 { const c=Math.cos(a),s=Math.sin(a); return [v[0]*c+v[2]*s,v[1],-v[0]*s+v[2]*c]; }
function rotX(v: V3, a: number): V3 { const c=Math.cos(a),s=Math.sin(a); return [v[0],v[1]*c-v[2]*s,v[1]*s+v[2]*c]; }
function proj(v: V3, cx: number, cy: number, sc: number): [number, number, number] {
  const d = FOV / (FOV + v[2] + 2.5);
  return [cx + v[0]*sc*d, cy - v[1]*sc*d, v[2]];
}

const CUBE_EDGES: [V3, V3][] = [
  [[-1,-1,-1],[1,-1,-1]], [[-1,1,-1],[1,1,-1]], [[-1,-1,1],[1,-1,1]], [[-1,1,1],[1,1,1]],
  [[-1,-1,-1],[-1,1,-1]], [[1,-1,-1],[1,1,-1]], [[-1,-1,1],[-1,1,1]], [[1,-1,1],[1,1,1]],
  [[-1,-1,-1],[-1,-1,1]], [[1,-1,-1],[1,-1,1]], [[-1,1,-1],[-1,1,1]], [[1,1,-1],[1,1,1]],
];

const LW = 900, LH = 480;

export function PhaseSpace3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const st = useRef({ ry: -0.4, rx: 0.38, drag: false, lx: 0, ly: 0, raf: 0, tracer: 0, intro: 0 });
  const introStarted = useRef(false);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = LW*dpr; c.height = LH*dpr;
    c.getContext("2d")!.scale(dpr, dpr);
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { introStarted.current = true; obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(c);
    return () => obs.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const { ry: rotYAng, rx: rotXAng, tracer, intro } = st.current;
    const introEase = 1 - Math.pow(1 - intro, 3);
    const W=LW, H=LH, cx=W/2, cy=H*0.48, sc=W*0.27;

    ctx.fillStyle="#010509"; ctx.fillRect(0,0,W,H);
    const bg = ctx.createRadialGradient(cx,cy*0.8,0,cx,cy*0.8,W*0.5);
    bg.addColorStop(0,"rgba(10,5,30,0.8)"); bg.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    function ppt(v: V3): [number,number,number] {
      return proj(rotX(rotY(v, rotYAng), rotXAng), cx, cy, sc);
    }
    function pp2(v: V3): [number,number] { const r=ppt(v); return [r[0],r[1]]; }

    // Cube
    ctx.lineWidth=0.6;
    for (const [a, b] of CUBE_EDGES) {
      const pa=ppt(a), pb=ppt(b);
      ctx.beginPath(); ctx.moveTo(pa[0],pa[1]); ctx.lineTo(pb[0],pb[1]);
      ctx.strokeStyle="rgba(60,80,120,0.18)"; ctx.stroke();
    }

    // Project trajectory points
    type SegPt = { px: number; py: number; pz: number; wake: boolean; idx: number };
    const projected: SegPt[] = TRAJ.map((pt, idx) => {
      const r = ppt(pt.pos);
      return { px: r[0], py: r[1], pz: r[2], wake: pt.wake, idx };
    });

    // Depth-sort segments (only up to intro cutoff for draw-in effect)
    const cutoff = Math.floor(introEase * (projected.length - 1));
    type Seg = { i: number; depth: number };
    const segs: Seg[] = [];
    for (let i=0; i<cutoff; i++) {
      segs.push({ i, depth: (projected[i].pz + projected[i+1].pz)/2 });
    }
    segs.sort((a,b)=>a.depth-b.depth);

    // Draw segments
    for (const {i} of segs) {
      const a=projected[i], b=projected[i+1];
      const dayFrac = TRAJ[i].t / HOURS_TOTAL;
      const alpha = 0.55 + dayFrac * 0.30; // older days slightly dimmer
      ctx.beginPath(); ctx.moveTo(a.px,a.py); ctx.lineTo(b.px,b.py);
      if (a.wake) {
        // Wake: warm amber→gold
        const r=210+Math.round(dayFrac*20), g=140+Math.round(dayFrac*30), bl=30;
        ctx.strokeStyle=`rgba(${r},${g},${bl},${alpha})`;
        ctx.lineWidth=1.5;
      } else {
        // Sleep: cool blue→violet
        const r=80+Math.round(dayFrac*40), g=100+Math.round(dayFrac*20), bl=220;
        ctx.strokeStyle=`rgba(${r},${g},${bl},${alpha})`;
        ctx.lineWidth=1.5;
      }
      ctx.stroke();
    }

    // Tracer dot — appears only after trajectory is mostly drawn
    if (intro > 0.85) {
      const tracerAlpha = Math.min(1, (intro - 0.85) / 0.15);
      const ti = Math.floor(tracer * (TRAJ.length - 1));
      const tp = projected[ti];
      const isWake = TRAJ[ti].wake;
      const col = isWake ? "#EFA827" : "#8080DD";
      ctx.globalAlpha = tracerAlpha;
      ctx.beginPath();
      ctx.arc(tp.px, tp.py, 5, 0, Math.PI*2);
      ctx.fillStyle=col;
      ctx.shadowColor=col; ctx.shadowBlur=14;
      ctx.fill(); ctx.shadowBlur=0;
      ctx.globalAlpha = 1;
    }

    // Axis labels
    const c2d = ctx;
    function lbl(text: string, x: number, y: number, align: "center"|"right"|"left", color: string) {
      c2d.textAlign=align;
      const m=c2d.measureText(text), pad=4;
      const bx=align==="center"?x-m.width/2-pad:align==="right"?x-m.width-pad:x-pad;
      c2d.fillStyle="rgba(1,4,10,0.85)"; c2d.fillRect(bx,y-12,m.width+pad*2,16);
      c2d.fillStyle=color; c2d.fillText(text,x,y);
    }

    c2d.font="bold 12px var(--font-mono,'Courier New',monospace)";

    // Z axis (time): bottom-to-top on the left edge
    for (const [val, label] of [[-1,"day 1"],[0,"day 2"],[1,"day 3"]] as [number,string][]) {
      const [px,py]=pp2([-1,-1,val]);
      lbl(label,px-8,py,"right","rgba(160,180,220,0.85)");
    }
    const [zf,zb]=[pp2([-1,-1,-1]),pp2([-1,-1,1])];
    c2d.font="11px var(--font-mono,'Courier New',monospace)";
    lbl("time",(zf[0]+zb[0])/2-14,(zf[1]+zb[1])/2-4,"right","rgba(130,155,200,0.65)");

    // X axis (circadian C): front-bottom edge
    c2d.font="bold 12px var(--font-mono,'Courier New',monospace)";
    for (const [val,label] of [[-1,"low"],[0,"mid"],[1,"high"]] as [number,string][]) {
      const [px,py]=pp2([val,-1,1]);
      lbl(label,px,py+16,"center","rgba(93,202,165,0.85)");
    }
    const [xL,xR]=[pp2([-1,-1,1]),pp2([1,-1,1])];
    c2d.font="11px var(--font-mono,'Courier New',monospace)";
    lbl("circadian signal C(t)",(xL[0]+xR[0])/2,(xL[1]+xR[1])/2+30,"center","rgba(93,202,165,0.65)");

    // Y axis (homeostatic): back-left
    c2d.font="bold 12px var(--font-mono,'Courier New',monospace)";
    for (const [val,label] of [[-1,"low"],[0,"mid"],[1,"high"]] as [number,string][]) {
      const [px,py]=pp2([-1,val,-1]);
      lbl(label,px-8,py,"right","rgba(219,112,147,0.85)");
    }
    const [yb,yt]=[pp2([-1,-1,-1]),pp2([-1,1,-1])];
    c2d.font="11px var(--font-mono,'Courier New',monospace)";
    lbl("sleep pressure S(t)",(yb[0]+yt[0])/2-14,(yb[1]+yt[1])/2,"right","rgba(219,112,147,0.65)");

    // Legend
    c2d.font="bold 11px var(--font-mono,'Courier New',monospace)";
    const [lx,ly]=pp2([1,1,-1]);
    lbl("▬ wake (adenosine ↑)", lx-10, ly-10, "right", "#EFA827");
    lbl("▬ sleep (adenosine ↓)", lx-10, ly+6, "right", "#8080DD");

  }, []);

  const animate = useCallback(() => {
    if (introStarted.current) st.current.intro = Math.min(1, st.current.intro + 1/120);
    if (!st.current.drag) st.current.ry += 0.004;
    st.current.tracer = (st.current.tracer + 0.002) % 1;
    draw(); st.current.raf = requestAnimationFrame(animate);
  }, [draw]);

  useEffect(() => {
    st.current.raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(st.current.raf);
  }, [animate]);

  const onDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const p="touches" in e ? e.touches[0] : e;
    st.current.drag=true; st.current.lx=p.clientX; st.current.ly=p.clientY;
  }, []);
  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!st.current.drag) return;
    const p="touches" in e ? e.touches[0] : e;
    st.current.ry+=(p.clientX-st.current.lx)*0.012;
    st.current.rx=Math.max(-0.1,Math.min(1.2,st.current.rx+(p.clientY-st.current.ly)*0.008));
    st.current.lx=p.clientX; st.current.ly=p.clientY;
  }, []);
  const onUp = useCallback(() => { st.current.drag=false; }, []);

  return (
    <div className="w-full rounded overflow-hidden" style={{ border:"1px solid var(--site-border)", background:"#010509" }}>
      <motion.canvas
        ref={canvasRef}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ width:"100%", display:"block", cursor:"grab" }}
        onMouseDown={onDown as React.MouseEventHandler} onMouseMove={onMove as React.MouseEventHandler}
        onMouseUp={onUp} onMouseLeave={onUp}
        onTouchStart={onDown as React.TouchEventHandler} onTouchMove={onMove as React.TouchEventHandler} onTouchEnd={onUp}
      />
      <div className="flex items-center gap-3 px-4 pb-3 pt-2 flex-wrap text-[9px]" style={{ color:"var(--site-text-muted)", fontFamily:"var(--font-mono)" }}>
        <span style={{ color:"#EFA827" }}>■ wake (adenosine ↑)</span>
        <span style={{ color:"#8080DD" }}>■ sleep (adenosine ↓)</span>
        <span className="ml-auto opacity-50">Two-Process trajectory · 3-day orbit · drag to rotate</span>
      </div>
    </div>
  );
}
