"use client";

import { PageHeader } from "@/components/ui/page-header";
import { WRITING_LIST } from "@/lib/writing-data";
import { FileText, ExternalLink } from "lucide-react";

export default function WritingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)" }}>
      <main className="mx-auto max-w-xl px-6 py-24 space-y-8">
        <PageHeader title="Writing" subtitle="A selected curation of my writing" />

        {/* List */}
        <div className="space-y-0">
          {WRITING_LIST.map((item, i) => {
            const isPdf = item.url?.endsWith(".pdf");
            return (
              <div
                key={i}
                className="py-5"
                style={{ borderBottom: "1px solid var(--site-border-subtle)" }}
              >
                <div className="flex items-baseline justify-between gap-4 mb-1">
                  <span className="font-bold text-sm" style={{ color: "var(--site-text-bright)" }}>
                    {item.title}
                  </span>
                  <span className="text-[10px] shrink-0 tabular-nums" style={{ color: "var(--site-text-dim)" }}>
                    {item.date}
                  </span>
                </div>
                {item.publication && (
                  <p className="text-[11px] mb-1" style={{ color: "var(--site-text-muted)" }}>
                    {item.publication}
                  </p>
                )}
                {/* PDF preview card */}
                {isPdf && item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-3 rounded-lg p-3 transition-all duration-200 group"
                    style={{
                      backgroundColor: "var(--site-bg-card)",
                      border: "1px solid var(--site-border)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--site-accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--site-border)";
                    }}
                  >
                    <div
                      className="shrink-0 flex items-center justify-center rounded"
                      style={{ width: 40, height: 48, backgroundColor: "rgba(255,107,96,0.1)" }}
                    >
                      <FileText size={20} style={{ color: "var(--site-accent)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "var(--site-text-bright)" }}>
                        Read the essay
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--site-text-muted)" }}>
                        PDF
                      </p>
                    </div>
                    <ExternalLink size={14} style={{ color: "var(--site-text-dim)" }} />
                  </a>
                )}
              </div>
            );
          })}

          {WRITING_LIST.length === 0 && (
            <p className="py-12 text-center text-sm" style={{ color: "var(--site-text-muted)" }}>
              Pieces coming soon
            </p>
          )}

          {WRITING_LIST.length > 0 && (
            <p className="py-8 text-center text-sm" style={{ color: "var(--site-text-muted)" }}>
              More coming soon
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
