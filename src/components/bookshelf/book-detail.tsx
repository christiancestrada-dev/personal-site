"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { getSpineColor } from "@/lib/spine-colors";
import type { ReadingItem } from "@/lib/reading-data";

const STATUS_COLORS: Record<ReadingItem["status"], string> = {
  read: "#4ade80",
  reading: "#fbbf24",
  queued: "#525252",
};

const STATUS_LABELS: Record<ReadingItem["status"], string> = {
  read: "Read",
  reading: "Currently reading",
  queued: "Queued",
};

interface BookDetailProps {
  item: ReadingItem | null;
  onClose: () => void;
}

export function BookDetail({ item, onClose }: BookDetailProps) {
  useEffect(() => {
    if (!item) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-sm rounded-xl p-6 space-y-4"
            style={{
              backgroundColor: "var(--site-bg-card)",
              border: "1px solid var(--site-border)",
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-md transition-colors"
              style={{ color: "var(--site-text-dim)" }}
            >
              <X size={16} />
            </button>

            {/* Colored bar matching spine */}
            <div
              className="w-12 h-1.5 rounded-full"
              style={{ backgroundColor: getSpineColor(item.title, item.status).base }}
            />

            {/* Title & Author */}
            <div>
              <h3
                className="text-lg font-semibold leading-tight"
                style={{ color: "var(--site-text-bright)" }}
              >
                {item.title}
              </h3>
              <p className="text-sm mt-1" style={{ color: "var(--site-text-secondary)" }}>
                {item.author}
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[item.status] }}
              />
              <span className="text-xs" style={{ color: "var(--site-text-secondary)" }}>
                {STATUS_LABELS[item.status]}
              </span>
            </div>

            {/* Progress bar */}
            {item.progress && (
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--site-bg)", maxWidth: 160 }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(item.progress.current / item.progress.total) * 100}%`,
                      backgroundColor: "#fbbf24",
                    }}
                  />
                </div>
                <span className="text-[10px] tabular-nums" style={{ color: "var(--site-text-secondary)" }}>
                  pg {item.progress.current}/{item.progress.total}
                </span>
              </div>
            )}

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded text-[9px]"
                    style={{
                      backgroundColor: "var(--site-bg)",
                      color: "var(--site-text-muted)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Link */}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors"
                style={{
                  color: "var(--site-accent)",
                  border: "1px solid var(--site-border)",
                }}
              >
                Open <ExternalLink size={11} />
              </a>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
