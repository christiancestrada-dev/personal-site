"use client";

import type { ReadingItem } from "@/lib/reading-data";
import { BookSpine } from "./book-spine";
import { useTheme } from "@/lib/use-theme";

interface BookshelfProps {
  items: ReadingItem[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

const DARK_WOOD  = { back: "#0e0b09", wood: "#1c1612", light: "#2a211a", edge: "#3a2e24" };
const LIGHT_WOOD = { back: "#2c1f10", wood: "#8b6843", light: "#a88260", edge: "#6a4e30" };

export function Bookshelf({ items, selectedIndex, onSelect }: BookshelfProps) {
  const { isDark } = useTheme();
  const W = isDark ? DARK_WOOD : LIGHT_WOOD;

  if (items.length === 0) {
    return (
      <div className="relative rounded-lg overflow-hidden" style={{ background: W.back, border: `1px solid ${W.light}` }}>
        <p className="py-20 text-center text-sm" style={{ color: "var(--site-text-muted)" }}>
          No items on this shelf
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{
        background: W.back,
        border: `1px solid ${W.light}`,
      }}
    >
      {/* Back panel — subtle wood grain texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              rgba(255,255,255,0.01) 0px,
              rgba(255,255,255,0.01) 1px,
              transparent 1px,
              transparent 40px
            ),
            repeating-linear-gradient(
              0deg,
              rgba(255,255,255,0.008) 0px,
              rgba(255,255,255,0.008) 1px,
              transparent 1px,
              transparent 8px
            )
          `,
        }}
      />

      {/* Shelf unit with side walls */}
      <div className="relative flex">
        {/* Left side wall */}
        <div
          className="shrink-0 hidden sm:block"
          style={{
            width: 14,
            background: `linear-gradient(to right, ${W.edge}, ${W.wood})`,
          }}
        />

        {/* Main shelf area */}
        <div className="flex-1 min-w-0">
          {/* Books row */}
          <div
            className="flex items-end gap-[3px] px-3 pt-6 pb-0 overflow-x-auto md:flex-wrap"
            style={{ minHeight: 310 }}
          >
            {items.map((item, i) => (
              <BookSpine
                key={`${item.title}-${i}`}
                item={item}
                index={i}
                isSelected={selectedIndex === i}
                onClick={() => onSelect(i)}
              />
            ))}
          </div>

          {/* Shelf plank */}
          <div>
            {/* Top surface */}
            <div
              style={{
                height: 14,
                background: `linear-gradient(to bottom, ${W.edge}, ${W.light} 40%, ${W.wood})`,
                boxShadow: `0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
              }}
            />
            {/* Front lip / underside shadow */}
            <div
              style={{
                height: 6,
                background: `linear-gradient(to bottom, ${W.wood}, transparent)`,
                opacity: 0.6,
              }}
            />
          </div>
        </div>

        {/* Right side wall */}
        <div
          className="shrink-0 hidden sm:block"
          style={{
            width: 14,
            background: `linear-gradient(to left, ${W.edge}, ${W.wood})`,
          }}
        />
      </div>
    </div>
  );
}
