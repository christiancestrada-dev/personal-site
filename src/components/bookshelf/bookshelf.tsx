"use client";

import type { ReadingItem } from "@/lib/reading-data";
import { BookSpine } from "./book-spine";

interface BookshelfProps {
  items: ReadingItem[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

// Shelf "wood" colors — dark stained wood that works on both themes
const SHELF_WOOD = "#1c1612";
const SHELF_WOOD_LIGHT = "#2a211a";
const SHELF_WOOD_EDGE = "#3a2e24";
const SHELF_BACK = "#0e0b09";

export function Bookshelf({ items, selectedIndex, onSelect }: BookshelfProps) {
  if (items.length === 0) {
    return (
      <div className="relative rounded-lg overflow-hidden" style={{ background: SHELF_BACK, border: `1px solid ${SHELF_WOOD_LIGHT}` }}>
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
        background: SHELF_BACK,
        border: `1px solid ${SHELF_WOOD_LIGHT}`,
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
            background: `linear-gradient(to right, ${SHELF_WOOD_EDGE}, ${SHELF_WOOD})`,
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
                background: `linear-gradient(to bottom, ${SHELF_WOOD_EDGE}, ${SHELF_WOOD_LIGHT} 40%, ${SHELF_WOOD})`,
                boxShadow: `0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
              }}
            />
            {/* Front lip / underside shadow */}
            <div
              style={{
                height: 6,
                background: `linear-gradient(to bottom, ${SHELF_WOOD}, transparent)`,
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
            background: `linear-gradient(to left, ${SHELF_WOOD_EDGE}, ${SHELF_WOOD})`,
          }}
        />
      </div>
    </div>
  );
}
