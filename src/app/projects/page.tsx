"use client";

import { useState, useEffect, useRef } from "react";
import { loadContent, saveContent } from "@/lib/content-api";
import { PageHeader } from "@/components/ui/page-header";
import { AdminBar } from "@/components/ui/admin-bar";
import { usePageAdmin } from "@/lib/use-page-admin";
import { Pencil, Trash2, ExternalLink } from "lucide-react";

interface ProjectItem {
  title: string;
  description: string;
  url?: string;
  tag?: string;
  date: string;
}

export default function ProjectsPage() {
  const admin = usePageAdmin("projects");
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", description: "", url: "", tag: "" });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editItem, setEditItem] = useState({ title: "", description: "", url: "", tag: "" });
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadContent<ProjectItem[]>("projects").then((data) => {
        if (data) setProjects(data);
      });
    }
  }, []);

  const save = (updated: ProjectItem[]) => {
    setProjects(updated);
    saveContent("projects", updated);
  };

  const addProject = () => {
    if (!newItem.title) return;
    const item: ProjectItem = {
      title: newItem.title,
      description: newItem.description,
      url: newItem.url ? (newItem.url.startsWith("http") ? newItem.url : `https://${newItem.url}`) : undefined,
      tag: newItem.tag || undefined,
      date: new Date().toISOString().slice(0, 10),
    };
    save([item, ...projects]);
    setNewItem({ title: "", description: "", url: "", tag: "" });
    setShowAddForm(false);
  };

  const remove = (i: number) => save(projects.filter((_, idx) => idx !== i));

  const startEdit = (i: number) => {
    const p = projects[i];
    setEditingIndex(i);
    setEditItem({ title: p.title, description: p.description, url: p.url || "", tag: p.tag || "" });
  };

  const saveEdit = () => {
    if (editingIndex === null || !editItem.title) return;
    const updated = [...projects];
    updated[editingIndex] = {
      ...updated[editingIndex],
      title: editItem.title,
      description: editItem.description,
      url: editItem.url ? (editItem.url.startsWith("http") ? editItem.url : `https://${editItem.url}`) : undefined,
      tag: editItem.tag || undefined,
    };
    save(updated);
    setEditingIndex(null);
  };

  const inputStyle = {
    backgroundColor: "var(--site-bg)",
    color: "var(--site-text)",
    border: "1px solid var(--site-border)",
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)" }}>
      <main className="mx-auto max-w-xl px-6 py-24 space-y-8">
        <div className="flex items-start justify-between">
          <PageHeader title="Projects" subtitle="A collection of things I've built" />
          <AdminBar {...admin} onAdd={() => setShowAddForm(true)} />
        </div>

        {admin.showPrompt && (
          <AdminBar {...admin} onAdd={() => setShowAddForm(true)} />
        )}

        {/* Add form */}
        {showAddForm && admin.isAdmin && (
          <div className="rounded-lg p-5 space-y-3" style={{ backgroundColor: "var(--site-bg-card-alpha)", border: "1px solid var(--site-border)" }}>
            <input type="text" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} placeholder="Title" className="w-full px-3 py-2 rounded-md text-sm outline-none" style={inputStyle} autoFocus />
            <textarea value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Description" rows={2} className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none" style={inputStyle} />
            <input type="text" value={newItem.url} onChange={(e) => setNewItem({ ...newItem, url: e.target.value })} placeholder="URL (optional)" className="w-full px-3 py-2 rounded-md text-sm font-mono outline-none" style={inputStyle} />
            <input type="text" value={newItem.tag} onChange={(e) => setNewItem({ ...newItem, tag: e.target.value })} placeholder="Tag (optional)" className="w-full px-3 py-2 rounded-md text-sm outline-none" style={inputStyle} />
            <div className="flex gap-2">
              <button onClick={addProject} className="px-4 py-2 rounded-md text-xs font-medium" style={{ backgroundColor: "var(--site-accent)", color: "#fff" }}>Add</button>
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-md text-xs font-medium" style={{ color: "var(--site-text-secondary)", border: "1px solid var(--site-border)" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Project list */}
        <div className="space-y-0">
          {projects.map((project, i) => {
            if (editingIndex === i && admin.isAdmin) {
              return (
                <div key={i} className="py-3 rounded-lg p-4 space-y-2" style={{ backgroundColor: "var(--site-bg-card-alpha)", border: "1px solid var(--site-border)" }}>
                  <input type="text" value={editItem.title} onChange={(e) => setEditItem({ ...editItem, title: e.target.value })} placeholder="Title" className="w-full px-3 py-2 rounded-md text-sm outline-none" style={inputStyle} autoFocus />
                  <textarea value={editItem.description} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} placeholder="Description" rows={2} className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none" style={inputStyle} />
                  <input type="text" value={editItem.url} onChange={(e) => setEditItem({ ...editItem, url: e.target.value })} placeholder="URL (optional)" className="w-full px-3 py-2 rounded-md text-sm font-mono outline-none" style={inputStyle} />
                  <input type="text" value={editItem.tag} onChange={(e) => setEditItem({ ...editItem, tag: e.target.value })} placeholder="Tag (optional)" className="w-full px-3 py-2 rounded-md text-sm outline-none" style={inputStyle} />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="px-4 py-2 rounded-md text-xs font-medium" style={{ backgroundColor: "var(--site-accent)", color: "#fff" }}>Save</button>
                    <button onClick={() => setEditingIndex(null)} className="px-4 py-2 rounded-md text-xs font-medium" style={{ color: "var(--site-text-secondary)", border: "1px solid var(--site-border)" }}>Cancel</button>
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className="py-4 flex items-start justify-between gap-3" style={{ borderBottom: "1px solid var(--site-border-subtle)" }}>
                <div className="flex-1 min-w-0">
                  {project.url ? (
                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="font-bold text-sm hover:underline flex items-center gap-1.5" style={{ color: "var(--site-text-bright)" }}>
                      {project.title}
                      <ExternalLink size={11} style={{ color: "var(--site-text-dim)", flexShrink: 0 }} />
                    </a>
                  ) : (
                    <span className="font-bold text-sm" style={{ color: "var(--site-text-bright)" }}>{project.title}</span>
                  )}
                  {project.description && (
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--site-text-prose)" }}>{project.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono" style={{ color: "var(--site-text-dim)" }}>{project.date}</span>
                    {project.tag && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ backgroundColor: "var(--site-bg-card)", color: "var(--site-text-muted)" }}>{project.tag}</span>
                    )}
                  </div>
                </div>
                {admin.isAdmin && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <button onClick={() => startEdit(i)} className="p-1.5 rounded-md transition-colors" style={{ color: "var(--site-text-dim)" }} title="Edit"><Pencil size={13} /></button>
                    <button onClick={() => remove(i)} className="p-1.5 rounded-md transition-colors" style={{ color: "var(--site-text-dim)" }} title="Remove"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            );
          })}

          {projects.length === 0 && (
            <p className="py-12 text-center text-sm" style={{ color: "var(--site-text-muted)" }}>
              {admin.isAdmin ? "Click + to add your first project" : "Coming soon"}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
