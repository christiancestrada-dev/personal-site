"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface GalleryItem {
  src: string;
  caption: string;
  id: string;
  type?: "image" | "video";
}

interface MasonryGalleryProps {
  images: GalleryItem[];
  columns?: number;
  gap?: number;
  className?: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function MasonryGallery({
  images,
  columns = 3,
  gap = 4,
  className,
}: MasonryGalleryProps) {
  const [cols, setCols] = React.useState(columns);

  React.useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setCols(1);
      else if (w < 1024) setCols(2);
      else setCols(columns);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [columns]);

  return (
    <div
      className={cn("w-full", className)}
      style={{ columnCount: cols, columnGap: `${gap * 0.25}rem` }}
    >
      {images.map((item) => (
        <motion.div
          key={item.id}
          className="mb-4 break-inside-avoid"
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="relative rounded-xl overflow-hidden group transition-transform duration-300 ease-in-out hover:scale-[1.02]">
            {item.type === "video" ? (
              <video
                src={item.src}
                className="w-full h-auto object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={item.src}
                alt={item.caption}
                className="w-full h-auto object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 p-4 pointer-events-none">
              <p className="text-sm font-medium text-white leading-tight drop-shadow-md">
                {item.caption}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
