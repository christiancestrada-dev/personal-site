"use client";

import { useState, useEffect, useRef } from "react";
import { loadContent, saveContent } from "@/lib/content-api";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/vercel-tabs";
import { Plus, X, Lock, Unlock, ExternalLink, Trash2, Pencil } from "lucide-react";

interface LinkItem {
  title: string;
  url: string;
  author?: string;
  note?: string;
  tag?: string;
  date: string;
}

const ADMIN_PASSWORD = "linkspls";

const DEFAULT_LINKS: LinkItem[] = [
  {
    title: "The Ones Who Walk Away from Omelas",
    url: "https://shsdavisapes.pbworks.com/w/file/fetch/73817925/Omelas.pdf",
    author: "Ursula K. Le Guin",
    note: "Le Guin's \"The Ones Who Walk Away from Omelas\" presents a child who has been kicked, abandoned, and imprisoned by humans. While recklessly neglected and intentionally brutalized by the people of Omelas, the author includes that \"[The child] is afraid of the mops. [The child] finds them horrible.\" It is afraid of two mere inanimate mops in the corner of the room.\n\nThe child is afraid of the mops because they are useless. Mops are cleaning tools: designed to remove dirt and restore, yet they stand uselessly in the corner of the same room where the child sits in \"damp…cellar dirt\". They are not frightening because they hurt the child, but because they could clean but do not. The mops are, in this reading, a figure for the people of Omelas themselves, who: \"would like to do something for the child,\" but never do. They, like the mops, neglect their duty.\n\nWhat makes the child's situation so unbearable is not only the suffering itself, but that its suffering could be immediately remediated, yet nothing happens. Le Guin presents the sin of omission and neglect. Just as the child is fearful of these self-defeating mops, readers should be fearful of the self-defeating people of Omelas. The people of Omelas have a moral duty to protect the innocent, as they possess the knowledge and power to prevent the child's agony. Despite not doing any direct harmful action, by choosing to live their lives while the child suffers, they become as useless as a mop that will not clean, and just as frightening.",
    tag: "literature",
    date: "2026-03-18",
  },
  {
    title: "Lift Not the Painted Veil",
    url: "https://www.poetryfoundation.org/poems/45134/lift-not-the-painted-veil-which-those-who-live",
    author: "Percy Bysshe Shelley",
    note: "A sonnet about the futility of seeking truth behind appearances — and the loneliness of those who try.",
    tag: "poetry",
    date: "2026-03-16",
  },
  {
    title: "Bullet in the Brain",
    url: "https://www.newyorker.com/magazine/1995/09/25/bullet-in-the-brain",
    author: "Tobias Wolff",
    note: "A man's entire life distilled into the fraction of a second. One of the great American short stories.",
    tag: "literature",
    date: "2026-03-14",
  },
  {
    title: "Do Not Go Gentle into That Good Night",
    url: "https://www.youtube.com/watch?v=1mRec3VbH3w",
    author: "Dylan Thomas",
    note: "One of the most powerful villanelles ever written. A son's plea to his dying father to resist death with everything he has.",
    tag: "poetry",
    date: "2026-03-12",
  },
  {
    title: "How Does Your Memory Work?",
    url: "https://www.youtube.com/watch?v=TUoJc0NPajQ",
    author: "Ted-Ed",
    note: "An accessible look at how memories are formed, stored, and retrieved — and why sleep is essential to the process.",
    tag: "neuroscience",
    date: "2026-03-10",
  },
  {
    title: "The Art of Stillness",
    url: "https://www.youtube.com/watch?v=aUBawr1hUwo",
    author: "Pico Iyer · TED",
    note: "A beautiful meditation on the value of doing nothing — and how stillness is where we find clarity.",
    tag: "philosophy",
    date: "2026-03-08",
  },
];

