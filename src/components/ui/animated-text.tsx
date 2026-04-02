"use client";

import * as React from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  duration?: number;
  delay?: number;
  replay?: boolean;
  className?: string;
  textClassName?: string;
  showWave?: boolean;
  waveColor?: string;
}

const AnimatedText = React.forwardRef<HTMLDivElement, AnimatedTextProps>(
  ({
    text,
    duration = 0.04,
    delay = 0.05,
    replay = true,
    className,
    textClassName,
    showWave = false,
    waveColor = "var(--site-accent)",
    ...props
  }, ref) => {
    const letters = Array.from(text);

    const container: Variants = {
      hidden: {
        opacity: 0
      },
      visible: (i: number = 1) => ({
        opacity: 1,
        transition: {
          staggerChildren: duration,
          delayChildren: i * delay
        }
      })
    };

    const child: Variants = {
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          damping: 12,
          stiffness: 200
        }
      },
      hidden: {
        opacity: 0,
        y: 10,
        transition: {
          type: "spring",
          damping: 12,
          stiffness: 200
        }
      }
    };

    // EEG-style wave path — one tile is 120 units wide; we duplicate it for seamless scroll
    const waveTile = "M0 6 C3 6, 4 2, 6 2 S9 6, 12 6 S15 10, 18 10 S21 6, 24 6 S27 2, 30 2 S33 6, 36 6 S39 10, 42 10 S45 6, 48 6 S51 2, 54 2 S57 6, 60 6 S63 10, 66 10 S69 6, 72 6 S75 4, 78 2 S81 6, 84 6 S87 8, 90 10 S93 6, 96 6 S99 3, 102 2 S105 6, 108 6 S111 9, 114 10 S117 6, 120 6";
    const TILE_W = 120;

    const waveDelay = letters.length * duration + delay + 0.3;

    return (
      <div
        ref={ref}
        className={cn("inline-flex flex-col", className)}
        {...props}
      >
        <div className="relative pb-4">
          <motion.span
            style={{ display: "flex", overflow: "hidden", ...props.style }}
            variants={container}
            initial="hidden"
            animate={replay ? "visible" : "hidden"}
            className={textClassName}
          >
            {letters.map((letter, index) => (
              <motion.span key={index} variants={child}>
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </motion.span>

          {showWave && (
            <motion.div
              className="absolute left-0 w-full overflow-hidden"
              style={{ bottom: "-12px", height: 12 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: waveDelay, duration: 0.5 }}
            >
              <svg
                width={TILE_W * 2}
                height="12"
                viewBox={`0 0 ${TILE_W * 2} 12`}
                fill="none"
                style={{ display: "block" }}
              >
                <motion.g
                  animate={{ x: [0, -TILE_W] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: waveDelay }}
                >
                  <path
                    d={waveTile}
                    stroke={waveColor}
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d={waveTile}
                    stroke={waveColor}
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    transform={`translate(${TILE_W}, 0)`}
                  />
                </motion.g>
              </svg>
            </motion.div>
          )}
        </div>
      </div>
    );
  }
);
AnimatedText.displayName = "AnimatedText";

export { AnimatedText };
