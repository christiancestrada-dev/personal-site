"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { loadContent, saveContent } from "@/lib/content-api";
import { SleepHero, FloatingSheep } from "@/components/sleep-hero";
import { BubbleText } from "@/components/ui/bubble-text";
import { AdminBar } from "@/components/ui/admin-bar";
import { usePageAdmin } from "@/lib/use-page-admin";
import { Pencil, Check, X, Plus, Trash2, GripVertical } from "lucide-react";
import React from "react";

// ─── Default content ─────────────────────────────────────────────────────────

const DEFAULT_ABOUT = [
  `Hey, I'm Christian; welcome! I'm fascinated by neuroscience and sleep (and, more urgently, what happens when you don't) and have done some really cool research in these fields, as well as various related ventures and social projects.`,
  `Outside of that: I play drums, coach/play tennis, and have strong opinions about Star Wars. I currently live in a house with nine of the smartest people I know, and you might catch me talking to literally anyone on the train. (I've been told I seem like "a very offline person," which is maybe the nicest thing anyone has ever said to me.)`,
];

const DEFAULT_ABOUT_META = "Boston · Philadelphia · Phillips Academy, Andover";

interface StatusEntry { label: string; value: string; href?: string; href2?: string; href2Label?: string }
const DEFAULT_STATUS: StatusEntry[] = [
  { label: "studying", value: "Religion, Literature & the Arts (philosophy of crime class)" },
  { label: "reading", value: "The Sleep Solution — Dr. Chris Winter (who I helped bring to speak at my school)" },
  { label: "listening", value: "flipturn; ", href2Label: "1980s Horror Film", href2: "https://open.spotify.com/playlist/5H9G83mqVwXCfddtFrLvEF" },
];

interface WorkEntry { role: string; where: string; date: string; href?: string }
const DEFAULT_WORK: WorkEntry[] = [
  { where: "Arcascope", role: "Developer", date: "2026\u2013Present", href: "https://arcascope.com/" },
  { where: "CHOP & UPenn Mitchell Sleep Lab", role: "Author", date: "2025\u2013Present" },
  { where: "UPenn SNaP Sleep Lab", role: "Researcher", date: "2025\u2013Present" },
  { where: "Slow Wave Sleep Lab \u00b7 UPenn", role: "Researcher", date: "2025\u2013Present" },
  { where: "St. Luke's Health Network", role: "Physician Observer", date: "2024\u2013Present" },
  { where: "Temple University REACH Lab", role: "Student Research Intern", date: "2024" },
  { where: "Papers Research Organization", role: "Co-Founder", date: "2023\u2013Present", href: "https://andoverpapers.org/" },
  { where: "Men's Mental Health \u00b7 Andover", role: "Co-President", date: "2024\u2013Present" },
  { where: "EcoAction \u00b7 Andover", role: "Co-President", date: "2023\u2013Present", href: "https://www.instagram.com/agreenerblue/" },
  { where: "Health Advocacy and Equity League", role: "Board Member", date: "2024\u20132025" },
  { where: "The Phillipian", role: "Staff Writer", date: "2023\u20132024", href: "https://phillipian.net/author/cestrada/" },
  { where: "Private", role: "Tennis Coach", date: "2022\u2013Present" },
  { where: "Church & Andover Band", role: "Drummer", date: "Always" },
];

interface ConnectLink { href: string; label: string }
const DEFAULT_CONNECT_TEXT = "Feel free to email me about anything at ";
const DEFAULT_CONNECT_EMAIL = "christian.c.estrada@gmail.com";
const DEFAULT_CONNECT_LINKS: ConnectLink[] = [
  { href: "mailto:christian.c.estrada@gmail.com", label: "Email" },
  { href: "https://www.instagram.com/christian._.e/", label: "Instagram" },
  { href: "https://linkedin.com/in/christiancestrada", label: "LinkedIn" },
  { href: "https://substack.com", label: "Substack" },
  { href: "https://open.spotify.com", label: "Spotify" },
];

interface HomeContent {
  about: string[];
  aboutMeta: string;
  status: StatusEntry[];
  work: WorkEntry[];
  connectText: string;
  connectEmail: string;
  connectLinks: ConnectLink[];
}

