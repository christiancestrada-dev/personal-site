"use client";

import { useEffect, useState } from "react";
import { MelatoninGraph } from "@/components/sleep-viz";
import { Hypnogram } from "@/components/hypnogram";
import { CyclopsEllipse } from "@/components/cyclops-ellipse";
import { SleepDebt } from "@/components/sleep-debt";
import { ChronotypeSpectrum } from "@/components/chronotype-spectrum";
import { LightPRC } from "@/components/light-prc";
import { BodyTempRhythm } from "@/components/body-temp-rhythm";
import { PageHeader } from "@/components/ui/page-header";

export default function ClockPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)" }}>
      <main className="mx-auto max-w-5xl px-6 py-24">
        <div className="mb-16">
          <PageHeader title="Clock" subtitle="Sleep and circadian graphs" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-16">
          {/* Circadian state */}
          <section>
            <SectionLabel live>How Sleepy Am I?</SectionLabel>
            {mounted && <MelatoninGraph />}
          </section>

          {/* Hypnogram */}
          <section>
            <SectionLabel>Hypnogram</SectionLabel>
            {mounted && <Hypnogram />}
          </section>

          {/* Sleep Debt */}
          <section>
            <SectionLabel subtitle="Can you make up for lost sleep on the weekends?">Sleep Debt Accumulator</SectionLabel>
            {mounted && <SleepDebt />}
          </section>

          {/* Core Body Temp */}
          <section>
            <SectionLabel>Core Body Temperature Rhythm</SectionLabel>
            {mounted && <BodyTempRhythm />}
          </section>

          {/* Chronotype */}
          <section>
            <SectionLabel>Chronotype Spectrum</SectionLabel>
            {mounted && <ChronotypeSpectrum />}
          </section>

          {/* Light PRC */}
          <section>
            <SectionLabel>Light Phase Response Curve</SectionLabel>
            {mounted && <LightPRC />}
          </section>

          {/* CYCLOPS Ellipse */}
          <section className="md:col-span-2">
            <SectionLabel>How CYCLOPS Reads the Clock</SectionLabel>
            {mounted && <CyclopsEllipse />}
          </section>
        </div>
      </main>
    </div>
  );
}

function SectionLabel({ children, live, subtitle }: { children: React.ReactNode; live?: boolean; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--site-text-bright)" }}>
        {children}
        {live && <span style={{ color: "var(--site-accent)" }} className="animate-pulse">●</span>}
      </h2>
      {subtitle && (
        <p className="text-[11px] mt-1" style={{ color: "var(--site-text-muted)", fontFamily: "var(--font-mono)" }}>{subtitle}</p>
      )}
    </div>
  );
}
