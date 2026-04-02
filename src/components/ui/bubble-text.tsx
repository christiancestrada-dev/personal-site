import React from "react";
import { cn } from "@/lib/utils";

interface BubbleTextProps {
  text: string;
  className?: string;
}

export function BubbleText({ text, className }: BubbleTextProps) {
  return <span className={cn(className)}>{text}</span>;
}
