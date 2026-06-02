"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { CircadianClock } from "@/components/circadian-clock";

// ─── Annotated clock with arrow pointing to phase text ──────────────────────
function AnnotatedClock() {
  return (
    <div className="relative">
      {/* Label + arrow from the left */}
      <div
        className="absolute text-xs italic whitespace-nowrap"
        style={{
          color: "#ff6b60",
          right: "100%",
          top: "50%",
          transform: "translateY(-50%)",
          marginRight: 8,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          my live sleep phase!
        </motion.span>
        <motion.svg
          width="28" height="16" viewBox="0 0 28 16" fill="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3, duration: 0.5 }}
        >
          <motion.path
            d="M2 8 C10 8, 18 6, 24 8"
            stroke="#ff6b60" strokeWidth="1.5" fill="none" strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 2.5, duration: 0.6, ease: "easeOut" }}
          />
          <motion.path
            d="M21 4 L25 8 L21 12"
            stroke="#ff6b60" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 3, duration: 0.3 }}
          />
        </motion.svg>
      </div>
      <CircadianClock />
    </div>
  );
}

// ─── Orbital arcs ────────────────────────────────────────────────────────────
function OrbitalArcs({ isDark }: { isDark: boolean }) {
  const lineColor = isDark ? "rgba(200,220,255,0.25)" : "rgba(50,80,120,0.14)";
  const dotColor  = isDark ? "#c8dcff" : "rgba(35,60,110,0.9)";

  const o1 = "M 1390,-200 a 900,900 0 1,1 -1800,0 a 900,900 0 1,1 1800,0";
  const o2 = "M 1720,1500 a 1000,1000 0 1,1 -2000,0 a 1000,1000 0 1,1 2000,0";
  const m1 = "M 182,646 a 900,900 0 1,1 616,-1692 a 900,900 0 1,1 -616,1692";
  const m2 = "M 1170,607 a 1000,1000 0 1,1 -900,1786 a 1000,1000 0 1,1 900,-1786";

  const C1 = 5654.9;
  const gap = 32;
  const p1 = (16.8 / 55) * C1;
  const gapFrom = C1 - gap / 2 - p1;
  const gapTo   = gapFrom - C1;

  // Simple diamond shapes — rotate="auto" aligns long axis to path tangent
  const star   = "M 0,-11 L 18,0 L 0,11 L -18,0 Z";
  const starSm = "M 0,-10 L 16,0 L 0,10 L -16,0 Z";

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1440 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ zIndex: 0 }}
    >
      <defs>
        <path id="hero-m1" d={m1} />
        <path id="hero-m2" d={m2} />
      </defs>

      {/* ── Solid arc: draw in as solid, then switch to gap + run ── */}
      {/* opacity="0" prevents SSR flash; SMIL immediately overrides it */}
      <path d={o1} fill="none" stroke={lineColor} strokeWidth="1.0" opacity="0">
        <set attributeName="stroke-dasharray" to={`${C1} ${C1}`} />
        <set attributeName="stroke-dashoffset" to={String(C1)} />
        <animate attributeName="opacity" from="0" to="1" dur="0.4s" fill="freeze" />
        <animate
          id="arc1-draw"
          attributeName="stroke-dashoffset"
          from={String(C1)} to="0"
          dur="7s" fill="freeze"
          calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1"
        />
        <animate attributeName="stroke-dasharray" to={`${C1 - gap} ${gap}`} dur="0.001s" fill="freeze" begin="arc1-draw.end" />
        <animate attributeName="stroke-dashoffset" from={String(gapFrom)} to={String(gapTo)} dur="55s" repeatCount="indefinite" begin="arc1-draw.end" />
      </path>

      {/* ── Arc 1: erase diamond followed by actual diamond ── */}
      {Array.from({ length: Math.floor(55 / 21) }, (_, i) => -(i * 21)).map((offset, i) => (
        <g key={`s1-${i}`}>
          <animateMotion dur="55s" repeatCount="indefinite" rotate="auto" begin={`${offset}s`}>
            <mpath href="#hero-m1" />
          </animateMotion>
          {/* X matches diamond tip so the line connects flush; Y slightly wider to clear the crossing */}
          <path d="M 0,-15 L 19,0 L 0,15 L -19,0 Z" style={{ fill: "var(--site-bg)" }} />
          <path d={star} fill={dotColor} stroke="black" strokeWidth="1.5" />
        </g>
      ))}

      {/* ── Dashed arc: fades in immediately with dashes, then marching ants ── */}
      <path d={o2} fill="none" stroke={lineColor} strokeWidth="1.0" strokeDasharray="7 5" opacity="0">
        <animate attributeName="opacity" from="0" to="1" dur="1s" fill="freeze" begin="0.5s" />
        <animate attributeName="stroke-dashoffset" from="12" to="0" dur="0.8s" repeatCount="indefinite" begin="0.5s" />
      </path>

      {/* ── Arc 2: erase diamond followed by actual diamond ── */}
      {Array.from({ length: Math.floor(70 / 21) }, (_, i) => -(i * 21)).map((offset, i) => (
        <g key={`s2-${i}`}>
          <animateMotion dur="70s" repeatCount="indefinite" rotate="auto" begin={`${offset}s`}>
            <mpath href="#hero-m2" />
          </animateMotion>
          {/* X matches diamond tip so the line connects flush; Y slightly wider to clear the crossing */}
          <path d="M 0,-14 L 17,0 L 0,14 L -17,0 Z" style={{ fill: "var(--site-bg)" }} />
          <path d={starSm} fill={dotColor} stroke="black" strokeWidth="1.5" />
        </g>
      ))}
    </svg>
  );
}

