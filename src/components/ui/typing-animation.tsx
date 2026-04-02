"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TypingAnimationProps {
  text: string;
  duration?: number;
  className?: string;
  startDelay?: number;
}

export function TypingAnimation({
  text,
  duration = 50,
  className,
  startDelay = 0,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState<string>("");
  const [i, setI] = useState<number>(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(timer);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    const typingEffect = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        setI(i + 1);
      } else {
        clearInterval(typingEffect);
      }
    }, duration);
    return () => clearInterval(typingEffect);
  }, [duration, i, started, text]);

  return (
    <span className={cn("font-mono", className)}>
      {displayedText}
      {i < text.length && (
        <span className="animate-pulse text-[#ff6b60]">▋</span>
      )}
    </span>
  );
}
