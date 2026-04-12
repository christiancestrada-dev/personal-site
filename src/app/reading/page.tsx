"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { loadContent, saveContent } from "@/lib/content-api";
import { PageHeader } from "@/components/ui/page-header";
import { AdminBar } from "@/components/ui/admin-bar";
import { usePageAdmin } from "@/lib/use-page-admin";
import { Tabs } from "@/components/ui/vercel-tabs";
import { READING_LIST, type ReadingItem } from "@/lib/reading-data";
import { Bookshelf, BookDetail, ViewToggle, type ViewMode } from "@/components/bookshelf";
import { Pencil, Trash2 } from "lucide-react";

const STATUS_COLORS: Record<ReadingItem["status"], string> = {
  read: "#4ade80",
  reading: "#fbbf24",
  queued: "#525252",
};

export default function ReadingPage() {
  const admin = usePageAdmin("reading");
  const [extraItems, setExtraItems] = useState<ReadingItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", author: "", category: "books", tags: "", url: "", status: "queued" as ReadingItem["status"] });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editItem, setEditItem] = useState({ title: "", author: "", category: "books", tags: "", url: "", status: "queued" as ReadingItem["status"] });
  const [view, setView] = useState<ViewMode>("shelf");
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadContent<ReadingItem[]>("reading-extra").then((data) => {
        if (data) setExtraItems(data);
      });
      const savedView = localStorage.getItem("reading-view") as ViewMode | null;
      if (savedView === "list" || savedView === "shelf") setView(savedView);
    }
  }, []);

  const handleViewChange = useCallback((v: ViewMode) => {
    setView(v);
    localStorage.setItem("reading-view", v);
    setSelectedBook(null);
  }, []);

  const saveExtra = (updated: ReadingItem[]) => {
    setExtraItems(updated);
    saveContent("reading-extra", updated);
  };

  // Combined list: extra (user-added) first, then hardcoded
  const allItems = [...extraItems, ...READING_LIST];

  const [activeCategory, setActiveCategory] = useState("all");

  const CATEGORIES = ["all", ...Array.from(new Set(allItems.map((item) => item.category)))];

  const filtered = allItems.filter((item) => {
    if (activeCategory !== "all" && item.category !== activeCategory) return false;
    return true;
  });

  const addReading = () => {
    if (!newItem.title || !newItem.author) return;
    const item: ReadingItem = {
      title: newItem.title,
      author: newItem.author,
      category: newItem.category,
      tags: newItem.tags.split(",").map((t) => t.trim()).filter(Boolean),
      url: newItem.url || undefined,
      status: newItem.status,
    };
    saveExtra([item, ...extraItems]);
    setNewItem({ title: "", author: "", category: "books", tags: "", url: "", status: "queued" });
    setShowAddForm(false);
  };

  const removeExtra = (i: number) => saveExtra(extraItems.filter((_, idx) => idx !== i));

  const startEdit = (i: number) => {
    const item = extraItems[i];
    setEditingIndex(i);
    setEditItem({ title: item.title, author: item.author, category: item.category, tags: item.tags.join(", "), url: item.url || "", status: item.status });
  };

  const saveEdit = () => {
    if (editingIndex === null || !editItem.title) return;
    const updated = [...extraItems];
    updated[editingIndex] = {
      ...updated[editingIndex],
      title: editItem.title,
      author: editItem.author,
      category: editItem.category,
      tags: editItem.tags.split(",").map((t) => t.trim()).filter(Boolean),
      url: editItem.url || undefined,
      status: editItem.status,
    };
    saveExtra(updated);
    setEditingIndex(null);
  };

  const inputStyle = {
    backgroundColor: "var(--site-bg)",
    color: "var(--site-text)",
    border: "1px solid var(--site-border)",
  };

  const handleCloseDetail = useCallback(() => setSelectedBook(null), []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)" }}>
      <main className={`mx-auto ${view === "shelf" ? "max-w-full" : "max-w-xl"} px-6 py-24 space-y-8 transition-all duration-300`}>
        <div className="flex items-start justify-between">
          <PageHeader title="Reading List" subtitle="Books, papers, and articles that have shaped my thinking" />
          <div className="flex items-center gap-2 mt-1">
            <ViewToggle view={view} onChange={handleViewChange} />
            <AdminBar {...admin} onAdd={() => setShowAddForm(true)} />
          </div>
        </div>

        {/* Add form */}
        {showAddForm && admin.isAdmin && (
          <div className="rounded-lg p-5 space-y-3" style={{ backgroundColor: "var(--site-bg-card-alpha)", border: "1px solid var(--site-border)" }}>
            <input type="text" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} placeholder="Title" className="w-full px-3 py-2 rounded-md text-sm outline-none" style={inputStyle} autoFocus />
            <input type="text" value={newItem.author} onChange={(e) => setNewItem({ ...newItem, author: e.target.value })} placeholder="Author" className="w-full px-3 py-2 rounded-md text-sm outline-none" style={inputStyle} />
            <input type="text" value={newItem.url} onChange={(e) => setNewItem({ ...newItem, url: e.target.value })} placeholder="URL (optional)" className="w-full px-3 py-2 rounded-md text-sm font-mono outline-none" style={inputStyle} />
            <div className="flex gap-2">
              <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="px-3 py-2 rounded-md text-sm outline-none" style={inputStyle}>
                <option value="books">Books</option>
                <option value="papers">Papers</option>
                <option value="videos">Videos</option>
                <option value="websites">Websites</option>
              </select>
              <select value={newItem.status} onChange={(e) => setNewItem({ ...newItem, status: e.target.value as ReadingItem["status"] })} className="px-3 py-2 rounded-md text-sm outline-none" style={inputStyle}>
                <option value="queued">Queued</option>
                <option value="reading">Reading</option>
                <option value="read">Read</option>
              </select>
            </div>
            <input type="text" value={newItem.tags} onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })} placeholder="Tags (comma separated)" className="w-full px-3 py-2 rounded-md text-sm outline-none" style={inputStyle} />
            <div className="flex gap-2">
              <button onClick={addReading} className="px-4 py-2 rounded-md text-xs font-medium" style={{ backgroundColor: "var(--site-accent)", color: "#fff" }}>Add</button>
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-md text-xs font-medium" style={{ color: "var(--site-text-secondary)", border: "1px solid var(--site-border)" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Category filters */}
        <div style={{ borderBottom: "1px solid var(--site-border)" }} className="pb-4">
          <Tabs
            tabs={CATEGORIES.map((cat) => ({ id: cat, label: cat }))}
            activeTab={activeCategory}
            onTabChange={(id) => { setActiveCategory(id); setSelectedBook(null); }}
          />
        </div>

        {/* Bookshelf view */}
        {view === "shelf" ? (
          <Bookshelf
            items={filtered}
            selectedIndex={selectedBook}
            onSelect={setSelectedBook}
          />
        ) : (
          /* List view */
          <div className="space-y-0">
            {filtered.map((item, i) => {
              const extraIdx = extraItems.indexOf(item);
              const isEditable = extraIdx !== -1;
              const isEditing = isEditable && editingIndex === extraIdx;

              if (isEditing && admin.isAdmin) {
                return (
                  <div key={i} className="py-3 rounded-lg p-4 space-y-2" style={{ backgroundColor: "var(--site-bg-card-alpha)", border: "1px solid var(--site-border)" }}>
                    <input type="text" value={editItem.title} onChange={(e) => setEditItem({ ...editItem, title: e.target.value })} placeholder="Title" className="w-full px-3 py-2 rounded-md text-sm outline-none" style={inputStyle} autoFocus />
                    <input type="text" value={editItem.author} onChange={(e) => setEditItem({ ...editItem, author: e.target.value })} placeholder="Author" className="w-full px-3 py-2 rounded-md text-sm outline-none" style={inputStyle} />
                    <input type="text" value={editItem.url} onChange={(e) => setEditItem({ ...editItem, url: e.target.value })} placeholder="URL (optional)" className="w-full px-3 py-2 rounded-md text-sm font-mono outline-none" style={inputStyle} />
                    <div className="flex gap-2">
                      <select value={editItem.category} onChange={(e) => setEditItem({ ...editItem, category: e.target.value })} className="px-3 py-2 rounded-md text-sm outline-none" style={inputStyle}>
                        <option value="books">Books</option>
                        <option value="papers">Papers</option>
                        <option value="videos">Videos</option>
                        <option value="websites">Websites</option>
                      </select>
                      <select value={editItem.status} onChange={(e) => setEditItem({ ...editItem, status: e.target.value as ReadingItem["status"] })} className="px-3 py-2 rounded-md text-sm outline-none" style={inputStyle}>
                        <option value="queued">Queued</option>
                        <option value="reading">Reading</option>
                        <option value="read">Read</option>
                      </select>
                    </div>
                    <input type="text" value={editItem.tags} onChange={(e) => setEditItem({ ...editItem, tags: e.target.value })} placeholder="Tags (comma separated)" className="w-full px-3 py-2 rounded-md text-sm outline-none" style={inputStyle} />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="px-4 py-2 rounded-md text-xs font-medium" style={{ backgroundColor: "var(--site-accent)", color: "#fff" }}>Save</button>
                      <button onClick={() => setEditingIndex(null)} className="px-4 py-2 rounded-md text-xs font-medium" style={{ color: "var(--site-text-secondary)", border: "1px solid var(--site-border)" }}>Cancel</button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={i} className="py-4 flex gap-4" style={{ borderBottom: "1px solid var(--site-border-subtle)" }}>
                  <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.status] }} title={item.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-bold text-sm hover:underline" style={{ color: "var(--site-text-bright)" }}>{item.title}</a>
                      ) : (
                        <span className="font-bold text-sm" style={{ color: "var(--site-text-bright)" }}>{item.title}</span>
                      )}
                      <span className="text-xs" style={{ color: "var(--site-text-secondary)" }}>{item.author}</span>
                    </div>
                    {item.progress && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--site-bg-card)", maxWidth: 120 }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${(item.progress.current / item.progress.total) * 100}%`, backgroundColor: "#fbbf24" }} />
                        </div>
                        <span className="text-[10px] tabular-nums" style={{ color: "var(--site-text-secondary)" }}>pg {item.progress.current}/{item.progress.total}</span>
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: "var(--site-bg-card)", color: "var(--site-text-muted)" }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  {admin.isAdmin && isEditable && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <button onClick={() => startEdit(extraIdx)} className="p-1.5 rounded-md transition-colors" style={{ color: "var(--site-text-dim)" }} title="Edit"><Pencil size={13} /></button>
                      <button onClick={() => removeExtra(extraIdx)} className="p-1.5 rounded-md transition-colors" style={{ color: "var(--site-text-dim)" }} title="Remove"><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm" style={{ color: "var(--site-text-muted)" }}>No items match your filters</p>
            )}
          </div>
        )}
      </main>

      {/* Book detail modal */}
      <BookDetail
        item={selectedBook !== null ? filtered[selectedBook] ?? null : null}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
