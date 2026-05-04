"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { loadContent, saveContent } from "@/lib/content-api";
import Image from "next/image";
import { AdminBar } from "@/components/ui/admin-bar";
import { usePageAdmin } from "@/lib/use-page-admin";
import { THINGS as DEFAULT_THINGS, DEFAULT_SUBTITLE, DEFAULT_CATEGORIES, type ThingItem, type ThingStatus } from "@/lib/things-data";
import { Tabs } from "@/components/ui/vercel-tabs";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Trash2, Check, X, ImagePlus, Plus } from "lucide-react";

// ─── Storage ─────────────────────────────────────────────────────────────────

// storage keys for KV
const THINGS_KEY = "things";
const SUBTITLE_KV_KEY = "things-subtitle";
const CATEGORIES_KV_KEY = "things-categories";

const inputStyle: React.CSSProperties = {
  backgroundColor: "var(--site-bg)",
  color: "var(--site-text)",
  border: "1px solid var(--site-border)",
};

// ─── Status helpers ──────────────────────────────────────────────────────────

function statusNote(status: ThingStatus) {
  if (status === "wishlist") return "I do not own this item, so I can't talk about the performance.";
  return null;
}

function StatusBadge({ status }: { status: ThingStatus }) {
  const map: Record<ThingStatus, { label: string; color: string; bg: string; border: string }> = {
    own: { label: "Own", color: "#4ade80", bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.2)" },
    wishlist: { label: "Wishlist", color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.2)" },
    digital: { label: "Free", color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)" },
  };
  const s = map[status];
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[9px] font-medium"
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

// ─── Image Drop Zone ─────────────────────────────────────────────────────────

function ImageDropZone({ image, onImage }: { image?: string; onImage: (data: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") onImage(reader.result); };
    reader.readAsDataURL(file);
  };
  return (
    <div
      className="relative aspect-square rounded-md overflow-hidden cursor-pointer transition-colors"
      style={{ border: `2px dashed ${dragging ? "var(--site-accent)" : "var(--site-border)"}`, backgroundColor: dragging ? "rgba(255,107,96,0.05)" : "var(--site-bg)" }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="Preview" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
          <ImagePlus size={24} style={{ color: "var(--site-text-muted)" }} />
          <span className="text-[10px]" style={{ color: "var(--site-text-muted)" }}>Drop image or click</span>
        </div>
      )}
    </div>
  );
}

// ─── Edit Form ───────────────────────────────────────────────────────────────

function ItemEditForm({ item, categories, onSave, onCancel, onDelete }: {
  item: ThingItem; categories: string[]; onSave: (u: ThingItem) => void; onCancel: () => void; onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<ThingItem>({ ...item });
  const set = <K extends keyof ThingItem>(key: K, val: ThingItem[K]) => setDraft((d) => ({ ...d, [key]: val }));

  return (
    <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "var(--site-bg-card)", border: "1px solid var(--site-border)" }}>
      <ImageDropZone image={draft.image} onImage={(data) => set("image", data)} />
      <input value={draft.title} onChange={(e) => set("title", e.target.value)} className="w-full px-3 py-1.5 rounded-md text-sm outline-none" style={inputStyle} placeholder="Title" />
      <input value={draft.brand || ""} onChange={(e) => set("brand", e.target.value || undefined)} className="w-full px-3 py-1.5 rounded-md text-sm outline-none" style={inputStyle} placeholder="Brand (optional)" />
      <textarea value={draft.description} onChange={(e) => set("description", e.target.value)} className="w-full px-3 py-1.5 rounded-md text-sm outline-none resize-y min-h-[60px]" style={inputStyle} placeholder="Your note / description" rows={3} />
      <div className="flex gap-2">
        <input value={draft.price || ""} onChange={(e) => set("price", e.target.value || undefined)} className="flex-1 px-3 py-1.5 rounded-md text-sm outline-none" style={inputStyle} placeholder="Price (e.g. $45, Free)" />
        <input value={draft.url} onChange={(e) => set("url", e.target.value)} className="flex-1 px-3 py-1.5 rounded-md text-sm font-mono outline-none" style={inputStyle} placeholder="URL" />
      </div>
      <div className="flex gap-2">
        <select value={draft.category} onChange={(e) => set("category", e.target.value)} className="flex-1 px-3 py-1.5 rounded-md text-sm outline-none" style={inputStyle}>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={draft.status} onChange={(e) => set("status", e.target.value as ThingStatus)} className="flex-1 px-3 py-1.5 rounded-md text-sm outline-none" style={inputStyle}>
          <option value="own">Own</option>
          <option value="wishlist">Wishlist</option>
          <option value="digital">Digital (Free)</option>
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(draft)} className="p-1.5 rounded-md" style={{ color: "#4ade80" }}><Check size={14} /></button>
        <button onClick={onCancel} className="p-1.5 rounded-md" style={{ color: "var(--site-text-dim)" }}><X size={14} /></button>
        {onDelete && <button onClick={onDelete} className="p-1.5 rounded-md ml-auto" style={{ color: "var(--site-accent)" }}><Trash2 size={13} /></button>}
      </div>
    </div>
  );
}

