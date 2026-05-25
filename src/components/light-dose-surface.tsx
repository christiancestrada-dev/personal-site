"use client";
import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// ── Light Dose-Response Surface ───────────────────────────────────────────────
// 3D extension of the light PRC that adds intensity (lux) as a dimension.
//   X = time of day (0–24 h, normalized to −1..+1)
//   Z = log10(lux) from 1 lux → 100,000 lux (range 0..5, normalized −1..+1)
//   Y = phase shift magnitude (hours, signed: + = advance, − = delay)
//
// Phase-shift sign follows standard PRC shape (delay first half, advance second).
// Intensity scaling: Hill function  effect = lux^n / (K^n + lux^n), n≈0.7, K≈200 lux
// So dim room-light (~50 lux) causes little shift; bright outdoor (10K+) causes large shift.

const NX = 40, NZ = 32;
const LUX_LOG_MAX = 5;   // 10^5 = 100,000 lux
const D_MAX = 2.5;       // ±2.5h max phase shift shown

function prcBase(h: number): number {
  // Continuous PRC: delay trough around midnight, advance peak around dawn
  // h in 0..24 → normalized to radians
  const x = (h / 24) * 2 * Math.PI;
  // Primary delay lobe (−, centered ~2am) + advance lobe (+, centered ~7am)
  const delay  = -1.0 * Math.exp(-Math.pow(h -  2, 2) / 18);
  const advance = 1.1 * Math.exp(-Math.pow(h -  7, 2) / 12);
  const advance2= 0.4 * Math.exp(-Math.pow(h - 20, 2) / 10);  // small evening advance
  // Suppress effect during subjective night interior (deep dead zone ~11pm)
  const deadZone = 0.3 * Math.exp(-Math.pow(h - 23, 2) / 5);
  return delay + advance + advance2 - deadZone + 0.05 * Math.cos(x);
}

function hillScale(logLux: number): number {
  // logLux: 0..5 → lux: 1..100000
  const lux = Math.pow(10, logLux);
  const K = 200, n = 0.7;
  return Math.pow(lux, n) / (Math.pow(K, n) + Math.pow(lux, n));
}

function phaseShift(h: number, logLux: number): number {
  if (logLux < 0.1) return 0;
  return Math.max(-D_MAX, Math.min(D_MAX, prcBase(h) * hillScale(logLux) * D_MAX));
}

function normPS(ps: number) { return Math.max(0, Math.min(1, (ps + D_MAX) / (2 * D_MAX))); }

function psColor(t: number): [number, number, number] {
  // Delay (t near 0) → rose pink; neutral (t≈0.5) → dark; advance (t near 1) → teal
  if (t < 0.5) {
    const s = t * 2;
    return [Math.round(219 + (40 - 219) * s), Math.round(112 + (30 - 112) * s), Math.round(147 + (80 - 147) * s)];
  }
  const s = (t - 0.5) * 2;
  return [Math.round(40 + (93 - 40) * s), Math.round(30 + (202 - 30) * s), Math.round(80 + (165 - 80) * s)];
}

type V3 = [number, number, number];
const Y_SCALE = 0.55;
const FOV = 4.2;

function rotY(v: V3, a: number): V3 { const c=Math.cos(a),s=Math.sin(a); return [v[0]*c+v[2]*s,v[1],-v[0]*s+v[2]*c]; }
function rotX(v: V3, a: number): V3 { const c=Math.cos(a),s=Math.sin(a); return [v[0],v[1]*c-v[2]*s,v[1]*s+v[2]*c]; }
function proj(v: V3, cx: number, cy: number, sc: number): [number, number, number] {
  const d = FOV / (FOV + v[2] + 2.5);
  return [cx + v[0]*sc*d, cy - v[1]*sc*d, v[2]];
}

type GPt = { pos: V3; ps: number };
const GRID: GPt[][] = (() => {
  const g: GPt[][] = [];
  for (let iz = 0; iz <= NZ; iz++) {
    g[iz] = [];
    for (let ix = 0; ix <= NX; ix++) {
      const h = (ix / NX) * 24;
      const logLux = (iz / NZ) * LUX_LOG_MAX;
      const ps = phaseShift(h, logLux);
      g[iz][ix] = { pos: [(ix/NX)*2-1, ps * Y_SCALE / D_MAX, (iz/NZ)*2-1], ps };
    }
  }
  return g;
})();

const LW = 900, LH = 480;

