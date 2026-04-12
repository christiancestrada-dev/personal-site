"use client";

import { Library, List } from "lucide-react";

export type ViewMode = "shelf" | "list";

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div
      className="flex rounded-md p-0.5 gap-0.5"
      style={{ border: "1px solid var(--site-border)" }}
    >
      <button
        onClick={() => onChange("shelf")}
        className="p-1.5 rounded transition-colors"
        style={{
          color: view === "shelf" ? "var(--site-text-bright)" : "var(--site-text-dim)",
          backgroundColor: view === "shelf" ? "var(--site-nav-active)" : "transparent",
        }}
        title="Bookshelf view"
      >
        <Library size={14} />
      </button>
      <button
        onClick={() => onChange("list")}
        className="p-1.5 rounded transition-colors"
        style={{
          color: view === "list" ? "var(--site-text-bright)" : "var(--site-text-dim)",
          backgroundColor: view === "list" ? "var(--site-nav-active)" : "transparent",
        }}
        title="List view"
      >
        <List size={14} />
      </button>
    </div>
  );
}
