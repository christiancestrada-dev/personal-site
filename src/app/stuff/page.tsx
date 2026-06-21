"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function StuffPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)" }}>
      <main className="mx-auto max-w-2xl px-6 py-24 space-y-8">
        <PageHeader title="Stuff" subtitle="A look at things I've built" />

        <div className="space-y-4">
          <video
            controls
            playsInline
            preload="metadata"
            className="w-full rounded-lg"
            style={{ border: "1px solid var(--site-border)" }}
          >
            <source src="/stuff/aurebesh-demo.mp4" type="video/mp4" />
          </video>

          <p className="text-sm leading-6" style={{ color: "var(--site-text-secondary)" }}>
            A quick demo of an Aurebesh ↔ English translator I built — type any text and watch it
            decode letter by letter, or switch to the Star Wars-themed Card Style view.{" "}
            <a
              href="https://deploy-aurebesh-translator.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--site-accent)" }}
            >
              Try it yourself →
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
