"use client";

import { useState } from "react";

const KEY_MAP: Record<string, string> = {
  "site-home-content": "home-content",
  "site-projects": "projects",
  "site-links": "links",
  "site-now": "now",
  "site-reading-extra": "reading-extra",
  "site-things": "things",
  "site-things-subtitle": "things-subtitle",
  "site-things-categories": "things-categories",
};

export default function MigratePage() {
  const [status, setStatus] = useState<string>("Ready to migrate");
  const [details, setDetails] = useState<string[]>([]);

  const migrate = async () => {
    setStatus("Migrating...");
    const entries: Record<string, unknown> = {};
    const found: string[] = [];

    for (const [localKey, kvKey] of Object.entries(KEY_MAP)) {
      const raw = localStorage.getItem(localKey);
      if (raw) {
        try {
          entries[kvKey] = JSON.parse(raw);
          found.push(`${localKey} -> ${kvKey}`);
        } catch {
          entries[kvKey] = raw;
          found.push(`${localKey} -> ${kvKey} (raw string)`);
        }
      }
    }

    if (found.length === 0) {
      setStatus("No localStorage data found to migrate.");
      return;
    }

    setDetails(found);

    try {
      const res = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entries),
      });
      const data = await res.json();
      setStatus(`Done! Migrated ${data.migrated} entries to the database.`);
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "monospace", backgroundColor: "#0b1728", color: "#c8ddf0", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Migrate localStorage to KV</h1>
      <p style={{ marginBottom: 20, color: "#5a7a9e" }}>
        This will read your browser&apos;s localStorage and push it to the database so everyone can see your edits.
      </p>
      <button
        onClick={migrate}
        style={{ padding: "12px 24px", backgroundColor: "#ff6b60", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
      >
        Migrate Now
      </button>
      <p style={{ marginTop: 20, fontSize: 16 }}>{status}</p>
      {details.length > 0 && (
        <ul style={{ marginTop: 12, fontSize: 13, color: "#5a7a9e" }}>
          {details.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      )}
    </div>
  );
}
