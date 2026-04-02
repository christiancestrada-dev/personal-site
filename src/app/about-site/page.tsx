"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function AboutSitePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)" }}>
      <main className="mx-auto max-w-xl px-6 py-24 space-y-12">
        <PageHeader title="About This Site" />

        <div className="space-y-6 leading-7" style={{ color: "var(--site-text-serif)", fontSize: "0.9rem" }}>
          <p>
            This website was built in 2026 over one week. I built it for two reasons:
          </p>

          <ol className="space-y-4 pl-5" style={{ listStyleType: "decimal" }}>
            <li>
              <strong style={{ color: "var(--site-text-bright)" }}>Keep myself accountable with my projects and learnings.</strong>{" "}
              Sharing these in public gives me another level of rigor.
            </li>
            <li>
              <strong style={{ color: "var(--site-text-bright)" }}>Keep myself engaged with the latest stacks.</strong>{" "}
              Iterating on my personal site gives me an opportunity to try new libraries and frameworks.
            </li>
          </ol>
        </div>

        {/* Tech stack */}
        <section>
          <h2
            className="text-lg font-bold mb-5"
            style={{ color: "var(--site-text-bright)" }}
          >
            Built with
          </h2>
          <div className="flex flex-wrap gap-2">
            {["Next.js", "React", "TypeScript", "Tailwind CSS", "Vercel", "Framer Motion"].map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 rounded text-[11px] font-mono"
                style={{ backgroundColor: "var(--site-bg-card)", color: "var(--site-text-secondary)", border: "1px solid var(--site-border)" }}
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
