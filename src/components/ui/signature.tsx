"use client";

import { motion } from "framer-motion";

// Recreated from Christian's actual signature
// Key features: big open C sweep, tall h ascender, rightward-upward slant,
// compressed cursive "ristian", long tail swooping down-right
const SIGNATURE_PATH = [
  // C - big open sweep, taller than the h
  "M 92 -6",
  "C 82 -10, 64 -4, 48 12",             // C top sweeps left
  "C 30 28, 20 54, 26 70",              // C arcs down
  "C 32 84, 50 88, 66 76",              // C bottom curves back up
  "C 76 68, 84 56, 90 46",              // C exits into h

  // h - tall ascender but shorter than C
  "C 92 38, 94 26, 96 18",              // h stem goes up
  "C 98 10, 100 14, 100 22",            // top of h stem
  "C 100 28, 100 36, 100 44",           // h stem comes down
  "C 100 48, 104 40, 108 36",           // h arch rises
  "C 112 32, 114 36, 114 42",           // h arch over and down
  "C 114 48, 116 50, 120 44",           // h exits right

  // r - quick up-down
  "C 122 38, 124 34, 126 32",           // r upstroke
  "C 128 30, 128 36, 126 42",           // r curves back
  "C 125 46, 128 48, 132 42",           // r exits

  // i - short stroke
  "C 134 38, 136 34, 136 32",           // i up
  "C 136 30, 136 40, 138 46",           // i down
  "C 140 50, 142 46, 144 42",           // i exit

  // s - quick s-curve
  "C 146 38, 150 32, 152 34",           // s top
  "C 154 36, 150 42, 152 46",           // s bottom
  "C 154 48, 158 44, 160 40",           // s exit

  // t - stroke up then down, will get crossbar
  "C 162 34, 164 26, 164 22",           // t stem up
  "C 164 18, 164 30, 166 42",           // t stem down
  "C 168 48, 170 46, 172 42",           // t exit

  // i - short
  "C 174 38, 176 34, 176 30",           // i up
  "C 176 28, 176 38, 178 44",           // i down
  "C 180 48, 182 44, 184 40",           // i exit

  // a - round
  "C 186 36, 192 30, 194 34",           // a top arc
  "C 196 38, 192 46, 190 48",           // a loops around
  "C 188 50, 192 50, 196 46",           // a exit

  // n - arch
  "C 198 42, 200 36, 204 34",           // n upstroke
  "C 208 32, 210 38, 210 44",           // n arch
  "C 210 50, 214 48, 218 44",           // n exit

  // Sweeping tail down-right and back underneath
  "C 226 52, 242 72, 250 88",           // tail swoops down
  "C 258 104, 258 114, 244 116",        // bottom curve
  "C 226 118, 190 106, 156 92",         // sweeps back left
  "C 124 78, 90 70, 58 74",             // continues under the C
].join(" ");

// E as a separate stroke (pen lifts after "Christian")
const E_PATH = [
  "M 250 26",
  "C 258 20, 266 14, 264 6",            // E top curve
  "C 262 -2, 250 2, 244 12",            // E top loops back
  "C 238 22, 246 28, 256 24",           // E middle bar
  "C 248 30, 240 40, 244 50",           // E lower curve
  "C 248 58, 258 60, 266 54",           // E bottom exit
].join(" ");

// t crossbar - slight upward slant matching the signature angle
const T_CROSS = "M 156 34 L 172 28";

const SIGNATURE_VIEWBOX = "14 -8 274 134";

interface SignatureProps {
  className?: string;
  width?: number;
  height?: number;
  color?: string;
}

export function Signature({ className = "", width = 160, height = 52, color = "var(--site-text-bright)" }: SignatureProps) {
  return (
    <motion.svg
      viewBox={SIGNATURE_VIEWBOX}
      width={width}
      height={height}
      className={className}
      aria-label="Christian's signature"
      initial="hidden"
      animate="visible"
    >
      {/* Main signature stroke */}
      <motion.path
        d={SIGNATURE_PATH}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
              pathLength: { duration: 2.5, ease: "easeInOut" },
              opacity: { duration: 0.3 },
            },
          },
        }}
      />
      {/* E - separate stroke */}
      <motion.path
        d={E_PATH}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
              pathLength: { duration: 0.6, delay: 2.1, ease: "easeInOut" },
              opacity: { duration: 0.1, delay: 2.1 },
            },
          },
        }}
      />
      {/* t crossbar */}
      <motion.path
        d={T_CROSS}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
              pathLength: { duration: 0.2, delay: 1.8 },
              opacity: { duration: 0.1, delay: 1.8 },
            },
          },
        }}
      />
      {/* i dots */}
      <motion.circle
        cx="137" cy="26" r="1.5" fill={color}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { delay: 1.9, duration: 0.15 } },
        }}
      />
      <motion.circle
        cx="177" cy="24" r="1.5" fill={color}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { delay: 2.0, duration: 0.15 } },
        }}
      />
    </motion.svg>
  );
}