export default function LinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [newLink, setNewLink] = useState({ title: "", url: "", author: "", note: "", tag: "" });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editLink, setEditLink] = useState({ title: "", url: "", author: "", note: "", tag: "" });
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadContent<LinkItem[]>("links").then((saved) => {
        if (saved && saved.length > 0) {
          setLinks(saved);
        } else {
          setLinks(DEFAULT_LINKS);
        }
      });
      const admin = localStorage.getItem("site-admin-links");
      if (admin === "true") setIsAdmin(true);
    }
  }, []);

  const saveLinks = (updated: LinkItem[]) => {
    setLinks(updated);
    saveContent("links", updated);
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      localStorage.setItem("site-admin-links", "true");
      setShowPasswordPrompt(false);
      setPassword("");
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem("site-admin-links");
  };

  const addLink = () => {
    if (!newLink.title || !newLink.url) return;
    const item: LinkItem = {
      title: newLink.title,
      url: newLink.url.startsWith("http") ? newLink.url : `https://${newLink.url}`,
      author: newLink.author || undefined,
      note: newLink.note || undefined,
      tag: newLink.tag || undefined,
      date: new Date().toISOString().slice(0, 10),
    };
    saveLinks([item, ...links]);
    setNewLink({ title: "", url: "", author: "", note: "", tag: "" });
    setShowAddForm(false);
  };

  const removeLink = (index: number) => {
    saveLinks(links.filter((_, i) => i !== index));
  };

  const startEdit = (index: number) => {
    const link = links[index];
    setEditingIndex(index);
    setEditLink({
      title: link.title,
      url: link.url,
      author: link.author || "",
      note: link.note || "",
      tag: link.tag || "",
    });
  };

  const saveEdit = () => {
    if (editingIndex === null || !editLink.title || !editLink.url) return;
    const updated = [...links];
    updated[editingIndex] = {
      ...updated[editingIndex],
      title: editLink.title,
      url: editLink.url.startsWith("http") ? editLink.url : `https://${editLink.url}`,
      author: editLink.author || undefined,
      note: editLink.note || undefined,
      tag: editLink.tag || undefined,
    };
    saveLinks(updated);
    setEditingIndex(null);
  };

  const allTags = Array.from(new Set(links.map((l) => l.tag).filter(Boolean))) as string[];
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const filtered = activeTag ? links.filter((l) => l.tag === activeTag) : links;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)" }}>
      <main className="mx-auto max-w-xl px-6 py-24 space-y-8">
        <div className="flex items-start justify-between">
          <PageHeader title="Links" subtitle="Things I've found interesting" />
          {!isAdmin ? (
            <button
              onClick={() => setShowPasswordPrompt(true)}
              className="mt-2 p-2 rounded-md transition-colors"
              style={{ color: "var(--site-text-dim)" }}
              title="Admin login"
            >
              <Lock size={14} />
            </button>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="p-2 rounded-md transition-colors"
                style={{ color: "var(--site-accent)" }}
                title="Add link"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md transition-colors"
                style={{ color: "var(--site-text-dim)" }}
                title="Logout"
              >
                <Unlock size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Password prompt */}
        {showPasswordPrompt && (
          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: "var(--site-bg-card-alpha)", border: "1px solid var(--site-border)" }}
          >
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Password"
                className="flex-1 px-3 py-2 rounded-md text-sm font-mono outline-none"
                style={{
                  backgroundColor: "var(--site-bg)",
                  color: "var(--site-text)",
                  border: `1px solid ${passwordError ? "var(--site-accent)" : "var(--site-border)"}`,
                }}
                autoFocus
              />
              <button
                onClick={handleLogin}
                className="px-3 py-2 rounded-md text-xs font-medium"
                style={{ backgroundColor: "var(--site-accent)", color: "#fff" }}
              >
                Login
              </button>
              <button
                onClick={() => { setShowPasswordPrompt(false); setPassword(""); setPasswordError(false); }}
                className="p-2 rounded-md"
                style={{ color: "var(--site-text-dim)" }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Add form */}
        {showAddForm && isAdmin && (
          <div
            className="rounded-lg p-5 space-y-3"
            style={{ backgroundColor: "var(--site-bg-card-alpha)", border: "1px solid var(--site-border)" }}
          >
            <input
              type="text"
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              placeholder="Title"
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)", border: "1px solid var(--site-border)" }}
              autoFocus
            />
            <input
              type="text"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="URL"
              className="w-full px-3 py-2 rounded-md text-sm font-mono outline-none"
              style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)", border: "1px solid var(--site-border)" }}
            />
            <input
              type="text"
              value={newLink.author}
              onChange={(e) => setNewLink({ ...newLink, author: e.target.value })}
              placeholder="Author (optional)"
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)", border: "1px solid var(--site-border)" }}
            />
            <textarea
              value={newLink.note}
              onChange={(e) => setNewLink({ ...newLink, note: e.target.value })}
              placeholder="Notes / annotation (optional)"
              rows={2}
              className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
              style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)", border: "1px solid var(--site-border)" }}
            />
            <input
              type="text"
              value={newLink.tag}
              onChange={(e) => setNewLink({ ...newLink, tag: e.target.value })}
              placeholder="Tag (optional)"
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)", border: "1px solid var(--site-border)" }}
            />
            <div className="flex gap-2">
              <button
                onClick={addLink}
                className="px-4 py-2 rounded-md text-xs font-medium"
                style={{ backgroundColor: "var(--site-accent)", color: "#fff" }}
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-md text-xs font-medium"
                style={{ color: "var(--site-text-secondary)", border: "1px solid var(--site-border)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div style={{ borderBottom: "1px solid var(--site-border)" }} className="pb-4">
            <Tabs
              tabs={[{ id: "__all__", label: "All" }, ...allTags.map((tag) => ({ id: tag, label: tag }))]}
              activeTab={activeTag || "__all__"}
              onTabChange={(id) => setActiveTag(id === "__all__" ? null : id)}
            />
          </div>
        )}

        {/* Links list */}
        <div className="space-y-0">
          {filtered.map((link, i) => {
            const realIndex = links.indexOf(link);
            const isEditing = editingIndex === realIndex;

            if (isEditing && isAdmin) {
              return (
                <div
                  key={i}
                  className="py-3 rounded-lg p-4 space-y-2"
                  style={{ backgroundColor: "var(--site-bg-card-alpha)", border: "1px solid var(--site-border)" }}
                >
                  <input
                    type="text"
                    value={editLink.title}
                    onChange={(e) => setEditLink({ ...editLink, title: e.target.value })}
                    placeholder="Title"
                    className="w-full px-3 py-2 rounded-md text-sm outline-none"
                    style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)", border: "1px solid var(--site-border)" }}
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editLink.url}
                    onChange={(e) => setEditLink({ ...editLink, url: e.target.value })}
                    placeholder="URL"
                    className="w-full px-3 py-2 rounded-md text-sm font-mono outline-none"
                    style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)", border: "1px solid var(--site-border)" }}
                  />
                  <input
                    type="text"
                    value={editLink.author}
                    onChange={(e) => setEditLink({ ...editLink, author: e.target.value })}
                    placeholder="Author (optional)"
                    className="w-full px-3 py-2 rounded-md text-sm outline-none"
                    style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)", border: "1px solid var(--site-border)" }}
                  />
                  <textarea
                    value={editLink.note}
                    onChange={(e) => setEditLink({ ...editLink, note: e.target.value })}
                    placeholder="Notes / annotation (optional)"
                    rows={2}
                    className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
                    style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)", border: "1px solid var(--site-border)" }}
                  />
                  <input
                    type="text"
                    value={editLink.tag}
                    onChange={(e) => setEditLink({ ...editLink, tag: e.target.value })}
                    placeholder="Tag (optional)"
                    className="w-full px-3 py-2 rounded-md text-sm outline-none"
                    style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)", border: "1px solid var(--site-border)" }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="px-4 py-2 rounded-md text-xs font-medium"
                      style={{ backgroundColor: "var(--site-accent)", color: "#fff" }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="px-4 py-2 rounded-md text-xs font-medium"
                      style={{ color: "var(--site-text-secondary)", border: "1px solid var(--site-border)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={i}
                className="py-3 flex items-start justify-between gap-3"
                style={{ borderBottom: "1px solid var(--site-border-subtle)" }}
              >
                <div className="flex-1 min-w-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-sm hover:underline flex items-center gap-1.5"
                    style={{ color: "var(--site-text-bright)" }}
                  >
                    {link.title}
                    <ExternalLink size={11} style={{ color: "var(--site-text-dim)", flexShrink: 0 }} />
                  </a>
                  {link.author && (
                    <span className="text-xs mt-0.5 block" style={{ color: "var(--site-text-secondary)" }}>
                      {link.author}
                    </span>
                  )}
                  {link.note && (
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--site-text-prose)" }}>
                      {link.note}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px]" style={{ color: "var(--site-text-dim)" }}>
                      {link.date}
                    </span>
                    {link.tag && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px]"
                        style={{ backgroundColor: "var(--site-bg-card)", color: "var(--site-text-muted)" }}
                      >
                        {link.tag}
                      </span>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <button
                      onClick={() => startEdit(realIndex)}
                      className="p-1.5 rounded-md transition-colors"
                      style={{ color: "var(--site-text-dim)" }}
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => removeLink(realIndex)}
                      className="p-1.5 rounded-md transition-colors"
                      style={{ color: "var(--site-text-dim)" }}
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {links.length === 0 && (
            <p className="py-12 text-center text-sm" style={{ color: "var(--site-text-muted)" }}>
              {isAdmin ? "Click + to add your first link" : "Coming soon"}
            </p>
          )}

          {links.length > 0 && filtered.length === 0 && (
            <p className="py-8 text-center text-sm" style={{ color: "var(--site-text-muted)" }}>
              No links match this tag
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