// ─── Twinkling stars for variant 1 (no moon) ─────────────────────────────────
function StarField({ isDark }: { isDark: boolean }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, () => {
        const r = 0.7 + Math.random() * 1.8;
        return {
          cx: Math.random() * 1440,
          cy: Math.random() * 700,
          r,
          op: 0.2 + Math.random() * 0.7,
          dur: `${2.5 + Math.random() * 6}s`,
          begin: `${Math.random() * 7}s`,
          pink: Math.random() < 0.10,
          pinkDur: `${1.2 + Math.random() * 1.6}s`,
          pinkBegin: `${Math.random() * 3}s`,
          pinkR: r * 2.4,
        };
      }),
    []
  );

  const starFill = isDark ? "white" : "#243244";

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1440 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ zIndex: 0 }}
    >
      {/* Pink glow halos — rendered behind stars so they don't conflict with fill attr */}
      {isDark && stars.filter(s => s.pink).map((s, i) => (
        <circle key={`glow-${i}`} cx={s.cx} cy={s.cy} r={s.r} fill="#db7093" opacity="0">
          <animate attributeName="opacity" values="0;0.6;0" keyTimes="0;0.5;1" dur={s.pinkDur} begin={s.pinkBegin} repeatCount="indefinite" />
          <animate attributeName="r" values={`${s.r};${s.r * 3};${s.r}`} keyTimes="0;0.5;1" dur={s.pinkDur} begin={s.pinkBegin} repeatCount="indefinite" />
        </circle>
      ))}
      {/* Stars */}
      {stars.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={starFill} opacity={s.op}>
          <animate
            attributeName="opacity"
            values={`${s.op};${Math.max(0.04, s.op - 0.35)};${s.op}`}
            dur={s.dur}
            begin={s.begin}
            repeatCount="indefinite"
          />
          {s.pink && isDark && (
            <animate
              attributeName="fill"
              values={`${starFill};#db7093;${starFill}`}
              keyTimes="0;0.5;1"
              dur={s.pinkDur}
              begin={s.pinkBegin}
              repeatCount="indefinite"
            />
          )}
        </circle>
      ))}
    </svg>
  );
}

