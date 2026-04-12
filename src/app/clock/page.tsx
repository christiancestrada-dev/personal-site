"use client";

import { useEffect, useState } from "react";
import { MelatoninGraph } from "@/components/sleep-viz";
import { Hypnogram } from "@/components/hypnogram";
import { CyclopsEllipse } from "@/components/cyclops-ellipse";
import { SleepDebt } from "@/components/sleep-debt";
import { PageHeader } from "@/components/ui/page-header";

export default function ClockPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)" }}>
      <main className="mx-auto max-w-xl px-6 py-24 space-y-16">
        <PageHeader title="Clock" subtitle="My live sleep and circadian data based on the two-process model" />

        {/* Circadian state */}
        <section>
          <SectionLabel live>How sleepy am I?</SectionLabel>
          {mounted && <MelatoninGraph />}
        </section>

        {/* Hypnogram */}
        <section>
          <SectionLabel>Hypnogram</SectionLabel>
          {mounted && <Hypnogram />}
        </section>

        {/* Sleep Debt */}
        <section>
          <SectionLabel>Sleep Debt Accumulator</SectionLabel>
          {mounted && <SleepDebt />}
        </section>

        {/* CYCLOPS Ellipse */}
        <section>
          <SectionLabel>How CYCLOPS Reads the Clock</SectionLabel>
          {mounted && <CyclopsEllipse />}
        </section>
      </main>
    </div>
  );
}

function SectionLabel({ children, live }: { children: React.ReactNode; live?: boolean }) {
  return (
    <h2 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: "var(--site-text-bright)" }}>
      {children}
      {live && <span style={{ color: "var(--site-accent)" }} className="animate-pulse">●</span>}
    </h2>
  );
}
