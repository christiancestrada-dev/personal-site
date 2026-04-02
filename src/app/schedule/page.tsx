"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function SchedulePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)" }}>
      <main className="mx-auto max-w-xl px-6 py-24 space-y-8">
        <PageHeader title="Schedule a Meeting" subtitle="Pick a time that works for you" />

        <div
          className="rounded-lg p-5"
          style={{ backgroundColor: "var(--site-bg-card-alpha)", border: "1px solid var(--site-border)" }}
        >
          <p className="text-sm mb-5" style={{ color: "var(--site-text-prose)" }}>
            I&apos;m always happy to chat!
          </p>
          <div className="flex gap-3">
            <a
              href="https://cal.com/christianestrada/15min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors"
              style={{
                backgroundColor: "var(--site-accent)",
                color: "#fff",
              }}
            >
              15 min
            </a>
            <a
              href="https://cal.com/christianestrada/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors"
              style={{
                border: "1px solid var(--site-border)",
                color: "var(--site-text-secondary)",
              }}
            >
              30 min
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
