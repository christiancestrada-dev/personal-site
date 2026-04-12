"use client";

import { motion } from "framer-motion";
import { getSpineColor, getSpineWidth, getSpineHeight, getSpineDepth, getSpinePattern } from "@/lib/spine-colors";
import type { ReadingItem } from "@/lib/reading-data";

const STATUS_COLORS: Record<ReadingItem["status"], string> = {
  read: "#4ade80",
  reading: "#fbbf24",
  queued: "#525252",
};

interface BookSpineProps {
  item: ReadingItem;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

export function BookSpine({ item, index, isSelected, onClick }: BookSpineProps) {
  const { base, light } = getSpineColor(item.title, item.status);
  const width = getSpineWidth(item.category, item.title);
  const height = getSpineHeight(item.category, item.title);
  const depth = getSpineDepth(item.title);
  const pattern = getSpinePattern(index);

  return (
    <div style={{ perspective: 800, height }}>
      <motion.div
        role="button"
        tabIndex={0}
        aria-label={`${item.title} by ${item.author}`}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className="relative cursor-pointer outline-none"
        style={{
          width,
          height,
          transformStyle: "preserve-3d",
          transformOrigin: "center bottom",
        }}
        whileHover={{
          rotateY: -25,
          z: 20,
          y: -8,
        }}
        animate={
          isSelected
            ? { rotateY: -25, z: 20, y: -8 }
            : { rotateY: 0, z: 0, y: 0 }
        }
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Front face — the spine */}
        <div
          className="absolute inset-0 flex flex-col items-center overflow-hidden rounded-[1px]"
          style={{
            backgroundColor: base,
            backgroundImage: pattern,
            backfaceVisibility: "hidden",
          }}
        >
          {/* Title text — vertical */}
          <div
            className="flex-1 flex items-center justify-center px-1 overflow-hidden"
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
            }}
          >
            <span
              className="text-[11px] font-medium leading-tight text-center"
              style={{
                color: "rgba(255,255,255,0.88)",
                maxHeight: height - 40,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.title}
            </span>
          </div>

          {/* Status dot */}
          <div className="pb-2">
            <span
              className="block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[item.status] }}
            />
          </div>
        </div>

        {/* Side face — front cover (revealed on hover tilt) */}
        <div
          className="absolute top-0 flex flex-col justify-center px-2 overflow-hidden rounded-[1px]"
          style={{
            width: depth,
            height,
            backgroundColor: light,
            transform: `rotateY(90deg) translateZ(${width}px)`,
            transformOrigin: "left",
            backfaceVisibility: "hidden",
          }}
        >
          <span
            className="text-[8px] font-medium leading-tight"
            style={{
              color: "rgba(255,255,255,0.7)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 5,
              WebkitBoxOrient: "vertical",
            }}
          >
            {item.author}
          </span>
        </div>

        {/* Top face — page edges */}
        <div
          className="absolute rounded-[1px]"
          style={{
            width,
            height: depth,
            background: `repeating-linear-gradient(90deg, #e8e4df 0px, #e8e4df 1px, #d4d0cb 1px, #d4d0cb 2px)`,
            transform: `rotateX(90deg) translateZ(0px)`,
            transformOrigin: "top",
            backfaceVisibility: "hidden",
          }}
        />
      </motion.div>
    </div>
  );
}