// ─── Admin Settings Panel ────────────────────────────────────────────────────

function AdminSettings({ subtitle, onSubtitle, categories, onCategories }: {
  subtitle: string; onSubtitle: (s: string) => void; categories: string[]; onCategories: (c: string[]) => void;
}) {
  const [newCat, setNewCat] = useState("");

  const addCategory = () => {
    const trimmed = newCat.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    onCategories([...categories, trimmed]);
    setNewCat("");
  };

  return (
    <div className="rounded-lg p-5 space-y-4" style={{ backgroundColor: "var(--site-bg-card)", border: "1px solid var(--site-border)" }}>
      <div>
        <label className="text-[10px] font-medium mb-1.5 block" style={{ color: "var(--site-text-muted)" }}>Page Subtitle</label>
        <textarea
          value={subtitle}
          onChange={(e) => onSubtitle(e.target.value)}
          className="w-full px-3 py-2 rounded-md text-sm outline-none resize-y min-h-[50px]"
          style={inputStyle}
          rows={2}
        />
      </div>
      <div>
        <label className="text-[10px] font-medium mb-1.5 block" style={{ color: "var(--site-text-muted)" }}>Tab Categories</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs" style={{ backgroundColor: "var(--site-bg)", border: "1px solid var(--site-border)", color: "var(--site-text)" }}>
              {cat}
              <button onClick={() => onCategories(categories.filter((c) => c !== cat))} className="p-0.5 rounded" style={{ color: "var(--site-accent)" }}><X size={10} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            className="flex-1 px-3 py-1.5 rounded-md text-sm outline-none"
            style={inputStyle}
            placeholder="New category name"
          />
          <button onClick={addCategory} className="px-3 py-1.5 rounded-md text-xs font-medium" style={{ backgroundColor: "var(--site-accent)", color: "#fff" }}>
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Modal ────────────────────────────────────────────────────────────

function DetailModal({ item, onClose, isAdmin, onEdit, onDelete }: {
  item: ThingItem; onClose: () => void; isAdmin: boolean; onEdit: () => void; onDelete: () => void;
}) {
  const note = statusNote(item.status);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  const isBase64 = item.image?.startsWith("data:");

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div className="relative z-10 w-full max-w-4xl rounded-xl overflow-hidden flex flex-col md:flex-row" style={{ backgroundColor: "var(--site-bg-card)", border: "1px solid var(--site-border)" }} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}>
        <div className="md:w-1/2 aspect-square relative shrink-0 max-h-56 md:max-h-none" style={{ backgroundColor: "#111" }}>
          {item.image ? (
            isBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <Image src={item.image} alt={item.title} fill className="object-cover" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center"><span className="text-sm" style={{ color: "var(--site-text-muted)" }}>No image</span></div>
          )}
        </div>
        <div className="md:w-1/2 p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {item.brand && <p className="text-sm" style={{ color: "var(--site-text-muted)" }}>{item.brand}</p>}
              <StatusBadge status={item.status} />
            </div>
            <h2 className="text-xl font-semibold" style={{ color: "var(--site-text-bright)" }}>{item.title}</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--site-text-prose)" }}>{item.description}</p>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              {note && <p className="text-xs leading-relaxed" style={{ color: "var(--site-text-muted)" }}>{note}</p>}
              {isAdmin && (
                <div className="flex gap-2">
                  <button onClick={onEdit} className="p-1.5 rounded-md" style={{ color: "var(--site-text-dim)" }} title="Edit"><Pencil size={13} /></button>
                  <button onClick={onDelete} className="p-1.5 rounded-md" style={{ color: "var(--site-accent)" }} title="Delete"><Trash2 size={13} /></button>
                </div>
              )}
            </div>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors" style={{ backgroundColor: "var(--site-text-bright)", color: "var(--site-bg)" }}>
              View <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ThingsPage() {
  const [mounted, setMounted] = useState(false);
  const admin = usePageAdmin("things");
  const [items, setItems] = useState<ThingItem[]>(DEFAULT_THINGS);
  const [subtitle, setSubtitle] = useState(DEFAULT_SUBTITLE);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadContent<ThingItem[]>(THINGS_KEY).then((data) => {
      if (data) setItems(data);
    });
    loadContent<string>(SUBTITLE_KV_KEY).then((data) => {
      if (data) setSubtitle(data);
    });
    loadContent<string[]>(CATEGORIES_KV_KEY).then((data) => {
      if (data) setCategories(data);
    });
  }, []);

  const persist = useCallback((next: ThingItem[]) => {
    setItems(next);
    saveContent(THINGS_KEY, next);
  }, []);

  const saveSubtitle = (s: string) => {
    setSubtitle(s);
    saveContent(SUBTITLE_KV_KEY, s);
  };

  const saveCategories = (c: string[]) => {
    setCategories(c);
    saveContent(CATEGORIES_KV_KEY, c);
    if (activeTab !== "all" && !c.includes(activeTab)) setActiveTab("all");
  };

  const filtered = activeTab === "all"
    ? [...items].sort((a, b) => (b.addedAt || "").localeCompare(a.addedAt || ""))
    : items.filter((t) => t.category === activeTab);

  const realIndex = (filteredIdx: number) => items.indexOf(filtered[filteredIdx]);
  const closeModal = useCallback(() => setSelectedIndex(null), []);

  const handleAdd = () => { setShowAddForm(true); setEditingIndex(null); };

  const handleSaveNew = (item: ThingItem) => {
    const url = item.url && !item.url.startsWith("http") && item.url !== "#" ? `https://${item.url}` : item.url;
    persist([{ ...item, url: url || "#", addedAt: new Date().toISOString().slice(0, 10) }, ...items]);
    setShowAddForm(false);
  };

  const handleSaveEdit = (idx: number, updated: ThingItem) => {
    const url = updated.url && !updated.url.startsWith("http") && updated.url !== "#" ? `https://${updated.url}` : updated.url;
    const next = [...items];
    next[idx] = { ...updated, url: url || "#" };
    persist(next);
    setEditingIndex(null);
    setSelectedIndex(null);
  };

  const handleDelete = (idx: number) => {
    persist(items.filter((_, i) => i !== idx));
    setEditingIndex(null);
    setSelectedIndex(null);
  };

  if (!mounted) return null;

  const selectedRealIndex = selectedIndex !== null ? realIndex(selectedIndex) : null;
  const tabItems = [{ id: "all", label: "Recently Added" }, ...categories.map((c) => ({ id: c, label: c }))];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)" }}>
      {/* Header */}
      <div className="px-6 pt-20 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--site-text-bright)" }}>Things</h1>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--site-text-muted)" }}>{subtitle}</p>
          </div>
          <div className="flex items-center gap-1">
            {admin.isAdmin && (
              <button
                onClick={() => setShowSettings((s) => !s)}
                className="p-2 rounded-md transition-colors"
                style={{ color: showSettings ? "var(--site-accent)" : "var(--site-text-dim)" }}
                title="Page settings"
              >
                <Pencil size={14} />
              </button>
            )}
            <AdminBar {...admin} onAdd={handleAdd} />
          </div>
        </div>
      </div>

      {/* Admin Settings */}
      {admin.isAdmin && showSettings && (
        <div className="px-6 pb-4">
          <AdminSettings
            subtitle={subtitle}
            onSubtitle={saveSubtitle}
            categories={categories}
            onCategories={saveCategories}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 pb-6" style={{ borderBottom: "1px solid var(--site-border)" }}>
        <Tabs tabs={tabItems} activeTab={activeTab} onTabChange={(id) => setActiveTab(id)} />
      </div>

      {/* Add Form */}
      {showAddForm && admin.isAdmin && (
        <div className="px-6 py-6" style={{ maxWidth: 480 }}>
          <ItemEditForm
            item={{ title: "", brand: undefined, description: "", category: categories[0] || "Gadgets", status: "own", url: "#", price: undefined, image: undefined }}
            categories={categories}
            onSave={handleSaveNew}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Grid */}
      <div className="px-6 pt-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-[2px]">
          {filtered.map((item, filteredIdx) => {
            const idx = realIndex(filteredIdx);
            const isBase64 = item.image?.startsWith("data:");

            if (admin.isAdmin && editingIndex === idx) {
              return (
                <div key={idx} className="p-3">
                  <ItemEditForm
                    item={item}
                    categories={categories}
                    onSave={(updated) => handleSaveEdit(idx, updated)}
                    onCancel={() => setEditingIndex(null)}
                    onDelete={() => handleDelete(idx)}
                  />
                </div>
              );
            }

            return (
              <div key={idx} className="relative group">
                <button onClick={() => setSelectedIndex(filteredIdx)} className="w-full text-left transition-opacity duration-150 hover:opacity-90">
                  <div className="aspect-square relative" style={{ backgroundColor: "#111" }}>
                    {item.image ? (
                      isBase64 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[10px]" style={{ color: "var(--site-text-muted)" }}>{item.title}</span>
                      </div>
                    )}
                  </div>
                  <div className="px-1 pt-2 pb-4">
                    {item.brand && <p className="text-[10px] leading-tight" style={{ color: "var(--site-text-muted)" }}>{item.brand}</p>}
                    <p className="text-xs font-medium leading-tight mt-0.5" style={{ color: "var(--site-text-bright)" }}>{item.title}</p>
                  </div>
                </button>
                {admin.isAdmin && (
                  <button onClick={() => setEditingIndex(idx)} className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10" style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "var(--site-text-muted)" }} title="Edit">
                    <Pencil size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm" style={{ color: "var(--site-text-muted)" }}>Nothing here yet.</p>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRealIndex !== null && selectedIndex !== null && !editingIndex && (
          <DetailModal
            item={items[selectedRealIndex]}
            onClose={closeModal}
            isAdmin={admin.isAdmin}
            onEdit={() => { setEditingIndex(selectedRealIndex); setSelectedIndex(null); }}
            onDelete={() => handleDelete(selectedRealIndex)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