export function LightDoseSurface() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const st = useRef({ ry: -0.5, rx: 0.42, drag: false, lx: 0, ly: 0, raf: 0, intro: 0 });
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
    const { ry: rotYAng, rx: rotXAng, intro } = st.current;
    const introEase = 1 - Math.pow(1 - intro, 3);
    const W=LW, H=LH, cx=W/2, cy=H*0.50, sc=W*0.32;

    ctx.fillStyle="#010509"; ctx.fillRect(0,0,W,H);
    const bg = ctx.createRadialGradient(cx,cy*0.75,0,cx,cy*0.75,W*0.52);
    bg.addColorStop(0,"rgba(10,5,25,0.75)"); bg.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    function ppt(v: V3): [number,number,number] {
      return proj(rotX(rotY(v, rotYAng), rotXAng), cx, cy, sc);
    }
    function pp2(v: V3): [number,number] { const r=ppt(v); return [r[0],r[1]]; }

    const proj2d = GRID.map(row => row.map(({pos}) => ppt([pos[0], pos[1]*introEase, pos[2]])));

    type Face = { p:[number,number][]; depth:number; ps:number };
    const faces: Face[] = [];
    for (let iz=0; iz<NZ; iz++) {
      for (let ix=0; ix<NX; ix++) {
        const p0=proj2d[iz][ix], p1=proj2d[iz][ix+1], p2=proj2d[iz+1][ix+1], p3=proj2d[iz+1][ix];
        faces.push({
          p:[[p0[0],p0[1]],[p1[0],p1[1]],[p2[0],p2[1]],[p3[0],p3[1]]],
          depth:(p0[2]+p1[2]+p2[2]+p3[2])/4,
          ps:phaseShift(((ix+0.5)/NX)*24, ((iz+0.5)/NZ)*LUX_LOG_MAX),
        });
      }
    }
    faces.sort((a,b)=>a.depth-b.depth);

    for (const {p, ps} of faces) {
      const t=normPS(ps), [r,g,b]=psColor(t);
      ctx.beginPath();
      ctx.moveTo(p[0][0],p[0][1]); ctx.lineTo(p[1][0],p[1][1]);
      ctx.lineTo(p[2][0],p[2][1]); ctx.lineTo(p[3][0],p[3][1]);
      ctx.closePath();
      const nearZero = Math.abs(ps) < 0.1;
      if (!nearZero && Math.abs(t - 0.5) > 0.35) {
        ctx.shadowColor=`rgb(${r},${g},${b})`; ctx.shadowBlur=7;
      }
      ctx.fillStyle=`rgba(${r},${g},${b},0.85)`; ctx.fill(); ctx.shadowBlur=0;
      ctx.strokeStyle="rgba(1,5,10,0.8)"; ctx.lineWidth=0.45; ctx.stroke();
    }

    // Zero-plane reference frame
    const yZero = 0;
    const corners = [pp2([-1,yZero,-1]),pp2([1,yZero,-1]),pp2([1,yZero,1]),pp2([-1,yZero,1])];
    ctx.beginPath(); ctx.moveTo(corners[0][0],corners[0][1]);
    corners.forEach(([x,y])=>ctx.lineTo(x,y)); ctx.closePath();
    ctx.strokeStyle="rgba(120,120,180,0.2)"; ctx.lineWidth=1; ctx.stroke();

    const c2d = ctx;
    function lbl(text: string, x: number, y: number, align: "center"|"right"|"left", color: string) {
      c2d.textAlign=align;
      const m=c2d.measureText(text), pad=4;
      const bx=align==="center"?x-m.width/2-pad:align==="right"?x-m.width-pad:x-pad;
      c2d.fillStyle="rgba(1,4,10,0.85)"; c2d.fillRect(bx,y-12,m.width+pad*2,16);
      c2d.fillStyle=color; c2d.fillText(text,x,y);
    }

    // X axis: clock time
    c2d.font="bold 12px var(--font-mono,'Courier New',monospace)";
    for (const h of [0,6,12,18]) {
      const x=(h/24)*2-1;
      const [px,py]=pp2([x,yZero,1]);
      const label=h===0?"12am":h===12?"12pm":`${h<12?h:h-12}${h<12?"am":"pm"}`;
      lbl(label,px,py+16,"center","rgba(180,205,240,0.92)");
    }
    const [xL,xR]=[pp2([-1,yZero,1]),pp2([1,yZero,1])];
    c2d.font="11px var(--font-mono,'Courier New',monospace)";
    lbl("clock time",(xL[0]+xR[0])/2,(xL[1]+xR[1])/2+30,"center","rgba(160,180,220,0.7)");

    // Z axis: lux intensity
    c2d.font="bold 12px var(--font-mono,'Courier New',monospace)";
    for (const [ll,label] of [[0,"1 lx"],[1,"10"],[2,"100"],[3,"1K"],[4,"10K"],[5,"100K"]] as [number,string][]) {
      const z=(ll/LUX_LOG_MAX)*2-1;
      const [px,py]=pp2([-1,yZero,z]);
      lbl(label,px-8,py+4,"right","rgba(180,205,240,0.92)");
    }
    const [zF,zB]=[pp2([-1,yZero,1]),pp2([-1,yZero,-1])];
    c2d.font="11px var(--font-mono,'Courier New',monospace)";
    lbl("light intensity (lux)",(zF[0]+zB[0])/2,(zF[1]+zB[1])/2-4,"right","rgba(160,180,220,0.7)");

    // Y axis: phase shift (scale positions by introEase to match surface animation)
    c2d.font="bold 12px var(--font-mono,'Courier New',monospace)";
    for (const [ps,text] of [[-2.5,"−2.5h (delay)"],[-1,"−1h"],[0,"0h"],[1,"+1h"],[2.5,"+2.5h (advance)"]] as [number,string][]) {
      const [px,py]=pp2([-1, ps*Y_SCALE/D_MAX*introEase, -1]);
      const t=normPS(ps), [r,g,b]=psColor(t);
      lbl(text,px-10,py+4,"right",`rgba(${r},${g},${b},0.9)`);
    }

  }, []);

  const animate = useCallback(() => {
    if (introStarted.current) st.current.intro = Math.min(1, st.current.intro + 1/100);
    if (!st.current.drag) st.current.ry += 0.004;
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
        <span style={{ color:"#5dcaa5" }}>■ advance</span>
        <span style={{ color:"#db7093" }}>■ delay</span>
        <span className="ml-auto opacity-50">Hill function intensity scaling · PRC × lux^0.7 / (200^0.7 + lux^0.7) · drag to rotate</span>
      </div>
    </div>
  );
}