// ─── Constellation canvas for variant 2 (mouse-interactive) ──────────────────
function ConstellationCanvas({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDarkRef = useRef(isDark);
  useEffect(() => { isDarkRef.current = isDark; }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const NUM = 130;
    const MAX_D = 155;
    const MOUSE_R = 150;
    let animId: number;
    let w = 0, h = 0;
    let mouseX = -9999, mouseY = -9999;
    let orbX = -9999, orbY = -9999;

    interface Star { x: number; y: number; vx: number; vy: number; r: number; op: number }
    let stars: Star[] = [];

    function init() {
      const c = canvas!;
      const rect = c.getBoundingClientRect();
      w = rect.width || window.innerWidth;
      h = rect.height || 600;
      const dpr = window.devicePixelRatio || 1;
      c.width = w * dpr;
      c.height = h * dpr;
      ctx.scale(dpr, dpr);
      stars = Array.from({ length: NUM }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 0.6 + Math.random() * 1.7,
        op: 0.3 + Math.random() * 0.65,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = w; if (s.x > w) s.x = 0;
        if (s.y < 0) s.y = h; if (s.y > h) s.y = 0;
      }

      // Lerp orb toward actual mouse position
      if (mouseX > -9000) {
        if (orbX < -9000) { orbX = mouseX; orbY = mouseY; }
        orbX += (mouseX - orbX) * 0.07;
        orbY += (mouseY - orbY) * 0.07;
      } else {
        orbX = -9999; orbY = -9999;
      }

      // Pre-compute which stars are within mouse radius (for pink reactions)
      const near = new Set<number>();
      if (orbX > -9000) {
        for (let i = 0; i < stars.length; i++) {
          const dx = stars[i].x - orbX, dy = stars[i].y - orbY;
          if (dx * dx + dy * dy < MOUSE_R * MOUSE_R) near.add(i);
        }
      }

      const lineBase = isDarkRef.current ? `rgba(180,215,255,` : `rgba(15,40,90,`;

      // Star-to-star lines — pink if either endpoint is near cursor
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MAX_D * MAX_D) {
            const frac = 1 - Math.sqrt(d2) / MAX_D;
            if (near.has(i) || near.has(j)) {
              ctx.strokeStyle = `rgba(219,112,147,${frac * 0.55})`;
              ctx.lineWidth = 0.9;
            } else {
              ctx.strokeStyle = `${lineBase}${frac * (isDarkRef.current ? 0.2 : 0.18)})`;
              ctx.lineWidth = 0.55;
            }
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      }

      // Mouse-to-star lines — pink, cubic easing
      if (orbX > -9000) {
        for (let i = 0; i < stars.length; i++) {
          if (!near.has(i)) continue;
          const dx = stars[i].x - orbX, dy = stars[i].y - orbY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const e = 1 - dist / MOUSE_R;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(219,112,147,${e * e * 0.75})`;
          ctx.lineWidth = 1.0;
          ctx.moveTo(orbX, orbY);
          ctx.lineTo(stars[i].x, stars[i].y);
          ctx.stroke();
        }

        // Cursor glow dot
        const g = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 18);
        g.addColorStop(0, "rgba(219,112,147,0.45)");
        g.addColorStop(1, "rgba(219,112,147,0)");
        ctx.beginPath();
        ctx.fillStyle = g;
        ctx.arc(orbX, orbY, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "rgba(219,112,147,0.9)";
        ctx.arc(orbX, orbY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      const starColor = isDarkRef.current ? `rgba(220,238,255,` : `rgba(15,40,90,`;

      // Stars — pink + larger when near cursor, themed otherwise
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        if (near.has(i)) {
          // Outer pink glow
          ctx.beginPath();
          ctx.fillStyle = `rgba(219,112,147,${s.op * 0.35})`;
          ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2);
          ctx.fill();
          // Pink core
          ctx.beginPath();
          ctx.fillStyle = `rgba(255,170,200,${Math.min(1, s.op * 1.3)})`;
          ctx.arc(s.x, s.y, s.r * 1.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.fillStyle = `${starColor}${s.op})`;
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const onLeave = () => { mouseX = -9999; mouseY = -9999; };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    init();
    draw();

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(animId);
      init();
      draw();
    });
    ro.observe(canvas!);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// ─── Mosaic pixel-grid for variant 3 ─────────────────────────────────────────
// Samples video → one pixel per tile, maps luminance to navy palette.
// Shadow measured in TILE units (blocky, not smooth circle) to match reference.
const MOSAIC_VIDEOS = [
  "/now/golf.mp4",
  "/now/knoll.mp4",
  "/now/snowstorm-walk.mp4",
  "/now/spring-performance.mp4",
  "/now/valentines.mp4",
];

// Manual rounded-rect to avoid browser-compat issues with ctx.roundRect
function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
  ctx.fill();
}

function MosaicGrid() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const idxRef     = useRef(Math.floor(Math.random() * MOSAIC_VIDEOS.length));
  const [videoSrc, setVideoSrc] = useState(() => MOSAIC_VIDEOS[idxRef.current]);

  // Advance to next video when current one ends
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnded = () => {
      idxRef.current = (idxRef.current + 1) % MOSAIC_VIDEOS.length;
      setVideoSrc(MOSAIC_VIDEOS[idxRef.current]);
    };
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, []);

  // Reload + play when src changes
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    v.play().catch(() => {});
  }, [videoSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d")!;

    // Constants matched exactly to source
    const TILE    = 22;   // px
    const GAP     = 3;
    const CORNER  = 5;
    const MOUSE_R = 120;  // px radius — from source: `if (f < 120)`
    const SPRING  = 0.08; // from source: `* .08`
    const DAMP    = 0.88; // from source: `* .88`
    const HOLD    = 40;   // frames to hold boost — from source: `lastMouseInfluence = 40`

    let animId: number;
    let w = 0, h = 0;
    let mouseX = -9999, mouseY = -9999;

    interface Tile { intensity: number; target: number; velocity: number; hold: number }
    let tiles: Tile[][] = [];

    const off    = document.createElement("canvas");
    const offCtx = off.getContext("2d", { willReadFrequently: true })!;

    function initTiles(cols: number, rows: number) {
      tiles = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () =>
          ({ intensity: 0.3, target: 0.3, velocity: 0, hold: 0 })
        )
      );
    }

    function init() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width  || window.innerWidth;
      h = rect.height || 700;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width  = w * dpr;
      canvas!.height = h * dpr;
      ctx.scale(dpr, dpr);
      off.width  = Math.ceil(w / TILE);
      off.height = Math.ceil(h / TILE);
      initTiles(Math.ceil(w / TILE) + 1, Math.ceil(h / TILE) + 1);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      const cols = Math.ceil(w / TILE) + 1;
      const rows = Math.ceil(h / TILE) + 1;

      // Sample video → offscreen at tile resolution
      let pixels: Uint8ClampedArray | null = null;
      const v = video!;
      if (v.readyState >= 2 && off.width > 0 && off.height > 0) {
        try {
          const vw    = v.videoWidth  || w;
          const vh    = v.videoHeight || h;
          const scale = Math.max(off.width / vw, off.height / vh);
          const dw = vw * scale, dh = vh * scale;
          offCtx.clearRect(0, 0, off.width, off.height);
          offCtx.drawImage(v, (off.width - dw) / 2, (off.height - dh) / 2, dw, dh);
          pixels = offCtx.getImageData(0, 0, off.width, off.height).data;
        } catch (_) { /* frame not ready */ }
      }

      for (let r = 0; r < rows; r++) {
        if (!tiles[r]) continue;
        for (let c = 0; c < cols; c++) {
          if (!tiles[r][c]) continue;
          const t = tiles[r][c];

          // Video luminance → base intensity (0–1)
          let lum = 0.3;
          if (pixels) {
            const sx  = Math.min(c, off.width  - 1);
            const sy  = Math.min(r, off.height - 1);
            const idx = (sy * off.width + sx) * 4;
            lum = (pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114) / 255;
          }

          // Mouse spotlight — exact cubic easing + pixel-space radius from source
          // source: `e = 1 - f/120; o.targetIntensity = .3 + e*e*e*.7`
          // adapted: boost toward 1.0 from current lum baseline
          const cx = c * TILE + TILE / 2;
          const cy = r * TILE + TILE / 2;
          const dx = mouseX - cx, dy = mouseY - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (mouseX > -9000 && dist < MOUSE_R) {
            const e = 1 - dist / MOUSE_R;
            t.target = lum + e * e * e * (1 - lum) * 0.9;
            t.hold   = HOLD;
          } else if (t.hold > 0) {
            t.hold--;          // hold boosted state for HOLD frames after mouse leaves
          } else {
            t.target = lum;    // return to video-sampled brightness
          }

          // Spring physics — source: `d=(target-intensity)*.08; vel+=d; vel*=.88`
          const force = (t.target - t.intensity) * SPRING;
          t.velocity += force;
          t.velocity *= DAMP;
          t.intensity = Math.max(0, Math.min(1, t.intensity + t.velocity));

          // Light: pink (#db7093) → white; dark: navy → blue
          const isLightMode = document.documentElement.getAttribute("data-theme") === "light";
          const tr = isLightMode ? Math.round(219 + 36  * t.intensity) : Math.floor(60  * t.intensity);
          const tg = isLightMode ? Math.round(112 + 143 * t.intensity) : Math.floor(100 * t.intensity);
          const tb = isLightMode ? Math.round(147 + 108 * t.intensity) : Math.floor(180 * t.intensity);

          ctx.fillStyle = `rgb(${tr},${tg},${tb})`;
          fillRoundRect(ctx, c * TILE + GAP / 2, r * TILE + GAP / 2, TILE - GAP, TILE - GAP, CORNER);
        }
      }

      animId = requestAnimationFrame(draw);
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const onLeave = () => { mouseX = -9999; mouseY = -9999; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    init();
    video!.play().catch(() => {});
    draw();

    const ro = new ResizeObserver(() => { cancelAnimationFrame(animId); init(); draw(); });
    ro.observe(canvas!);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
      {/*
        opacity:0 + absolute keeps the video in the decode pipeline so
        frames are available for canvas drawImage sampling.
        display:none stops frame decoding entirely.
      */}
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay muted playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
      {/* Canvas sits above the invisible video and paints the mosaic */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      />
    </>
  );
}

// ─── Circadian color ─────────────────────────────────────────────────────────
function getCircadianColor(): string {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const t = h + m / 60;
  if (t >= 22 || t < 1)  return "#525252";
  if (t >= 1  && t < 3)  return "#60a5ff";
  if (t >= 3  && t < 5)  return "#9b8fce";
  if (t >= 5  && t < 7)  return "#e89b5a";
  if (t >= 7  && t < 10) return "#d4d4d4";
  if (t >= 10 && t < 13) return "#d4d4d4";
  if (t >= 13 && t < 15) return "#7a9fc4";
  if (t >= 15 && t < 18) return "#d4d4d4";
  if (t >= 18 && t < 20) return "#7a9fc4";
  return "#525252";
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount;
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`;
}

function withOpacity(hex: string, opacity: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// ─── Sheep ────────────────────────────────────────────────────────────────────
function SheepSVG({ num, golden = false }: { num: number; golden?: boolean }) {
  const bodyFill = golden ? "#4a3a10" : "#db7093";
  const bodyHighlight = golden ? "#7a6a20" : "#e890a8";
  const headFill = golden ? "#7a6a20" : "#1a1a1a";
  const counterFill = golden ? "#fbbf24" : "#f0b0c0";
  const eyeFill = golden ? "#fbbf24" : "#ffffff";

  return (
    <svg viewBox="-38 -52 80 72" width="72" height="65" aria-hidden="true">
      {/* Astronaut glow */}
      <circle cx="-2" cy="-5" r="34" fill="rgba(255,255,255,0.12)">
        <animate attributeName="opacity" values="0.06;0.16;0.06" dur="3s" repeatCount="indefinite" />
      </circle>
      {golden && (
        <circle cx="-2" cy="-5" r="32" fill="#fbbf24" opacity="0.08">
          <animate attributeName="opacity" values="0.05;0.12;0.05" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      {/* Body - layered fluffy puffs */}
      <circle cx="-2"  cy=" 4" r="20" fill={bodyFill} />
      <circle cx="-16" cy="-4" r="14" fill={bodyFill} />
      <circle cx=" 10" cy="-6" r="15" fill={bodyFill} />
      <circle cx="-6"  cy="-14" r="12" fill={bodyFill} />
      <circle cx=" 4"  cy=" 4" r="14" fill={bodyFill} />
      {/* Highlight layer for depth */}
      <circle cx="-2"  cy=" 4" r="20" fill={bodyHighlight} opacity="0.55" />
      <circle cx=" 8"  cy="-8" r="12" fill={bodyHighlight} opacity="0.45" />
      <circle cx="-10" cy="-10" r="10" fill={bodyHighlight} opacity="0.35" />
      {/* Head (black, faces left) */}
      <circle cx="-28" cy="2" r="11" fill={headFill} />
      <circle cx="-26" cy="-1" r="6" fill="rgba(60,60,60,0.3)" />
      {/* Eye */}
      <circle cx="-32" cy="0" r="2"  fill={eyeFill} opacity="0.9" />
      <circle cx="-32.5" cy="-0.5" r="0.8" fill="#000000" />
      {/* Ear */}
      <ellipse cx="-24" cy="-10" rx="4" ry="6" fill={headFill} transform="rotate(15 -24 -10)" />
      {/* Counter */}
      <text
        x="-2" y="-36"
        textAnchor="middle"
        fill={counterFill}
        fontSize="12"
        fontFamily="var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
        fontWeight="bold"
      >
        {golden ? "\u2605" : num}
      </text>
    </svg>
  );
}

// ─── Sheep spawning ───────────────────────────────────────────────────────────
interface SheepData {
  id: number;
  num: number;
  golden?: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  rotation: number;
  duration: number;
  scale: number;
  phaseColor: string;
}
const FLOAT_MIN = 10;
const FLOAT_MAX = 18;
const SPAWN_INTERVAL = 1200;

function randomTrajectory() {
  // Spawn from left or right edge, travel across
  const fromLeft = Math.random() > 0.5;
  const startX = fromLeft ? -12 : 112;
  const endX = fromLeft ? 112 : -12;
  // Use % of container height so sheep appear everywhere on the page
  const startY = Math.random() * 95;
  const endY = startY + (Math.random() - 0.5) * 20;

  return { startX, startY, endX, endY };
}

// ─── Floating Sheep Layer (full-page) ────────────────────────────────────────
const GOLDEN_THRESHOLD = 10;

export function FloatingSheep() {
  const [sheep,      setSheep]     = useState<SheepData[]>([]);
  const [poppedIds,  setPoppedIds] = useState<Set<number>>(new Set());
  const [popCount,   setPopCount]  = useState(0);
  const [goldenUnlocked, setGoldenUnlocked] = useState(false);
  const [showGoldenMsg, setShowGoldenMsg] = useState(false);
  const counterRef = useRef(0);
  const goldenRef = useRef(false);

  const popSheep = (id: number) => {
    setPoppedIds(prev => new Set(prev).add(id));
    setPopCount(prev => {
      const next = prev + 1;
      if (next >= GOLDEN_THRESHOLD && !goldenUnlocked) {
        setGoldenUnlocked(true);
        goldenRef.current = true;
        setShowGoldenMsg(true);
        setTimeout(() => setShowGoldenMsg(false), 3000);
      }
      return next;
    });
    setTimeout(() => {
      setSheep(prev => prev.filter(s => s.id !== id));
      setPoppedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 380);
  };

  useEffect(() => {
    const spawn = () => {
      counterRef.current += 1;
      const id  = Date.now() + Math.random();
      const num = counterRef.current;
      const golden = goldenRef.current && Math.random() < 0.2;
      const traj = randomTrajectory();
      const duration = FLOAT_MIN + Math.random() * (FLOAT_MAX - FLOAT_MIN);
      const rotation = (Math.random() - 0.5) * 720;
      const scale = 1;
      const phaseColor = getCircadianColor();

      setSheep(prev => [...prev, {
        id, num, golden,
        ...traj, rotation, duration, scale, phaseColor,
      }]);
      setTimeout(() => {
        setSheep(prev => prev.filter(s => s.id !== id));
      }, duration * 1000 + 800);
    };

    spawn();
    setTimeout(spawn, 300);
    const interval = setInterval(spawn, SPAWN_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full pointer-events-none" style={{ zIndex: 2, bottom: 0, overflow: "hidden" }}>
      {/* ── Sheep pop counter ── */}
      {popCount > 0 && (
        <div
          className="absolute top-4 left-4 z-30 text-[10px] px-2 py-1 rounded pointer-events-auto"
          style={{ backgroundColor: "var(--site-bg-card)", border: "1px solid var(--site-border)", color: "var(--site-text-muted)" }}
        >
          {popCount} popped{!goldenUnlocked && ` · ${GOLDEN_THRESHOLD - popCount} to go`}
        </div>
      )}

      {/* ── Golden unlock message ── */}
      <AnimatePresence>
        {showGoldenMsg && (
          <motion.div
            className="absolute top-16 left-1/2 z-50 text-xs px-4 py-2 rounded-md"
            style={{ backgroundColor: "rgba(251,191,36,0.15)", border: "1px solid #fbbf24", color: "#fbbf24", transform: "translateX(-50%)" }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            golden sheep unlocked!
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sheep ── */}
      {sheep.map((s) => {
        const isPopped = poppedIds.has(s.id);
        return (
          <motion.div
            key={s.id}
            className="absolute cursor-pointer pointer-events-auto"
            style={{ left: 0, top: `${s.startY}%` }}
            initial={{
              x: `${s.startX}vw`,
              rotate: 0,
              opacity: 0,
            }}
            animate={{
              x: `${s.endX}vw`,
              y: `${(s.endY - s.startY)}vh`,
              rotate: s.rotation,
              opacity: [0, 1, 1, 1, 0],
            }}
            transition={{
              duration: s.duration,
              ease: "linear",
              opacity: { times: [0, 0.05, 0.5, 0.9, 1], duration: s.duration },
            }}
            onClick={() => popSheep(s.id)}
          >
            <motion.div
              animate={isPopped ? { scale: [1, 1.9, 0], opacity: [1, 1, 0] } : {}}
              transition={isPopped ? { duration: 0.35, ease: "easeOut" } : {}}
            >
              <SheepSVG num={s.num} golden={s.golden} />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export function SleepHero({ variant = 0 }: { variant?: number }) {
  const [showQuoteInfo, setShowQuoteInfo] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const mosaicLight = !isDark && variant === 3;
  const textColor = isDark ? "#ffffff" : "var(--site-text)";

  return (
    <div
      className="relative w-full"
      style={{
        minHeight: "70vh",
        background: "transparent",
      }}
    >
      {/* ── Backgrounds — one per variant ── */}
      {variant === 1 && <StarField isDark={isDark} />}
      {variant === 1 && <OrbitalArcs isDark={isDark} />}
      {variant === 2 && <ConstellationCanvas isDark={isDark} />}
      {variant === 3 && <MosaicGrid />}

      {/* ── Greeting — top half ── */}
      <div
        className="absolute left-0 right-0 flex flex-col justify-center z-10"
        style={{ top: 0, height: "50%", paddingLeft: "max(2rem, calc((100% - 72rem) / 2 + 2rem))" }}
      >
        <div className="text-left space-y-4" style={{
            maxWidth: "clamp(300px, 70vw, 680px)",
            ...(mosaicLight && { padding: "20px 24px", borderRadius: "14px", background: "rgba(255,255,255,0.72)", backdropFilter: "blur(6px)" }),
          }}>
          <h1
            className="font-bold whitespace-nowrap"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", lineHeight: 1.1, letterSpacing: "-0.03em", color: isDark ? "#ffffff" : "var(--site-text-bright)" }}
          >
            {(() => {
              const hour = new Date().getHours();
              if (hour >= 5 && hour < 12) return "Good morning";
              if (hour >= 12 && hour < 17) return "Good afternoon";
              return "Good evening";
            })()}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: textColor }}>
            My name is Christian. Welcome to christian-estrada.com. I&apos;m running an experiment where I&apos;m trying to put the &ldquo;personal&rdquo; in personal website. I want this website to represent who I am and what I am inspired by. Feel free to use the numbers on your computer as hotkeys to navigate between pages.
          </p>
        </div>
      </div>

      {/* ── Bottom fade to background ── */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "35%",
          background: "linear-gradient(to bottom, transparent, var(--site-bg))",
          zIndex: 2,
        }}
      />

      {/* ── Quote — bottom half ── */}
      <div
        className="absolute left-0 right-0 flex flex-col justify-center z-10"
        style={{ top: "54%", bottom: "5%", paddingLeft: "max(2rem, calc((100% - 72rem) / 2 + 2rem))" }}
      >
        <div style={{ maxWidth: "clamp(280px, 55vw, 580px)" }} className="space-y-4">
          <p style={{ fontSize: "1.1rem", lineHeight: 1.8 }}>
            <span style={{ color: "var(--site-text-bright)", fontWeight: 700 }}>
              Don&apos;t count <span style={{ color: "#db7093" }}>sheep</span>!
            </span>{" "}
            <span style={{ color: "var(--site-text)", fontStyle: "italic" }}>
              It actually keeps you awake.
            </span>{" "}
            <button
              onClick={() => setShowQuoteInfo(prev => !prev)}
              className="inline-flex items-center justify-center rounded-full transition-colors"
              style={{
                width: 18,
                height: 18,
                fontSize: "10px",
                fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
                fontStyle: "normal",
                fontWeight: 600,
                backgroundColor: showQuoteInfo ? "var(--site-accent)" : "var(--site-nav-active)",
                color: showQuoteInfo ? "#fff" : "var(--site-text-muted)",
                border: `1px solid ${showQuoteInfo ? "var(--site-accent)" : "var(--site-border)"}`,
                verticalAlign: "middle",
                marginLeft: 4,
              }}
              aria-label="More info"
            >
              i
            </button>
          </p>
          <AnimatePresence>
            {showQuoteInfo && (
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p style={{ color: "var(--site-text-muted)", fontSize: "0.85rem", lineHeight: 1.75 }}>
                  Counting sheep can actually stimulate the brain and keep you awake.
                </p>
                <p style={{ color: "var(--site-text-prose)", fontSize: "0.9rem", lineHeight: 1.75 }}>
                  Let the sheep float. Don&apos;t count them.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
