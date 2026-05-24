"use client";

import { useEffect, useState } from "react";

interface Star {
  id: number;
  x: number;   // vw
  top: number;  // vh from top
  size: number; // px
  delay: number;
  dur: number;
}

const COUNT = 50;

export function PageStars() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    setStars(
      Array.from({ length: COUNT }, (_, i) => ({
        id: i,
        x: 1 + Math.random() * 98,
        // spread from below the hero (70vh) all the way to ~400vh
        top: 75 + Math.random() * 325,
        size: 0.8 + Math.random() * 2.2,
        delay: Math.random() * 6,
        dur: 2.5 + Math.random() * 3.5,
      }))
    );
  }, []);

  if (!stars.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {stars.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}vw`,
            top: `${s.top}vh`,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            backgroundColor: "#c8dcff",
            animationName: "page-star-twinkle",
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
            animationIterationCount: "infinite",
            animationTimingFunction: "ease-in-out",
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
