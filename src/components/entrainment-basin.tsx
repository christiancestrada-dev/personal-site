"use client";
import { useRef, useEffect, useCallback } from "react";

// ── Circadian Entrainment Basin ───────────────────────────────────────────────
// Shows how long re-entrainment takes as a function of:
//   X = light schedule offset from ideal (hours)
//   Z = initial phase error (hours jet-lagged)
//   Y = days until re-entrained (lower = faster)
// The bowl shape reveals the "sweet spot" — get timing right and you recover fast.

const NX = 38, NZ = 38;
const LIGHT_RANGE = 8;   // ±8h light timing offset
const PHASE_RANGE = 12;  // ±12h initial phase error
const D_MAX = 16;        // max days shown

function correctionRate(lightOff: number, dir: number): number {
  const ideal = dir > 0 ? 0 : 2.5;
  const dev = lightOff - ideal;
  const peak = dir > 0 ? 1.55 : 1.25;
  return peak * Math.exp(-(dev * dev) / 9) + 0.07;
}

function daysToEntrain(lightOff: number, phaseErr: number): number {
  if (Math.abs(phaseErr) < 0.08) return 0;
  return Math.min(D_MAX, Math.abs(phaseErr) / correctionRate(lightOff, phaseErr > 0 ? 1 : -1));
}

function normD(d: number) { return Math.max(0, Math.min(1, d / D_MAX)); }

function dColor(t: number): [number, number, number] {
  if (t < 0.5) {
    const s = t * 2;
    return [Math.round(93 + (210-93)*s), Math.round(202 + (112-202)*s), Math.round(165 + (48-165)*s)];
  }
  const s = (t - 0.5) * 2;
  return [Math.round(210 + (219-210)*s), Math.round(112 + (112-112)*s), Math.round(48 + (147-48)*s)];
}

type V3 = [number, number, number];
const Y_SCALE = 0.55;
const FOV = 4.2;

function ry(v: V3, a: number): V3 { const c=Math.cos(a),s=Math.sin(a); return [v[0]*c+v[2]*s,v[1],-v[0]*s+v[2]*c]; }
function rx(v: V3, a: number): V3 { const c=Math.cos(a),s=Math.sin(a); return [v[0],v[1]*c-v[2]*s,v[1]*s+v[2]*c]; }
function proj(v: V3, cx: number, cy: number, sc: number): [number,number,number] {
  const d = FOV / (FOV + v[2] + 2.5);
  return [cx + v[0]*sc*d, cy - v[1]*sc*d, v[2]];
}

type GPt = { pos: V3; days: number };
const GRID: GPt[][] = (() => {
  const g: GPt[][] = [];
  for (let iz = 0; iz <= NZ; iz++) {
    g[iz] = [];
    for (let ix = 0; ix <= NX; ix++) {
      const lightOff = ((ix/NX)*2 - 1) * LIGHT_RANGE;
      const phaseErr = ((iz/NZ)*2 - 1) * PHASE_RANGE;
      const days = daysToEntrain(lightOff, phaseErr);
      g[iz][ix] = { pos: [(ix/NX)*2-1, days*Y_SCALE/D_MAX, (iz/NZ)*2-1], days };
    }
  }
  return g;
})();

const LW = 900, LH = 480;

