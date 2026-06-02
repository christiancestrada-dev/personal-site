"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MelatoninGraph } from "@/components/sleep-viz";
import { Hypnogram } from "@/components/hypnogram";
import { CyclopsEllipse } from "@/components/cyclops-ellipse";
import { SleepDebt } from "@/components/sleep-debt";
import { ChronotypeSpectrum } from "@/components/chronotype-spectrum";
import { LightPRC } from "@/components/light-prc";
import { BodyTempRhythm } from "@/components/body-temp-rhythm";
import { Cyclops3D } from "@/components/cyclops-3d";
import { PhaseSpace3D } from "@/components/phase-space-3d";
import { LightDoseSurface } from "@/components/light-dose-surface";
import { PageHeader } from "@/components/ui/page-header";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

export default function ClockPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)" }}>
      <main className="mx-auto max-w-5xl px-6 py-24">
        <div className="mb-16">
          <PageHeader title="Visualizations" subtitle="Sleep and circadian graphs" />
        </div>

        <div className="space-y-16">
          {/* Light PRC — hero, full width */}
          <motion.section
            variants={fadeUp} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}>
            <SectionLabel>Light Phase Response Curve</SectionLabel>
            {mounted && <LightPRC />}
          </motion.section>

          {/* CYCLOPS 3D — full width */}
          <motion.section
            variants={fadeUp} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}>
            <SectionLabel subtitle="3 genes · 120° phase offsets · any 2D projection gives an ellipse · drag to rotate">
              CYCLOPS: Gene Expression Manifold
            </SectionLabel>
            {mounted && <Cyclops3D />}
          </motion.section>

          {/* Phase Space 3D — full width */}
          <motion.section
            variants={fadeUp} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}>
            <SectionLabel subtitle="drag to rotate · X = circadian signal C(t) · Y = homeostatic pressure S(t) · Z = time over 3 days">
              Adenosine / Circadian Phase Space
            </SectionLabel>
            {mounted && <PhaseSpace3D />}
          </motion.section>

          {/* Light Dose-Response Surface — full width */}
          <motion.section
            variants={fadeUp} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}>
            <SectionLabel subtitle="drag to rotate · X = clock time · Z = light intensity (lux, log scale) · height = phase shift">
              Light Dose-Response Surface
            </SectionLabel>
            {mounted && <LightDoseSurface />}
          </motion.section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-16">
            <motion.section
              variants={fadeUp} initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}>
              <SectionLabel live>How Sleepy Am I?</SectionLabel>
              {mounted && <MelatoninGraph />}
            </motion.section>

            <motion.section
              variants={fadeUp} initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}>
              <SectionLabel>Hypnogram</SectionLabel>
              {mounted && <Hypnogram />}
            </motion.section>

            <motion.section
              variants={fadeUp} initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}>
              <SectionLabel subtitle="Can you make up for lost sleep on the weekends?">Sleep Debt Accumulator</SectionLabel>
              {mounted && <SleepDebt />}
            </motion.section>

            <motion.section
              variants={fadeUp} initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}>
              <SectionLabel>Core Body Temperature Rhythm</SectionLabel>
              {mounted && <BodyTempRhythm />}
            </motion.section>

            <motion.section
              variants={fadeUp} initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}>
              <SectionLabel>Chronotype Spectrum</SectionLabel>
              {mounted && <ChronotypeSpectrum />}
            </motion.section>

            <motion.section
              variants={fadeUp} initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}>
              <SectionLabel>How CYCLOPS Reads the Clock</SectionLabel>
              {mounted && <CyclopsEllipse />}
            </motion.section>
          </div>
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
