"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Mail, Copy, Check, Calendar, ExternalLink } from "lucide-react";

const EMAIL = "christian.c.estrada@gmail.com";

const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/christian._.e/", description: "Photos & stories" },
  { label: "LinkedIn", href: "https://linkedin.com/in/christiancestrada", description: "Professional network" },
];

export default function ContactPage() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    await navigator.clipboard.writeText(EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)" }}>
      <main className="mx-auto max-w-xl px-6 py-24 space-y-12">
        <PageHeader title="Contact" subtitle="Let's connect — I'd love to hear from you" />

        {/* Email section */}
        <section className="space-y-4">
          <h2
            className="text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--site-text-bright)" }}
          >
            Email
          </h2>
          <div
            className="rounded-lg p-5"
            style={{ backgroundColor: "var(--site-bg-card-alpha)", border: "1px solid var(--site-border)" }}
          >
            <p className="text-sm font-mono mb-4" style={{ color: "var(--site-text)" }}>
              {EMAIL}
            </p>
            <div className="flex gap-3">
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors"
                style={{
                  backgroundColor: "var(--site-accent)",
                  color: "#fff",
                }}
              >
                <Mail size={14} />
                Compose
              </a>
              <button
                onClick={copyEmail}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors"
                style={{
                  backgroundColor: "transparent",
                  color: copied ? "#4ade80" : "var(--site-text-secondary)",
                  border: `1px solid ${copied ? "#4ade80" : "var(--site-border)"}`,
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </section>

        {/* Book a time */}
        <section className="space-y-4">
          <h2
            className="text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--site-text-bright)" }}
          >
            Book a time
          </h2>
          <div
            className="rounded-lg p-5"
            style={{ backgroundColor: "var(--site-bg-card-alpha)", border: "1px solid var(--site-border)" }}
          >
            <p className="text-sm mb-4" style={{ color: "var(--site-text-prose)" }}>
              I&apos;m always happy to chat! Schedule a time that works for you.
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
                <Calendar size={14} />
                15 min
              </a>
              <a
                href="https://cal.com/christianestrada/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors"
                style={{
                  backgroundColor: "transparent",
                  color: "var(--site-text-secondary)",
                  border: "1px solid var(--site-border)",
                }}
              >
                <Calendar size={14} />
                30 min
              </a>
            </div>
          </div>
        </section>

        {/* Stay in touch */}
        <section className="space-y-4">
          <h2
            className="text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--site-text-bright)" }}
          >
            Stay in touch
          </h2>
          <div className="space-y-0">
            {SOCIALS.map(({ label, href, description }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-3 group transition-colors"
                style={{ borderBottom: "1px solid var(--site-border-subtle)" }}
              >
                <div>
                  <span className="text-sm font-medium" style={{ color: "var(--site-text-bright)" }}>
                    {label}
                  </span>
                  <p className="text-xs mt-0.5" style={{ color: "var(--site-text-muted)" }}>
                    {description}
                  </p>
                </div>
                <ExternalLink
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                  style={{ color: "var(--site-text-secondary)" }}
                />
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
