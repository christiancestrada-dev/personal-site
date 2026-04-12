"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PolaroidImage {
  src: string;
  caption: string;
  id: string;
}

interface PolaroidGalleryProps {
  images: PolaroidImage[];
  className?: string;
}

export function PolaroidGallery({
  images,
  className = "",
}: PolaroidGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(0);

  const next = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const prev = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Positions for background cards fanned out behind the active one
  const getCardStyle = (offset: number) => {
    // offset: 0 = active, 1 = next, -1 = prev, etc.
    if (offset === 0) {
      return { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, zIndex: 10 };
    }
    const absOffset = Math.abs(offset);
    if (absOffset > 2) {
      return { x: 0, y: 0, rotate: 0, scale: 0.85, opacity: 0, zIndex: 0 };
    }
    const side = offset > 0 ? 1 : -1;
    return {
      x: side * absOffset * 80,
      y: absOffset * 12,
      rotate: side * absOffset * 6,
      scale: 1 - absOffset * 0.07,
      opacity: 1 - absOffset * 0.3,
      zIndex: 10 - absOffset,
    };
  };

  const getOffset = (index: number) => {
    let diff = index - activeIndex;
    if (diff > images.length / 2) diff -= images.length;
    if (diff < -images.length / 2) diff += images.length;
    return diff;
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Card area */}
      <div className="relative h-[480px] flex items-center justify-center">
        {images.map((image, index) => {
          const offset = getOffset(index);
          const style = getCardStyle(offset);

          if (Math.abs(offset) > 2) return null;

          return (
            <motion.div
              key={image.id}
              className="absolute cursor-pointer"
              animate={{
                x: style.x,
                y: style.y,
                rotate: style.rotate,
                scale: style.scale,
                opacity: style.opacity,
                zIndex: style.zIndex,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              onClick={() => {
                if (offset === 0) {
                  next();
                } else {
                  setDirection(offset > 0 ? 1 : -1);
                  setActiveIndex(index);
                }
              }}
            >
              <div
                className="bg-white p-4 pb-3 shadow-2xl rounded-sm select-none"
                style={{ width: "280px" }}
              >
                <img
                  src={image.src}
                  alt={image.caption}
                  className="w-full h-72 object-cover rounded-sm pointer-events-none"
                  draggable={false}
                />
                <p className="mt-2.5 text-[11px] text-gray-600 text-center leading-relaxed min-h-[2.5em]">
                  {image.caption}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <button
          onClick={prev}
          className="p-2 rounded-full transition-colors"
          style={{ color: "var(--site-text-secondary)" }}
          aria-label="Previous"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > activeIndex ? 1 : -1);
                setActiveIndex(i);
              }}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i === activeIndex ? "var(--site-accent)" : "var(--site-text-dim)",
                transform: i === activeIndex ? "scale(1.3)" : "scale(1)",
              }}
              aria-label={`Go to photo ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="p-2 rounded-full transition-colors"
          style={{ color: "var(--site-text-secondary)" }}
          aria-label="Next"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
