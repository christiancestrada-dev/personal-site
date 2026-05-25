import React from "react";
import { cn } from "@/lib/utils";

interface BubbleTextProps {
  text: string;
  className?: string;
}

export function BubbleText({ text, className }: BubbleTextProps) {
  return (
    <span className={cn("inline", className)}>
      {text.split("").map((char, i) =>
        char === " " ? (
          <span key={i}>{" "}</span>
        ) : (
          <span key={i} className="bubble-letter inline-block">
            {char}
          </span>
        )
      )}
    </span>
  );
}