function getDefaults(): HomeContent {
  return {
    about: DEFAULT_ABOUT,
    aboutMeta: DEFAULT_ABOUT_META,
    status: DEFAULT_STATUS,
    work: DEFAULT_WORK,
    connectText: DEFAULT_CONNECT_TEXT,
    connectEmail: DEFAULT_CONNECT_EMAIL,
    connectLinks: DEFAULT_CONNECT_LINKS,
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const admin = usePageAdmin("home");
  const [content, setContent] = useState<HomeContent>(getDefaults);
  const [editing, setEditing] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadContent<HomeContent>("home-content").then((data) => {
        if (data) setContent({ ...getDefaults(), ...data });
      });
    }
  }, []);

  const save = useCallback((updated: HomeContent) => {
    setContent(updated);
    saveContent("home-content", updated);
  }, []);

  const reloadContent = useCallback(() => {
    loadContent<HomeContent>("home-content").then((data) => {
      if (data) setContent({ ...getDefaults(), ...data });
      else setContent(getDefaults());
    });
  }, []);

  const inputStyle: React.CSSProperties = {
    backgroundColor: "var(--site-bg)",
    color: "var(--site-text)",
    border: "1px solid var(--site-border)",
  };

  return (
    <>
      <div className="relative min-h-screen" style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)" }}>
        {/* Sheep float across the entire page */}
        {mounted && <FloatingSheep />}
        {/* Hero */}
        <div>{mounted && <SleepHero />}</div>

        {/* ── Main content ── */}
        <main className="relative max-w-6xl px-8 pt-6 pb-24 space-y-20 mx-auto" style={{ zIndex: 3, backgroundColor: "color-mix(in srgb, var(--site-bg) 85%, transparent)" }}>

          {/* Name */}
          <h1 className="font-black uppercase" style={{ color: "var(--site-text-bright)", fontSize: "clamp(3rem, 7vw, 5.5rem)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            <BubbleText text="Christian" /><br />
            <BubbleText text="Estrada" />
          </h1>

          {/* About + Current — two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-16 -mt-10">
            {/* About — left column */}
            <section>
              <div className="flex items-start justify-between">
                <SectionLabel>About</SectionLabel>
                <AdminBar {...admin} />
              </div>
              <div className="space-y-4 leading-7" style={{ color: "var(--site-text-serif)", fontSize: "1rem" }}>
                {content.about.map((para, i) => (
                  <EditableP
                    key={i}
                    value={para}
                    isEditing={admin.isAdmin && editing === `about-${i}`}
                    onEdit={() => setEditing(`about-${i}`)}
                    onSave={(v) => { const next = [...content.about]; next[i] = v; save({ ...content, about: next }); setEditing(null); }}
                    onCancel={() => setEditing(null)}
                    canEdit={admin.isAdmin}
                    inputStyle={inputStyle}
                  />
                ))}
                {admin.isAdmin && (
                  <button
                    onClick={() => { save({ ...content, about: [...content.about, ""] }); setEditing(`about-${content.about.length}`); }}
                    className="flex items-center gap-1 text-xs py-1 px-2 rounded-md transition-colors"
                    style={{ color: "var(--site-text-dim)", border: "1px dashed var(--site-border)" }}
                  >
                    <Plus size={12} /> Add paragraph
                  </button>
                )}
                <EditableP
                  value={content.aboutMeta}
                  isEditing={admin.isAdmin && editing === "aboutMeta"}
                  onEdit={() => setEditing("aboutMeta")}
                  onSave={(v) => { save({ ...content, aboutMeta: v }); setEditing(null); }}
                  onCancel={() => setEditing(null)}
                  canEdit={admin.isAdmin}
                  inputStyle={inputStyle}
                  className=""
                  textStyle={{ color: "var(--site-text-secondary)" }}
                />
              </div>
            </section>

            {/* Current — right column as cards */}
            <section>
              <SectionLabel>Current</SectionLabel>
              <div className="space-y-3">
                {content.status.map((item, i) => (
                  <div key={i}>
                    {admin.isAdmin && editing === `status-${i}` ? (
                      <div className="space-y-2 rounded-lg p-4" style={{ backgroundColor: "var(--site-bg-card)", border: "1px solid var(--site-border)" }}>
                        <input value={item.label} onChange={(e) => { const s = [...content.status]; s[i] = { ...s[i], label: e.target.value }; setContent({ ...content, status: s }); }} className="w-full px-3 py-1.5 rounded-md text-sm outline-none" style={inputStyle} placeholder="Label" />
                        <input value={item.value} onChange={(e) => { const s = [...content.status]; s[i] = { ...s[i], value: e.target.value }; setContent({ ...content, status: s }); }} className="w-full px-3 py-1.5 rounded-md text-sm outline-none" style={inputStyle} placeholder="Value" />
                        <input value={item.href2Label || ""} onChange={(e) => { const s = [...content.status]; s[i] = { ...s[i], href2Label: e.target.value || undefined }; setContent({ ...content, status: s }); }} className="w-full px-3 py-1.5 rounded-md text-sm outline-none" style={inputStyle} placeholder="Link label (optional)" />
                        <input value={item.href2 || ""} onChange={(e) => { const s = [...content.status]; s[i] = { ...s[i], href2: e.target.value || undefined }; setContent({ ...content, status: s }); }} className="w-full px-3 py-1.5 rounded-md text-sm font-mono outline-none" style={inputStyle} placeholder="Link URL (optional)" />
                        <div className="flex gap-2">
                          <button onClick={() => { save(content); setEditing(null); }} className="p-1.5 rounded-md" style={{ color: "#4ade80" }}><Check size={14} /></button>
                          <button onClick={() => { reloadContent(); setEditing(null); }} className="p-1.5 rounded-md" style={{ color: "var(--site-text-dim)" }}><X size={14} /></button>
                          <button onClick={() => { const s = content.status.filter((_, idx) => idx !== i); save({ ...content, status: s }); setEditing(null); }} className="p-1.5 rounded-md" style={{ color: "var(--site-accent)" }}><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="rounded-lg p-4 group"
                        style={{ backgroundColor: "var(--site-bg-card)", border: "1px solid var(--site-border)", borderTop: "1px solid rgba(219,112,147,0.12)" }}
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--site-text-muted)" }}>
                            <BubbleText text={item.label} />
                          </p>
                          {admin.isAdmin && (
                            <button onClick={() => setEditing(`status-${i}`)} className="p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--site-text-dim)" }}><Pencil size={11} /></button>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--site-text-serif)" }}>
                          {item.href ? (
                            <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "var(--site-accent)" }}><BubbleText text={`${item.value} →`} /></a>
                          ) : (
                            <BubbleText text={item.value} />
                          )}
                          {item.href2 && item.href2Label && (
                            <>
                              {" "}
                              <a href={item.href2} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "var(--site-text-serif)" }}><BubbleText text={item.href2Label} /></a>
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {admin.isAdmin && (
                <button
                  onClick={() => {
                    const s = [...content.status, { label: "", value: "" }];
                    setContent({ ...content, status: s });
                    setEditing(`status-${s.length - 1}`);
                  }}
                  className="flex items-center gap-1 text-xs py-1.5 px-2 mt-3 rounded-md transition-colors"
                  style={{ color: "var(--site-text-dim)", border: "1px dashed var(--site-border)" }}
                >
                  <Plus size={12} /> Add status
                </button>
              )}
            </section>
          </div>

          {/* Work */}
          <section>
            <SectionLabel>Work</SectionLabel>
            <div className="space-y-0">
              {content.work.map((item, i) => (
                <div key={i}>
                  {admin.isAdmin && editing === `work-${i}` ? (
                    <div className="py-3 space-y-2" style={{ borderBottom: "1px solid var(--site-border-subtle)" }}>
                      <input value={item.where} onChange={(e) => { const w = [...content.work]; w[i] = { ...w[i], where: e.target.value }; setContent({ ...content, work: w }); }} className="w-full px-3 py-1.5 rounded-md text-sm outline-none" style={inputStyle} placeholder="Place" />
                      <input value={item.role} onChange={(e) => { const w = [...content.work]; w[i] = { ...w[i], role: e.target.value }; setContent({ ...content, work: w }); }} className="w-full px-3 py-1.5 rounded-md text-sm outline-none" style={inputStyle} placeholder="Role" />
                      <input value={item.date} onChange={(e) => { const w = [...content.work]; w[i] = { ...w[i], date: e.target.value }; setContent({ ...content, work: w }); }} className="w-full px-3 py-1.5 rounded-md text-sm outline-none" style={inputStyle} placeholder="Date" />
                      <input value={item.href || ""} onChange={(e) => { const w = [...content.work]; w[i] = { ...w[i], href: e.target.value || undefined }; setContent({ ...content, work: w }); }} className="w-full px-3 py-1.5 rounded-md text-sm font-mono outline-none" style={inputStyle} placeholder="URL (optional)" />
                      <div className="flex gap-2">
                        <button onClick={() => { save(content); setEditing(null); }} className="p-1.5 rounded-md" style={{ color: "#4ade80" }}><Check size={14} /></button>
                        <button onClick={() => { reloadContent(); setEditing(null); }} className="p-1.5 rounded-md" style={{ color: "var(--site-text-dim)" }}><X size={14} /></button>
                        <button onClick={() => { const w = content.work.filter((_, idx) => idx !== i); save({ ...content, work: w }); setEditing(null); }} className="p-1.5 rounded-md" style={{ color: "var(--site-accent)" }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-baseline gap-4 py-3 group" style={{ borderBottom: "1px solid var(--site-border-subtle)", fontSize: "0.95rem" }}>
                      <span className="font-medium shrink-0" style={{ color: "var(--site-text-bright)" }}>
                        <BubbleText text={item.role} />
                      </span>
                      <span className="flex-1 text-right text-sm" style={{ color: "var(--site-text-muted)" }}>
                        {item.href ? (
                          <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition-opacity">
                            <BubbleText text={`${item.where} \u2192`} />
                          </a>
                        ) : (
                          <BubbleText text={item.where} />
                        )}
                      </span>
                      <span className="shrink-0 text-sm tabular-nums" style={{ color: "var(--site-text-muted)", minWidth: "6.5rem", textAlign: "right" }}>
                        <BubbleText text={item.date} />
                      </span>
                      {admin.isAdmin && (
                        <button onClick={() => setEditing(`work-${i}`)} className="p-1 rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--site-text-dim)" }}><Pencil size={12} /></button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {admin.isAdmin && (
              <button
                onClick={() => {
                  const w = [...content.work, { role: "", where: "", date: "" }];
                  setContent({ ...content, work: w });
                  setEditing(`work-${w.length - 1}`);
                }}
                className="flex items-center gap-1 text-xs py-1.5 px-2 mt-3 rounded-md transition-colors"
                style={{ color: "var(--site-text-dim)", border: "1px dashed var(--site-border)" }}
              >
                <Plus size={12} /> Add work
              </button>
            )}
          </section>

          {/* Connect */}
          <section>
            <SectionLabel>Connect</SectionLabel>
            <p className="mb-5 leading-7" style={{ color: "var(--site-text-prose)", fontSize: "1rem" }}>
              <BubbleText text={content.connectText} />
              <a href={`mailto:${content.connectEmail}`} style={{ color: "var(--site-text)" }} className="hover:underline">
                <BubbleText text={content.connectEmail.replace("@", " [at] ")} />
              </a>
              {admin.isAdmin && (
                <button onClick={() => setEditing("connect")} className="p-1 ml-1 rounded-md inline-flex" style={{ color: "var(--site-text-dim)" }}><Pencil size={12} /></button>
              )}
            </p>
            {admin.isAdmin && editing === "connect" && (
              <div className="mb-4 space-y-2 rounded-lg p-4" style={{ backgroundColor: "var(--site-bg-card-alpha)", border: "1px solid var(--site-border)" }}>
                <input value={content.connectText} onChange={(e) => setContent({ ...content, connectText: e.target.value })} className="w-full px-3 py-1.5 rounded-md text-sm outline-none" style={inputStyle} placeholder="Connect text" />
                <input value={content.connectEmail} onChange={(e) => setContent({ ...content, connectEmail: e.target.value })} className="w-full px-3 py-1.5 rounded-md text-sm font-mono outline-none" style={inputStyle} placeholder="Email" />
                <div className="flex gap-2">
                  <button onClick={() => { save(content); setEditing(null); }} className="p-1.5 rounded-md" style={{ color: "#4ade80" }}><Check size={14} /></button>
                  <button onClick={() => { reloadContent(); setEditing(null); }} className="p-1.5 rounded-md" style={{ color: "var(--site-text-dim)" }}><X size={14} /></button>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-6" style={{ fontSize: "0.95rem" }}>
              {content.connectLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-1 group">
                  <a href={link.href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--site-accent)" }} className="transition-colors duration-150 hover:opacity-75">
                    <BubbleText text={`${link.label} →`} />
                  </a>
                  {admin.isAdmin && (
                    <button onClick={() => setEditing(`link-${i}`)} className="p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--site-text-dim)" }}><Pencil size={10} /></button>
                  )}
                </div>
              ))}
            </div>
            {admin.isAdmin && editing?.startsWith("link-") && (() => {
              const i = parseInt(editing.split("-")[1]);
              const link = content.connectLinks[i];
              if (!link) return null;
              return (
                <div className="mt-3 space-y-2 rounded-lg p-4" style={{ backgroundColor: "var(--site-bg-card-alpha)", border: "1px solid var(--site-border)" }}>
                  <input value={link.label} onChange={(e) => { const l = [...content.connectLinks]; l[i] = { ...l[i], label: e.target.value }; setContent({ ...content, connectLinks: l }); }} className="w-full px-3 py-1.5 rounded-md text-sm outline-none" style={inputStyle} placeholder="Label" />
                  <input value={link.href} onChange={(e) => { const l = [...content.connectLinks]; l[i] = { ...l[i], href: e.target.value }; setContent({ ...content, connectLinks: l }); }} className="w-full px-3 py-1.5 rounded-md text-sm font-mono outline-none" style={inputStyle} placeholder="URL" />
                  <div className="flex gap-2">
                    <button onClick={() => { save(content); setEditing(null); }} className="p-1.5 rounded-md" style={{ color: "#4ade80" }}><Check size={14} /></button>
                    <button onClick={() => { reloadContent(); setEditing(null); }} className="p-1.5 rounded-md" style={{ color: "var(--site-text-dim)" }}><X size={14} /></button>
                    <button onClick={() => { const l = content.connectLinks.filter((_, idx) => idx !== i); save({ ...content, connectLinks: l }); setEditing(null); }} className="p-1.5 rounded-md" style={{ color: "var(--site-accent)" }}><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })()}
            {admin.isAdmin && (
              <button
                onClick={() => {
                  const l = [...content.connectLinks, { href: "", label: "" }];
                  setContent({ ...content, connectLinks: l });
                  setEditing(`link-${l.length - 1}`);
                }}
                className="flex items-center gap-1 text-xs py-1.5 px-2 mt-3 rounded-md transition-colors"
                style={{ color: "var(--site-text-dim)", border: "1px dashed var(--site-border)" }}
              >
                <Plus size={12} /> Add link
              </button>
            )}
          </section>

          {/* Footer */}
          <footer className="pt-8 text-xs" style={{ borderTop: "1px solid var(--site-border)", borderImage: "linear-gradient(to right, var(--site-border), rgba(219,112,147,0.18), var(--site-border)) 1", color: "var(--site-text-muted)" }}>
            <BubbleText text="Christian Estrada · © 2026" />
          </footer>
        </main>
      </div>
    </>
  );
}

// ─── Editable paragraph component ────────────────────────────────────────────

function EditableP({ value, isEditing, onEdit, onSave, onCancel, canEdit, inputStyle, className, textStyle }: {
  value: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (v: string) => void;
  onCancel: () => void;
  canEdit: boolean;
  inputStyle: React.CSSProperties;
  className?: string;
  textStyle?: React.CSSProperties;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  if (isEditing) {
    return (
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full px-3 py-2 rounded-md text-sm outline-none resize-y min-h-[80px] leading-6"
          style={inputStyle}
          autoFocus
          rows={4}
        />
        <div className="flex gap-2">
          <button onClick={() => onSave(draft)} className="p-1.5 rounded-md" style={{ color: "#4ade80" }}><Check size={14} /></button>
          <button onClick={onCancel} className="p-1.5 rounded-md" style={{ color: "var(--site-text-dim)" }}><X size={14} /></button>
        </div>
      </div>
    );
  }

  return (
    <p className={`group ${className || ""}`} style={textStyle}>
      <BubbleText text={value} />
      {canEdit && (
        <button onClick={onEdit} className="p-1 ml-1 rounded-md inline-flex opacity-0 group-hover:opacity-100 transition-opacity align-middle" style={{ color: "var(--site-text-dim)" }}><Pencil size={12} /></button>
      )}
    </p>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function SectionLabel({ children, live }: { children: React.ReactNode; live?: boolean }) {
  return (
    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: "var(--site-text-bright)" }}>
      {typeof children === "string" ? <BubbleText text={children} /> : children}
      {live && <span className="text-[var(--site-accent)] animate-pulse">●</span>}
    </h2>
  );
}
