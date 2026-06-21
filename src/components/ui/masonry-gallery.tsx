"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface GalleryItem {
  src: string;
  caption: string;
  id: string;
  type?: "image" | "video";
  w?: number;
  h?: number;
}

interface MasonryGalleryProps {
  images: GalleryItem[];
  columns?: number;
  gap?: number;
  className?: string;
}

function LazyVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} src={src} className={className} muted loop playsInline />;
}

function GalleryImageCard({ item }: { item: GalleryItem }) {
  const [loaded, setLoaded] = useState(false);
  const aspect = `${item.w ?? 800} / ${item.h ?? 600}`;

  return (
    <div className="relative rounded-xl overflow-hidden group transition-transform duration-300 ease-in-out hover:scale-[1.02]">
      {item.type === "video" ? (
        <LazyVideo src={item.src} className="w-full h-auto object-cover" />
      ) : (
        <div className="relative w-full" style={{ aspectRatio: aspect }}>
          {!loaded && <div className="absolute inset-0 img-shimmer" />}
          {/* eslint-disable-next-line @next/next/no-img-element -- gallery uses a fixed aspect-ratio container, not next/image */}
          <img
            src={item.src}
            alt={item.caption}
            loading="lazy"
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setLoaded(true)}
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />
      {(item.type === "video" || loaded) && (
        <div className="absolute top-0 left-0 p-4 pointer-events-none">
          <p className="text-sm font-medium text-white leading-tight drop-shadow-md">
            {item.caption}
          </p>
        </div>
      )}
    </div>
  );
}

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
        <div key={item.id} className="mb-4 break-inside-avoid">
          <GalleryImageCard item={item} />
        </div>
      ))}
    </div>
  );
}
