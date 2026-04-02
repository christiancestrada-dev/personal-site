"use client";

import { Lock, Unlock, Plus, X } from "lucide-react";

interface AdminBarProps {
  isAdmin: boolean;
  showPrompt: boolean;
  input: string;
  setInput: (v: string) => void;
  error: boolean;
  login: () => void;
  logout: () => void;
  openPrompt: () => void;
  closePrompt: () => void;
  onAdd?: () => void;
}

export function AdminBar({ isAdmin, showPrompt, input, setInput, error, login, logout, openPrompt, closePrompt, onAdd }: AdminBarProps) {
  return (
    <>
      {/* Lock/Unlock + Add buttons */}
      <div className="flex items-center gap-2">
        {!isAdmin ? (
          <button
            onClick={openPrompt}
            className="p-2 rounded-md transition-colors"
            style={{ color: "var(--site-text-dim)" }}
            title="Admin login"
          >
            <Lock size={14} />
          </button>
        ) : (
          <>
            {onAdd && (
              <button
                onClick={onAdd}
                className="p-2 rounded-md transition-colors"
                style={{ color: "var(--site-accent)" }}
                title="Add"
              >
                <Plus size={16} />
              </button>
            )}
            <button
              onClick={logout}
              className="p-2 rounded-md transition-colors"
              style={{ color: "var(--site-text-dim)" }}
              title="Logout"
            >
              <Unlock size={14} />
            </button>
          </>
        )}
      </div>

      {/* Password prompt */}
      {showPrompt && (
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: "var(--site-bg-card-alpha)", border: "1px solid var(--site-border)" }}
        >
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={input}
              onChange={(e) => { setInput(e.target.value); }}
              onKeyDown={(e) => e.key === "Enter" && login()}
              placeholder="Password"
              className="flex-1 px-3 py-2 rounded-md text-sm font-mono outline-none"
              style={{
                backgroundColor: "var(--site-bg)",
                color: "var(--site-text)",
                border: `1px solid ${error ? "var(--site-accent)" : "var(--site-border)"}`,
              }}
              autoFocus
            />
            <button
              onClick={login}
              className="px-3 py-2 rounded-md text-xs font-medium"
              style={{ backgroundColor: "var(--site-accent)", color: "#fff" }}
            >
              Login
            </button>
            <button
              onClick={closePrompt}
              className="p-2 rounded-md"
              style={{ color: "var(--site-text-dim)" }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
