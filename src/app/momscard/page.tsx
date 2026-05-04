"use client";
import { useEffect, useRef } from "react";

const CW = 800, CH = 600;
const T = 32;
const MAP_W = 50, MAP_H = 50;

const GRASS = 0, WATER = 1;
const S_NONE = 0, S_TREE = 1, S_ROCK = 2, S_BUSH = 3, S_MUSHROOM = 4, S_PATH = 5;
const TREE1_FRAMES = 49, TREE2_FRAMES = 41;
const DIR = { DOWN: 0, LEFT: 1, RIGHT: 2, UP: 3 };
const HOUSE = { tx: 22, ty: 20, w: 5, h: 4, doorX: 25, doorY: 23 } as const;

// Smooth trigonometric field — deterministic, no random checkerboard
function field(x: number, y: number): number {
  return (
    Math.cos(x * 0.18 + 1.2) * 0.35 +
    Math.cos(y * 0.14 - 0.8) * 0.35 +
    Math.cos((x + y) * 0.09 + 0.6) * 0.20 +
    Math.cos((x * 2.1 + y * 1.7) * 0.06) * 0.10
  );
}

export default function MomsCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const raw = canvas.getContext("2d");
    if (!raw) return;
    const ctx: CanvasRenderingContext2D = raw;
    ctx.imageSmoothingEnabled = false;

    const imgs: Record<string, HTMLImageElement> = {};
    const ASSETS = [
      "home-exterior", "interior-new", "walls-floor",
      "girl-character", "cherry-tree1-anim", "cherry-tree2-anim",
    ];
    let loaded = 0;

    const map: number[][] = [];
    const scenery: number[][] = [];
    const keys: Record<string, boolean> = {};
    let camX = 0, camY = 0;
    let raf = 0, lastTime = 0;

    const player = { x: 12 * T, y: 12 * T, w: 28, h: 28, dir: DIR.DOWN, frame: 1, frameTimer: 0 };
    const indoor = { x: CW / 2 - 16, y: 250, dir: DIR.DOWN, frame: 1, frameTimer: 0 };

    type Mode = "outside" | "fading-in" | "inside" | "fading-out";
    let mode: Mode = "outside";
    let fadeAlpha = 0;
    const savedOutdoor = { x: HOUSE.doorX * T, y: (HOUSE.doorY + 1) * T + 4 };

    let seed = 31337;
    const rng = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };

    function generateMap() {
      for (let y = 0; y < MAP_H; y++) { map[y] = []; scenery[y] = []; }
      for (let y = 0; y < MAP_H; y++)
        for (let x = 0; x < MAP_W; x++) { map[y][x] = GRASS; scenery[y][x] = S_NONE; }

      // Intentional kidney-shaped pond east of house
      const PX = 31, PY = 18;
      const pondShape: [number, number][] = [
        [1,0],[2,0],[3,0],[4,0],
        [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],
        [-1,2],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
        [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],
        [1,4],[2,4],[3,4],[4,4],[5,4],
        [2,5],[3,5],[4,5],
        [3,6],
      ];
      for (const [dx, dy] of pondShape) {
        const px = PX + dx, py = PY + dy;
        if (px >= 0 && py >= 0 && px < MAP_W && py < MAP_H) map[py][px] = WATER;
      }

      // Smooth scenery using field — denser trees in darker zones
      for (let y = 0; y < MAP_H; y++)
        for (let x = 0; x < MAP_W; x++) {
          if (map[y][x] === WATER) continue;
          const n = field(x, y);
          const r = rng();
          let sc = S_NONE;
          if (n < -0.05) {
            if (r < 0.12) sc = S_TREE;
            else if (r < 0.20) sc = S_MUSHROOM;
            else if (r < 0.26) sc = S_ROCK;
          } else {
            if (r < 0.04) sc = S_TREE;
            else if (r < 0.07) sc = S_ROCK;
            else if (r < 0.11) sc = S_BUSH;
          }
          scenery[y][x] = sc;
        }

      // Clear spawn area
      for (let y = 8; y < 17; y++) for (let x = 8; x < 17; x++) { map[y][x] = GRASS; scenery[y][x] = S_NONE; }

      // Clear house yard (wider clearance for fence)
      for (let y = HOUSE.ty - 3; y < HOUSE.ty + HOUSE.h + 4; y++)
        for (let x = HOUSE.tx - 3; x < HOUSE.tx + HOUSE.w + 4; x++)
          if (y >= 0 && x >= 0 && y < MAP_H && x < MAP_W) { map[y][x] = GRASS; scenery[y][x] = S_NONE; }

      // Stone path from door going south
      for (let i = 1; i <= 5; i++) {
        const py = HOUSE.doorY + i;
        if (py < MAP_H) scenery[py][HOUSE.doorX] = S_PATH;
      }
    }

    function isWalkable(px: number, py: number) {
      const tx = Math.floor(px / T), ty = Math.floor(py / T);
      if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return false;
      if (map[ty][tx] === WATER) return false;
      const sc = scenery[ty][tx];
      if (sc === S_TREE || sc === S_ROCK) return false;
      if (tx >= HOUSE.tx && tx < HOUSE.tx + HOUSE.w && ty >= HOUSE.ty && ty < HOUSE.ty + HOUSE.h)
        return tx === HOUSE.doorX && ty === HOUSE.doorY;
      return true;
    }

    function updateOutdoor(dt: number) {
      const speed = 2;
      let nx = player.x, ny = player.y, moving = false;
      if (keys["w"] || keys["arrowup"])    { ny -= speed; player.dir = DIR.UP;    moving = true; }
      if (keys["s"] || keys["arrowdown"])  { ny += speed; player.dir = DIR.DOWN;  moving = true; }
      if (keys["a"] || keys["arrowleft"])  { nx -= speed; player.dir = DIR.LEFT;  moving = true; }
      if (keys["d"] || keys["arrowright"]) { nx += speed; player.dir = DIR.RIGHT; moving = true; }
      const pl = nx + 4, pr = nx + player.w - 4, pt = ny + 18, pb = ny + player.h;
      if (isWalkable(pl, pt) && isWalkable(pr, pt) && isWalkable(pl, pb) && isWalkable(pr, pb)) { player.x = nx; player.y = ny; }
      if (moving) { player.frameTimer += dt; if (player.frameTimer > 130) { player.frameTimer = 0; player.frame = (player.frame + 1) % 3; } }
      else { player.frame = 1; player.frameTimer = 0; }
      camX = Math.max(0, Math.min(player.x - CW / 2, MAP_W * T - CW));
      camY = Math.max(0, Math.min(player.y - CH / 2, MAP_H * T - CH));
      const ptx = Math.floor((player.x + player.w / 2) / T);
      const pty = Math.floor((player.y + player.h / 2) / T);
      if (ptx === HOUSE.doorX && pty === HOUSE.doorY) {
        savedOutdoor.x = player.x; savedOutdoor.y = player.y;
        indoor.x = CW / 2 - 16; indoor.y = 260; indoor.dir = DIR.DOWN; indoor.frame = 1;
        mode = "fading-in"; fadeAlpha = 0;
      }
    }

    function updateIndoor(dt: number) {
      const speed = 2;
      let nx = indoor.x, ny = indoor.y, moving = false;
      if (keys["w"] || keys["arrowup"])    { ny -= speed; indoor.dir = DIR.UP;    moving = true; }
      if (keys["s"] || keys["arrowdown"])  { ny += speed; indoor.dir = DIR.DOWN;  moving = true; }
      if (keys["a"] || keys["arrowleft"])  { nx -= speed; indoor.dir = DIR.LEFT;  moving = true; }
      if (keys["d"] || keys["arrowright"]) { nx += speed; indoor.dir = DIR.RIGHT; moving = true; }
      indoor.x = Math.max(44, Math.min(nx, CW - 44 - 32));
      indoor.y = Math.max(44, Math.min(ny, CH - 44 - 32));
      if (moving) { indoor.frameTimer += dt; if (indoor.frameTimer > 130) { indoor.frameTimer = 0; indoor.frame = (indoor.frame + 1) % 3; } }
      else { indoor.frame = 1; indoor.frameTimer = 0; }
      if (indoor.y >= CH - 44 - 32 && indoor.x > CW / 2 - 70 && indoor.x < CW / 2 + 70) { mode = "fading-out"; fadeAlpha = 0; }
    }

    function update(now: number) {
      const dt = Math.min(now - lastTime, 50); lastTime = now;
      if (mode === "outside") updateOutdoor(dt);
      else if (mode === "inside") updateIndoor(dt);
    }

    // ── Draw fence post + section ─────────────────────────────────────────────
    function fencePost(sx: number, sy: number) {
      ctx.fillStyle = "#4a2810"; ctx.fillRect(sx + 13, sy, 6, T);
      ctx.fillStyle = "#6b3a1f"; ctx.fillRect(sx + 14, sy + 1, 4, T - 2);
      ctx.fillStyle = "#8b5232"; ctx.fillRect(sx + 15, sy + 2, 2, T - 4);
    }
    function fenceH(sx: number, sy: number) {
      // horizontal fence panel (between two posts, going right)
      ctx.fillStyle = "#4a2810";
      ctx.fillRect(sx + 18, sy + 9, T - 2, 3);
      ctx.fillRect(sx + 18, sy + 20, T - 2, 3);
      for (let p = 0; p < 3; p++) {
        const px = sx + 18 + p * 9;
        ctx.fillStyle = "#6b3a1f"; ctx.fillRect(px, sy + 4, 5, 22);
        ctx.fillStyle = "#8b5232"; ctx.fillRect(px + 1, sy + 5, 3, 20);
        ctx.fillStyle = "#a06438"; ctx.fillRect(px + 1, sy + 5, 2, 4);
      }
    }
    function fenceV(sx: number, sy: number) {
      // vertical fence panel (below post, going down)
      ctx.fillStyle = "#4a2810";
      ctx.fillRect(sx + 9, sy + 28, 3, T);
      ctx.fillRect(sx + 20, sy + 28, 3, T);
      for (let p = 0; p < 2; p++) {
        const py = sy + 28 + p * 13;
        ctx.fillStyle = "#6b3a1f"; ctx.fillRect(sx + 5, py, 22, 5);
        ctx.fillStyle = "#8b5232"; ctx.fillRect(sx + 6, py + 1, 20, 3);
      }
    }

    // ── Draw outdoor scene ────────────────────────────────────────────────────
    function drawOutdoor(now: number) {
      ctx.fillStyle = "#4e9830";
      ctx.fillRect(0, 0, CW, CH);
      const MARGIN = T * 2;

      for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
          const sx = x * T - camX, sy = y * T - camY;
          if (sx < -MARGIN || sx > CW + MARGIN || sy < -MARGIN || sy > CH + MARGIN) continue;

          if (map[y][x] === WATER) {
            const d = Math.sin(now / 1000 + x * 0.4 + y * 0.35) * 0.1 + 0.9;
            ctx.fillStyle = `rgba(22,68,168,${d})`;
            ctx.fillRect(sx, sy, T, T);
            // Lily pad hint near shore
            ctx.fillStyle = "rgba(110,180,255,0.4)";
            const wo = Math.sin(now / 550 + x * 1.2 + y) * 5 + 5;
            ctx.fillRect(sx + wo, sy + 9, 10, 2);
            ctx.fillRect(sx + T - wo - 8, sy + 21, 7, 2);
            continue;
          }

          // Smooth green gradient — light in clearings, dark in forest zones
          const n = field(x, y); // roughly -0.5 to 0.5
          const t = Math.max(0, Math.min(1, (n + 0.5)));
          const gr = Math.round(55 + t * 28);
          const gg = Math.round(148 + t * 52);
          const gb = Math.round(30 + t * 18);
          ctx.fillStyle = `rgb(${gr},${gg},${gb})`;
          ctx.fillRect(sx, sy, T, T);

          const sc = scenery[y][x];
          if (sc === S_NONE) continue;
          switch (sc) {
            case S_TREE: {
              const use2 = (x + y) % 2 === 1;
              const sheet = use2 ? imgs["cherry-tree2-anim"] : imgs["cherry-tree1-anim"];
              const total = use2 ? TREE2_FRAMES : TREE1_FRAMES;
              const phase = (x * 7 + y * 13) % total;
              const frame = (Math.floor(now / 120) + phase) % total;
              ctx.drawImage(sheet, frame * 64, 0, 64, 64, sx - 28, sy - 46, 104, 104);
              break;
            }
            case S_ROCK:
              ctx.fillStyle = "#7a7a6a";
              ctx.beginPath(); ctx.ellipse(sx + 16, sy + 20, 12, 9, -0.2, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = "#9e9e8c";
              ctx.beginPath(); ctx.ellipse(sx + 14, sy + 18, 9, 7, -0.2, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = "#b8b8a4";
              ctx.beginPath(); ctx.ellipse(sx + 13, sy + 16, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
              break;
            case S_BUSH:
              ctx.fillStyle = "#2e8820";
              ctx.beginPath(); ctx.ellipse(sx + 16, sy + 20, 13, 10, 0, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = "#48b030";
              ctx.beginPath(); ctx.ellipse(sx + 13, sy + 16, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = "#5acc3c";
              ctx.beginPath(); ctx.ellipse(sx + 14, sy + 14, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
              break;
            case S_MUSHROOM: {
              // Red cap mushroom
              ctx.fillStyle = "#8a1a1a";
              ctx.beginPath(); ctx.ellipse(sx + 16, sy + 17, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = "#cc3030";
              ctx.beginPath(); ctx.ellipse(sx + 15, sy + 15, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = "#ff6060";
              ctx.fillRect(sx + 13, sy + 13, 2, 2); ctx.fillRect(sx + 18, sy + 14, 2, 2);
              ctx.fillStyle = "#e8d8c0";
              ctx.fillRect(sx + 14, sy + 18, 4, 7);
              ctx.fillStyle = "#f0e8d0";
              ctx.fillRect(sx + 15, sy + 19, 2, 5);
              break;
            }
            case S_PATH:
              // Stone path block
              ctx.fillStyle = "#b8a880";
              ctx.fillRect(sx, sy, T, T);
              ctx.fillStyle = "#a09060";
              ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
              ctx.fillStyle = "#c8b890";
              ctx.fillRect(sx + 4, sy + 4, T - 8, T - 8);
              // Mortar lines
              ctx.fillStyle = "#888070";
              ctx.fillRect(sx + 2, sy + 15, T - 4, 2);
              ctx.fillRect(sx + 15, sy + 2, 2, 13);
              ctx.fillRect(sx + 8, sy + 17, 2, T - 19);
              break;
          }
        }
      }

      // ── Fence around house yard ──────────────────────────────────────────────
      const FY0 = HOUSE.ty - 2, FYN = HOUSE.ty + HOUSE.h + 2;
      const FX0 = HOUSE.tx - 2, FXN = HOUSE.tx + HOUSE.w + 2;

      // Top fence
      for (let fx = FX0; fx < FXN; fx++) {
        const sx = fx * T - camX, sy = FY0 * T - camY;
        fencePost(sx, sy); fenceH(sx, sy);
      }
      // Top-right corner post
      fencePost(FXN * T - camX, FY0 * T - camY);

      // Bottom fence (with gate gap at door)
      for (let fx = FX0; fx < FXN; fx++) {
        const sx = fx * T - camX, sy = FYN * T - camY;
        fencePost(sx, sy);
        if (fx !== HOUSE.doorX) fenceH(sx, sy);
      }
      fencePost(FXN * T - camX, FYN * T - camY);

      // Left fence (vertical)
      for (let fy = FY0; fy < FYN; fy++) {
        const sx = FX0 * T - camX, sy = fy * T - camY;
        fencePost(sx, sy); fenceV(sx, sy);
      }
      // Right fence (vertical)
      for (let fy = FY0; fy < FYN; fy++) {
        const sx = FXN * T - camX, sy = fy * T - camY;
        fencePost(sx, sy); fenceV(sx, sy);
      }

      // ── House sprite ─────────────────────────────────────────────────────────
      const hsx = HOUSE.tx * T - camX, hsy = HOUSE.ty * T - camY;
      if (hsx > -200 && hsx < CW + 200 && hsy > -200 && hsy < CH + 200) {
        ctx.drawImage(imgs["home-exterior"], 0, 0, 145, 125, hsx, hsy, HOUSE.w * T, HOUSE.h * T);
        const ptx = Math.floor((player.x + player.w / 2) / T);
        const pty = Math.floor((player.y + player.h / 2) / T);
        if (Math.abs(ptx - HOUSE.doorX) <= 1 && Math.abs(pty - HOUSE.doorY) <= 1) {
          const labelX = hsx + (HOUSE.doorX - HOUSE.tx) * T - 8;
          const labelY = hsy + (HOUSE.doorY - HOUSE.ty) * T - 16;
          ctx.fillStyle = "rgba(0,0,0,0.72)"; ctx.fillRect(labelX, labelY, 56, 14);
          ctx.fillStyle = "#ffd9a0"; ctx.font = "9px monospace";
          ctx.fillText("walk in  ↑", labelX + 4, labelY + 10);
        }
      }

      // Player
      const px = player.x - camX, py = player.y - camY;
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath(); ctx.ellipse(px + 14, py + 28, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(imgs["girl-character"], player.frame * 32, player.dir * 32, 32, 32, px - 4, py - 8, 40, 40);
    }

    // ── Draw interior ─────────────────────────────────────────────────────────
    function drawInterior() {
      const WF = imgs["walls-floor"];  // 144×176, stone floor at y=96
      const INT = imgs["interior-new"]; // 192×400, furniture sprites

      const B = 44; // border thickness

      // Stone floor tiles (walls-floor.png at y=96 — confirmed grey stone)
      for (let ry = B; ry < CH - B; ry += 32) {
        for (let rx = B; rx < CW - B; rx += 32) {
          const alt = ((Math.floor(rx / 32) + Math.floor(ry / 32)) % 2) * 16;
          ctx.drawImage(WF, alt, 96, 16, 16, rx, ry, 32, 32);
        }
      }

      // Stone walls — outer border (grey stone block fill)
      const WALL_COLOR = "#565a65";
      const WALL_LIGHT = "#6e7280";
      const WALL_DARK = "#3e404a";

      function drawStoneWall(wx: number, wy: number, ww: number, wh: number) {
        ctx.fillStyle = WALL_COLOR; ctx.fillRect(wx, wy, ww, wh);
        // Stone block texture lines
        ctx.fillStyle = WALL_DARK;
        for (let bx = wx; bx < wx + ww; bx += 20) ctx.fillRect(bx, wy, 1, wh);
        for (let by = wy; by < wy + wh; by += 14) ctx.fillRect(wx, by, ww, 1);
        // Top highlight
        ctx.fillStyle = WALL_LIGHT; ctx.fillRect(wx, wy, ww, 2);
      }

      drawStoneWall(0, 0, CW, B);          // top
      drawStoneWall(0, CH - B, CW, B);     // bottom
      drawStoneWall(0, B, B, CH - B * 2);  // left
      drawStoneWall(CW - B, B, B, CH - B * 2); // right

      // Interior wall dividers (horizontal)
      // Divides into: top rooms | main living | bottom rooms
      const divTop = 195;
      const divBot = 370;
      const midX = 224; // vertical divider x

      // Top horizontal wall divider (with openings)
      drawStoneWall(B, divTop, midX - B, 14);     // left segment
      drawStoneWall(380, divTop, CW - B - 380, 14); // right segment

      // Bottom horizontal wall divider
      drawStoneWall(B, divBot, midX - B, 14);
      drawStoneWall(380, divBot, CW - B - 380, 14);

      // Left vertical divider
      drawStoneWall(midX, B, 14, divTop - B);
      drawStoneWall(midX, divBot + 14, 14, CH - B - divBot - 14);

      // Right vertical divider
      drawStoneWall(380, B, 14, divTop - B);
      drawStoneWall(380, divBot + 14, 14, CH - B - divBot - 14);

      // Cream plaster trim (wall-floor boundary line)
      const TRIM = "#e8dcc0";
      ctx.fillStyle = TRIM;
      ctx.fillRect(B, B + 2, CW - B * 2, 6);
      ctx.fillRect(B, divTop + 14, midX - B, 6);
      ctx.fillRect(380, divTop + 14, CW - B - 380, 6);
      ctx.fillRect(B, divBot + 14, midX - B, 6);
      ctx.fillRect(380, divBot + 14, CW - B - 380, 6);

      // ── Top-left room: staircase + bed ──────────────────────────────────────
      // Staircase / wardrobe (INT rows 1-4, left side): src ~(0,16,48,64)
      ctx.drawImage(INT, 0, 16, 48, 64, B + 10, B + 8, 80, 120);
      // Bed with blue pillow (INT top area, around col 3-5): src ~(48,0,64,64)
      ctx.drawImage(INT, 48, 0, 64, 64, B + 98, B + 10, 110, 110);

      // ── Top-right room: pantry shelves + couch ───────────────────────────────
      // Pantry/jar shelves (INT rows 3-4): src ~(0,48,96,48)
      ctx.drawImage(INT, 0, 48, 96, 48, CW - B - 200, B + 8, 192, 80);
      // Bookcase with items below pantry: src ~(0,64,64,48)
      ctx.drawImage(INT, 0, 64, 64, 48, CW - B - 160, B + 90, 128, 80);
      // Dresser/chest right of bookcase: src ~(96,96,32,48)
      ctx.drawImage(INT, 96, 96, 32, 48, CW - B - 56, B + 90, 48, 80);

      // Blue sofa / couch hint: src ~(80,112,32,48)
      ctx.drawImage(INT, 80, 112, 32, 48, CW - B - 72, divTop - 105, 64, 90);

      // ── Center main room: dining table + oval rug ───────────────────────────
      // Blue oval rug FIRST (under table) — INT y=272, confirmed blue
      // Source: (0, 272, 96, 80) → 6×5 tiles
      ctx.drawImage(INT, 0, 272, 96, 80, 230, divTop + 40, 288, 220);

      // Round dining table + chairs: src ~(0,96,80,80)
      ctx.drawImage(INT, 0, 96, 80, 80, 248, divTop + 50, 256, 220);

      // Birthday cake on the table
      const ck = { x: 346, y: divTop + 140 };
      ctx.fillStyle = "#f4c6a0"; ctx.fillRect(ck.x, ck.y + 14, 52, 18);
      ctx.fillStyle = "#fff8f8"; ctx.fillRect(ck.x, ck.y + 10, 52, 5);
      ctx.fillStyle = "#e8b090"; ctx.fillRect(ck.x, ck.y + 2, 52, 10);
      ctx.fillStyle = "#fff8f8"; ctx.fillRect(ck.x, ck.y - 2, 52, 5);
      const cc = ["#ff3355", "#33aaff", "#ffcc00"];
      for (let c = 0; c < 3; c++) {
        const cx = ck.x + 9 + c * 17;
        ctx.fillStyle = cc[c]; ctx.fillRect(cx, ck.y - 13, 4, 13);
        ctx.fillStyle = "#ff7700"; ctx.beginPath(); ctx.ellipse(cx + 2, ck.y - 15, 2, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffee44"; ctx.beginPath(); ctx.ellipse(cx + 2, ck.y - 16, 1, 2, 0, 0, Math.PI * 2); ctx.fill();
      }

      // Bookcase right wall of center area: src ~(96,0,48,80)
      ctx.drawImage(INT, 96, 0, 48, 80, 390, B + 10, 96, 150);

      // ── Bottom-left room: arched door + potion table ────────────────────────
      // Small table with potions/vases: src ~(0,176,48,48)
      ctx.drawImage(INT, 0, 176, 48, 48, B + 80, divBot + 28, 96, 90);
      // Small decorative items: src ~(0,336,64,32)
      ctx.drawImage(INT, 0, 336, 64, 32, B + 8, divBot + 50, 90, 50);

      // Arched interior door (drawn on left wall divider bottom)
      // Use a simple arch shape
      ctx.fillStyle = "#5a3010"; ctx.fillRect(midX, divBot + 14, 14, 72);
      ctx.fillStyle = "#3e2008";
      ctx.fillRect(midX + 2, divBot + 28, 10, 56);
      ctx.fillStyle = "#FFD700";
      ctx.beginPath(); ctx.arc(midX + 7, divBot + 28, 2, 0, Math.PI * 2); ctx.fill();

      // ── Bottom-right room: sink/trough + red rug ────────────────────────────
      // Utility/sink item: src ~(64,176,32,48)
      ctx.drawImage(INT, 64, 176, 32, 48, CW - B - 120, divBot + 28, 72, 90);
      // Red rectangular rug: src ~(96,240,64,48) — look for red-ish region
      // Confirmed: y=240 has red (145,65,65). Use (0,240,80,48)
      ctx.drawImage(INT, 0, 240, 80, 48, CW - B - 180, divBot + 80, 180, 80);

      // Green plant bottom-right: src ~(0,192,32,32)
      ctx.drawImage(INT, 0, 192, 32, 32, CW - B - 55, divBot + 30, 56, 56);

      // ── Bottom center exit door ───────────────────────────────────────────────
      const exitW = 56, exitX = CW / 2 - exitW / 2;
      ctx.fillStyle = "#5a3010"; ctx.fillRect(exitX, CH - B, exitW, B);
      ctx.fillStyle = "#3e2008";
      ctx.fillRect(exitX + 4, CH - B + 3, 22, B - 6);
      ctx.fillRect(exitX + 30, CH - B + 3, 22, B - 6);
      ctx.fillStyle = "#FFD700";
      ctx.beginPath(); ctx.arc(exitX + exitW / 2, CH - B + 20, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffd9a0"; ctx.font = "9px monospace";
      ctx.fillText("↓ exit", exitX + 10, CH - B - 5);

      // Windows on top wall
      // WF has window-like sections at top area; draw simple window shapes
      ctx.fillStyle = "#c0daf0";
      ctx.fillRect(midX + 40, B + 6, 40, 28);
      ctx.fillRect(490, B + 6, 40, 28);
      ctx.fillStyle = "#4a7aa0";
      ctx.fillRect(midX + 38, B + 4, 44, 3); ctx.fillRect(midX + 38, B + 4, 3, 33);
      ctx.fillRect(midX + 79, B + 4, 3, 33); ctx.fillRect(midX + 38, B + 34, 44, 3);
      ctx.fillRect(midX + 59, B + 4, 2, 33);
      ctx.fillRect(488, B + 4, 44, 3); ctx.fillRect(488, B + 4, 3, 33);
      ctx.fillRect(529, B + 4, 3, 33); ctx.fillRect(488, B + 34, 44, 3);
      ctx.fillRect(509, B + 4, 2, 33);

      // Indoor player
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.beginPath(); ctx.ellipse(indoor.x + 14, indoor.y + 28, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(imgs["girl-character"], indoor.frame * 32, indoor.dir * 32, 32, 32, indoor.x - 4, indoor.y - 8, 40, 40);
    }

    function draw(now: number) {
      ctx.imageSmoothingEnabled = false;
      if (mode === "inside") drawInterior();
      else if (mode === "outside") drawOutdoor(now);
      else if (mode === "fading-in") drawOutdoor(now);
      else drawInterior();

      if (mode === "fading-in") {
        fadeAlpha = Math.min(1, fadeAlpha + 0.04);
        ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
        ctx.fillRect(0, 0, CW, CH);
        if (fadeAlpha >= 1) mode = "inside";
      } else if (mode === "fading-out") {
        fadeAlpha = Math.min(1, fadeAlpha + 0.04);
        ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
        ctx.fillRect(0, 0, CW, CH);
        if (fadeAlpha >= 1) {
          mode = "outside"; player.x = savedOutdoor.x; player.y = savedOutdoor.y;
          player.dir = DIR.DOWN; fadeAlpha = 0;
        }
      }
    }

    function loop(now: number) { update(now); draw(now); raf = requestAnimationFrame(loop); }

    for (const name of ASSETS) {
      const img = new Image(); img.src = `/game-assets/${name}.png`;
      img.onload = () => { if (++loaded === ASSETS.length) { generateMap(); raf = requestAnimationFrame(loop); } };
      imgs[name] = img;
    }

    const kd = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (["arrowup","arrowdown","arrowleft","arrowright"," "].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const ku = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#1a2a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <canvas ref={canvasRef} width={CW} height={CH} style={{ imageRendering: "pixelated", display: "block" }} />
      <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,.72)", padding: "8px 14px", border: "1px solid #2a5a2a", fontSize: 12, fontFamily: "monospace", color: "#cce8cc", zIndex: 100, pointerEvents: "none" }}>
        WASD or Arrow Keys to move
      </div>
    </div>
  );
}