export function EntrainmentBasin() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const st = useRef({ ry: -0.5, rx: 0.42, drag: false, lx: 0, ly: 0, raf: 0 });

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = LW*dpr; c.height = LH*dpr;
    c.getContext("2d")!.scale(dpr, dpr);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const { ry: rotY, rx: rotX } = st.current;
    const W=LW, H=LH, cx=W/2, cy=H*0.50, sc=W*0.32;

    ctx.fillStyle = "#010509"; ctx.fillRect(0,0,W,H);
    const bg = ctx.createRadialGradient(cx,cy*0.75,0,cx,cy*0.75,W*0.52);
    bg.addColorStop(0,"rgba(5,20,15,0.7)"); bg.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    function ppt(v: V3): [number,number,number] { return proj(rx(ry(v,rotY),rotX),cx,cy,sc); }
    function pp2(v: V3): [number,number] { const r=ppt(v); return [r[0],r[1]]; }

    const proj2d: [number,number,number][][] = GRID.map(row => row.map(({pos}) => ppt(pos)));

    type Face = { p:[number,number][]; depth:number; days:number };
    const faces: Face[] = [];
    for (let iz=0; iz<NZ; iz++) {
      for (let ix=0; ix<NX; ix++) {
        const p0=proj2d[iz][ix], p1=proj2d[iz][ix+1], p2=proj2d[iz+1][ix+1], p3=proj2d[iz+1][ix];
        const h=(ix+0.5)/NX, z=(iz+0.5)/NZ;
        faces.push({
          p:[[p0[0],p0[1]],[p1[0],p1[1]],[p2[0],p2[1]],[p3[0],p3[1]]],
          depth:(p0[2]+p1[2]+p2[2]+p3[2])/4,
          days:daysToEntrain(((h*2-1)*LIGHT_RANGE),((z*2-1)*PHASE_RANGE)),
        });
      }
    }
    faces.sort((a,b)=>a.depth-b.depth);

    for (const {p, days} of faces) {
      const t=normD(days), [r,g,b]=dColor(t);
      ctx.beginPath();
      ctx.moveTo(p[0][0],p[0][1]); ctx.lineTo(p[1][0],p[1][1]);
      ctx.lineTo(p[2][0],p[2][1]); ctx.lineTo(p[3][0],p[3][1]);
      ctx.closePath();
      if (t < 0.15) { ctx.shadowColor=`rgb(${r},${g},${b})`; ctx.shadowBlur=8; }
      ctx.fillStyle=`rgba(${r},${g},${b},0.85)`; ctx.fill(); ctx.shadowBlur=0;
      ctx.strokeStyle="rgba(1,5,10,0.85)"; ctx.lineWidth=0.5; ctx.stroke();
    }

    // Floor frame
    const yFloor = 0;
    const corners = [pp2([-1,yFloor,-1]),pp2([1,yFloor,-1]),pp2([1,yFloor,1]),pp2([-1,yFloor,1])];
    ctx.beginPath(); ctx.moveTo(corners[0][0],corners[0][1]);
    corners.forEach(([x,y])=>ctx.lineTo(x,y)); ctx.closePath();
    ctx.strokeStyle="rgba(60,100,80,0.2)"; ctx.lineWidth=1; ctx.stroke();

    // Labels
    const c2d = ctx;
    function lbl(text:string,x:number,y:number,align:"center"|"right"|"left",color:string) {
      c2d.textAlign=align;
      const m=c2d.measureText(text), pad=4;
      const bx=align==="center"?x-m.width/2-pad:align==="right"?x-m.width-pad:x-pad;
      c2d.fillStyle="rgba(1,5,10,0.82)"; c2d.fillRect(bx,y-12,m.width+pad*2,16);
      c2d.fillStyle=color; c2d.fillText(text,x,y);
    }

    c2d.font="bold 12px var(--font-mono,'Courier New',monospace)";
    for (const off of [-8,-4,0,4,8]) {
      const [px,py]=pp2([(off/LIGHT_RANGE),(yFloor),1]);
      lbl(`${off>0?"+":""}${off}h`,px,py+16,"center","rgba(180,210,195,0.9)");
    }
    const [xML,xMR]=[pp2([-1,yFloor,1]),pp2([1,yFloor,1])];
    c2d.font="11px var(--font-mono,'Courier New',monospace)";
    lbl("light timing offset",(xML[0]+xMR[0])/2,(xML[1]+xMR[1])/2+30,"center","rgba(140,175,160,0.7)");

    c2d.font="bold 12px var(--font-mono,'Courier New',monospace)";
    for (const err of [-12,-6,0,6,12]) {
      const [px,py]=pp2([-1,yFloor,(err/PHASE_RANGE)]);
      lbl(`${err>0?"+":""}${err}h`,px-8,py+4,"right","rgba(180,210,195,0.9)");
    }
    const [zMF,zMB]=[pp2([-1,yFloor,1]),pp2([-1,yFloor,-1])];
    c2d.font="11px var(--font-mono,'Courier New',monospace)";
    lbl("phase error",(zMF[0]+zMB[0])/2,(zMF[1]+zMB[1])/2-2,"right","rgba(140,175,160,0.7)");

    // Y axis labels
    c2d.font="bold 12px var(--font-mono,'Courier New',monospace)";
    for (const [d,text] of [[0,"0 days"],[4,"4d"],[8,"8d"],[14,"14d"]] as [number,string][]) {
      const [px,py]=pp2([-1, d*Y_SCALE/D_MAX,-1]);
      const t=normD(d), [r,g,b]=dColor(t);
      lbl(text,px-10,py+4,"right",`rgba(${r},${g},${b},0.9)`);
    }

  }, []);

  const animate = useCallback(() => {
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
      <canvas ref={canvasRef} style={{ width:"100%", display:"block", cursor:"grab" }}
        onMouseDown={onDown as React.MouseEventHandler} onMouseMove={onMove as React.MouseEventHandler}
        onMouseUp={onUp} onMouseLeave={onUp}
        onTouchStart={onDown as React.TouchEventHandler} onTouchMove={onMove as React.TouchEventHandler} onTouchEnd={onUp}
      />
      <div className="flex items-center gap-3 px-4 pb-3 pt-2 flex-wrap text-[9px]" style={{ color:"var(--site-text-muted)", fontFamily:"var(--font-mono)" }}>
        <span style={{ color:"#5dcaa5" }}>■ fast (&lt;2d)</span>
        <span style={{ color:"#d07030" }}>■ moderate</span>
        <span style={{ color:"#db7093" }}>■ slow (&gt;12d)</span>
        <span className="ml-auto opacity-50">Based on PRC correction rates · drag to rotate</span>
      </div>
    </div>
  );
}
