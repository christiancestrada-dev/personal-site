"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { AdminBar } from "@/components/ui/admin-bar";
import { usePageAdmin } from "@/lib/use-page-admin";
import { Pencil, Trash2, Plus } from "lucide-react";

interface NowItem {
  text: string;
}

const DEFAULT_ITEMS: NowItem[] = [
  { text: "Currently on break — enjoying good food and time with family." },
  { text: "I was recently selected as an MLK Scholar, which supports a year-long independent research project through my school. My work investigates sleep health disparities — specifically, how race shapes sleep outcomes and how poor sleep in turn reinforces racial health inequities, with a focus on shift workers." },
];

export default function NowPage() {
  const admin = usePageAdmin("now");
  const [items, setItems] = useState<NowItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState("March 2026");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newText, setNewText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("site-now");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setItems(parsed.items || []);
        if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
      } catch {}
    } else {
      setItems(DEFAULT_ITEMS);
    }
  }, []);

  const save = (updated: NowItem[], date?: string) => {
    const d = date || lastUpdated;
    setItems(updated);
    setLastUpdated(d);
    localStorage.setItem("site-now", JSON.stringify({ items: updated, lastUpdated: d }));
  };

  const addItem = () => {
    if (!newText.trim()) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    save([...items, { text: newText.trim() }], dateStr);
    setNewText("");
    setShowAddForm(false);
  };

  const removeItem = (i: number) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    save(items.filter((_, idx) => idx !== i), dateStr);
  };

  const startEdit = (i: number) => {
    setEditingIndex(i);
    setEditText(items[i].text);
  };

  const saveEdit = () => {
    if (editingIndex === null || !editText.trim()) return;
    const updated = [...items];
    updated[editingIndex] = { text: editText.trim() };
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    save(updated, dateStr);
    setEditingIndex(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)" }}>
      <main className="mx-auto max-w-xl px-6 py-24 space-y-12">
        <div className="flex items-start justify-between">
          <PageHeader title="Now" subtitle="What I'm up to this week" />
          <AdminBar {...admin} onAdd={() => setShowAddForm(true)} />
        </div>

        {/* Add form */}
        {showAddForm && admin.isAdmin && (
          <div className="rounded-lg p-5 space-y-3" style={{ backgroundColor: "var(--site-bg-card-alpha)", border: "1px solid var(--site-border)" }}>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="What are you up to?"
              rows={3}
              className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
              style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)", border: "1px solid var(--site-border)" }}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={addItem} className="px-4 py-2 rounded-md text-xs font-medium" style={{ backgroundColor: "var(--site-accent)", color: "#fff" }}>Add</button>
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-md text-xs font-medium" style={{ color: "var(--site-text-secondary)", border: "1px solid var(--site-border)" }}>Cancel</button>
            </div>
          </div>
        )}

        <ul className="space-y-4">
          {items.map((item, i) => {
            if (editingIndex === i && admin.isAdmin) {
              return (
                <li key={i} className="rounded-lg p-4 space-y-2" style={{ backgroundColor: "var(--site-bg-card-alpha)", border: "1px solid var(--site-border)" }}>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
                    style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)", border: "1px solid var(--site-border)" }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="px-4 py-2 rounded-md text-xs font-medium" style={{ backgroundColor: "var(--site-accent)", color: "#fff" }}>Save</button>
                    <button onClick={() => setEditingIndex(null)} className="px-4 py-2 rounded-md text-xs font-medium" style={{ color: "var(--site-text-secondary)", border: "1px solid var(--site-border)" }}>Cancel</button>
                  </div>
                </li>
              );
            }
            return (
              <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--site-text-prose)" }}>
                <span style={{ color: "var(--site-accent)" }}>·</span>
                <span className="flex-1">{item.text}</span>
                {admin.isAdmin && (
                  <div className="flex items-start gap-1 shrink-0">
                    <button onClick={() => startEdit(i)} className="p-1 rounded-md transition-colors" style={{ color: "var(--site-text-dim)" }} title="Edit"><Pencil size={12} /></button>
                    <button onClick={() => removeItem(i)} className="p-1 rounded-md transition-colors" style={{ color: "var(--site-text-dim)" }} title="Remove"><Trash2 size={12} /></button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {items.length === 0 && (
          <p className="py-12 text-center text-sm" style={{ color: "var(--site-text-muted)" }}>
            {admin.isAdmin ? "Click + to add an update" : "Coming soon"}
          </p>
        )}

        <p className="text-[10px] font-mono" style={{ color: "var(--site-text-dim)" }}>
          Last updated: {lastUpdated}
        </p>
      </main>
    </div>
  );
}
