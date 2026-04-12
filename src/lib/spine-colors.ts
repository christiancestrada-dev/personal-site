// Deterministic spine color & texture utilities for the bookshelf

const SPINE_PALETTE = [
  "#2d3748", // slate blue
  "#44337a", // deep purple
  "#1a365d", // navy
  "#234e52", // dark teal
  "#744210", // dark amber
  "#742a2a", // dark red
  "#322659", // indigo
  "#1c4532", // forest green
  "#553c9a", // medium purple
  "#2c5282", // royal blue
  "#285e61", // teal
  "#7b341e", // burnt sienna
];

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, r + amount);
  const ng = Math.min(255, g + amount);
  const nb = Math.min(255, b + amount);
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

export function getSpineColor(title: string, status: string): { base: string; light: string } {
  if (status === "reading") {
    return { base: "#db7093", light: "#e8a0b5" };
  }
  const idx = djb2(title) % SPINE_PALETTE.length;
  const base = SPINE_PALETTE[idx];
  return { base, light: lighten(base, 30) };
}

// Base widths per category, plus per-book variation from title hash
const CATEGORY_WIDTH_RANGE: Record<string, [number, number]> = {
  books: [44, 62],
  papers: [24, 34],
  videos: [34, 46],
  websites: [28, 38],
};

export function getSpineWidth(category: string, title: string): number {
  const [min, max] = CATEGORY_WIDTH_RANGE[category] ?? [30, 40];
  const hash = djb2(title + "_w");
  return min + (hash % (max - min + 1));
}

// Height variation: base height per category + hash-based variation
const CATEGORY_HEIGHT_RANGE: Record<string, [number, number]> = {
  books: [230, 290],
  papers: [200, 240],
  videos: [210, 260],
  websites: [200, 250],
};

export function getSpineHeight(category: string, title: string): number {
  const [min, max] = CATEGORY_HEIGHT_RANGE[category] ?? [220, 270];
  const hash = djb2(title + "_h");
  return min + (hash % (max - min + 1));
}

// Depth (thickness into the shelf) also varies slightly
export function getSpineDepth(title: string): number {
  const hash = djb2(title + "_d");
  return 28 + (hash % 12); // 28-39px
}

const PATTERNS = [
  // fine vertical stripes
  (c: string) => `repeating-linear-gradient(90deg, ${c} 0px, ${c} 1px, transparent 1px, transparent 4px)`,
  // subtle diagonal
  (c: string) => `repeating-linear-gradient(45deg, ${c} 0px, ${c} 1px, transparent 1px, transparent 6px)`,
  // horizontal linen
  (c: string) => `repeating-linear-gradient(0deg, ${c} 0px, ${c} 1px, transparent 1px, transparent 5px)`,
  // crosshatch
  (c: string) => `repeating-linear-gradient(45deg, ${c} 0px, ${c} 1px, transparent 1px, transparent 8px), repeating-linear-gradient(-45deg, ${c} 0px, ${c} 1px, transparent 1px, transparent 8px)`,
  // wide vertical
  (c: string) => `repeating-linear-gradient(90deg, ${c} 0px, ${c} 1px, transparent 1px, transparent 7px)`,
  // subtle dots-like
  (c: string) => `repeating-linear-gradient(0deg, ${c} 0px, ${c} 1px, transparent 1px, transparent 3px)`,
];

export function getSpinePattern(index: number): string {
  const patternFn = PATTERNS[index % PATTERNS.length];
  return patternFn("rgba(255,255,255,0.05)");
}
