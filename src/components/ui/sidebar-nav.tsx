"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Zap, BookOpen, PenLine, Gift, Clock, Mail, Calendar, Menu, X, ChevronLeft, ChevronRight, Sun, Moon, Monitor, LinkIcon, Info } from "lucide-react";
import { AnimatedText } from "@/components/ui/animated-text";
import { BGPattern } from "@/components/ui/bg-pattern";
import { Signature } from "@/components/ui/signature";

// ─── Nav links ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home, shortcut: "1" },
  { href: "/now", label: "Now", icon: Zap, shortcut: "2" },
  { href: "/reading", label: "Reading", icon: BookOpen, shortcut: "3" },
  { href: "/writing", label: "Writing", icon: PenLine, shortcut: "4" },
  { href: "/links", label: "Links", icon: LinkIcon, shortcut: "5" },
  { href: "/things", label: "Things", icon: Gift, shortcut: "6" },
  { href: "/clock", label: "Clock", icon: Clock, shortcut: "7" },
  { href: "/about-site", label: "About This Site", icon: Info, shortcut: "8" },
];

// ─── Theme Toggle ───────────────────────────────────────────────────────────

type ThemeMode = "light" | "dark" | "auto";

function applyTheme(mode: ThemeMode) {
  let resolved: "light" | "dark" = "dark";
  if (mode === "light") resolved = "light";
  else if (mode === "auto") {
    resolved = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  document.documentElement.setAttribute("data-theme", resolved);
}

function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  // Init from localStorage + listen for system changes in auto mode
  useEffect(() => {
    const saved = localStorage.getItem("theme") as ThemeMode | null;
    const initial = saved || "dark";
    setMode(initial);
    applyTheme(initial);

    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const listener = () => {
      const current = (localStorage.getItem("theme") || "dark") as ThemeMode;
      if (current === "auto") applyTheme("auto");
    };
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const changeMode = (m: ThemeMode) => {
    setMode(m);
    localStorage.setItem("theme", m);
    applyTheme(m);
  };

  const options: { value: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { value: "light", icon: <Sun size={12} />, label: "Light" },
    { value: "dark", icon: <Moon size={12} />, label: "Dark" },
    { value: "auto", icon: <Monitor size={12} />, label: "Auto" },
  ];

  return (
    <div
      className="flex rounded-lg p-1 gap-1"
      style={{ backgroundColor: "var(--site-bg-card)", border: "1px solid var(--site-border)" }}
    >
      {options.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => changeMode(value)}
          className="flex-1 py-1.5 rounded-md text-[11px] font-medium transition-colors"
          style={{
            backgroundColor: mode === value ? "var(--site-border)" : "transparent",
            color: mode === value ? "var(--site-text)" : "var(--site-text-dim)",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Sidebar Layout (wraps sidebar + content) ───────────────────────────────

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
    setHydrated(true);
  }, []);

  const desktopWidth = collapsed ? 64 : 260;

  return (
    <>
      <SidebarNav collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className="transition-all duration-200"
        style={{ marginLeft: hydrated ? undefined : 0 }}
      >
        <style>{`@media (min-width: 768px) { .sidebar-content { margin-left: ${desktopWidth}px; } }`}</style>
        <div className="sidebar-content">
          {children}
        </div>
      </div>
    </>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function SidebarNav({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (fn: (prev: boolean) => boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navHovered, setNavHovered] = useState(false);

  useEffect(() => setMounted(true), []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev: boolean) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }, [setCollapsed]);

  // Keyboard shortcuts: 1-9=nav, 0=contact, /=schedule
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (e.key === "0") {
        router.push("/contact");
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        router.push("/schedule");
        return;
      }
      const item = NAV_ITEMS.find((n) => n.shortcut === e.key);
      if (item) router.push(item.href);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  const desktopWidth = collapsed ? 64 : 260;

  const sidebarContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full py-6 px-5">
      {/* Top: signature */}
      <div className="mb-6">
        <Link href="/" className="block" style={{ display: (!isMobile && collapsed) ? "none" : "block" }}>
          <Signature width={160} height={52} color="var(--site-text-bright)" />
        </Link>
      </div>

      {/* Middle: nav links */}
      <nav className="space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, shortcut }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed && !isMobile ? `${label} (${shortcut})` : undefined}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-150"
              style={{
                backgroundColor: isActive ? "var(--site-nav-active)" : "transparent",
                color: "var(--site-text-bright)",
                justifyContent: (!isMobile && collapsed) ? "center" : "flex-start",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = "var(--site-nav-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Icon size={16} />
              {(isMobile || !collapsed) && (
                <>
                  <span className="text-xs font-medium flex-1">{label}</span>
                  <span
                    className="text-[11px] font-mono font-medium inline-flex items-center justify-center rounded"
                    style={{
                      color: "var(--site-text-bright)",
                      backgroundColor: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      minWidth: 22,
                      height: 22,
                      padding: "0 5px",
                    }}
                  >
                    {shortcut}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Stay in touch */}
      {(isMobile || !collapsed) && (
        <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--site-border)" }}>
          <h3 className="text-[10px] tracking-wide mb-3" style={{ color: "var(--site-text-dim)" }}>
            Stay in touch
          </h3>
          <Link
            href="/contact"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-150"
            style={{
              backgroundColor: pathname === "/contact" ? "var(--site-nav-active)" : "transparent",
              color: "var(--site-text-bright)",
            }}
            onMouseEnter={(e) => {
              if (pathname !== "/contact") e.currentTarget.style.backgroundColor = "var(--site-nav-hover)";
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/contact") e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Mail size={16} />
            <span className="text-xs font-medium flex-1">Contact</span>
            <span
              className="text-[11px] font-mono font-medium inline-flex items-center justify-center rounded"
              style={{
                color: "var(--site-text-bright)",
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                minWidth: 22,
                height: 22,
                padding: "0 5px",
              }}
            >
              0
            </span>
          </Link>
          <Link
            href="/schedule"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-150"
            style={{
              backgroundColor: pathname === "/schedule" ? "var(--site-nav-active)" : "transparent",
              color: "var(--site-text-bright)",
            }}
            onMouseEnter={(e) => {
              if (pathname !== "/schedule") e.currentTarget.style.backgroundColor = "var(--site-nav-hover)";
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/schedule") e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Calendar size={16} />
            <span className="text-xs font-medium flex-1">Schedule a meeting</span>
            <span
              className="text-[11px] font-mono font-medium inline-flex items-center justify-center rounded"
              style={{
                color: "var(--site-text-bright)",
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                minWidth: 22,
                height: 22,
                padding: "0 5px",
              }}
            >
              /
            </span>
          </Link>
        </div>
      )}

      <div className="flex-1" />

      {/* Bottom: theme toggle */}
      {(isMobile || !collapsed) && (
        <div className="space-y-3 pb-2">
          <ThemeToggle />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col fixed top-0 left-0 h-screen z-40 transition-all duration-200"
        style={{
          width: desktopWidth,
          backgroundColor: "var(--site-bg-sidebar)",
          borderRight: "1px solid var(--site-border)",
        }}
      >
        {/* Subtle grid texture — behind content, fades on nav hover */}
        <BGPattern
          variant="grid" size={32} fill="var(--site-border)" mask="fade-bottom"
          className="pointer-events-none transition-opacity duration-300"
          style={{ opacity: navHovered ? 0 : "var(--site-grid-opacity)", zIndex: 0 }}
        />
        <div className="relative z-10 flex flex-col h-full" onMouseEnter={() => setNavHovered(true)} onMouseLeave={() => setNavHovered(false)}>
          {sidebarContent(false)}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="absolute top-6 -right-3 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
          style={{
            backgroundColor: "var(--site-bg)",
            border: "1px solid var(--site-border)",
            color: "var(--site-text-secondary)",
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md transition-colors"
        style={{ backgroundColor: "var(--site-bg-sidebar)", border: "1px solid var(--site-border)" }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? (
          <X size={20} style={{ color: "#d4d4d4" }} />
        ) : (
          <Menu size={20} style={{ color: "#d4d4d4" }} />
        )}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 transition-opacity"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-out drawer */}
      <aside
        className="md:hidden fixed top-0 left-0 h-screen z-40 transition-transform duration-300"
        style={{
          width: 260,
          backgroundColor: "var(--site-bg-sidebar-mobile)",
          borderRight: "1px solid var(--site-border)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <BGPattern variant="grid" size={32} fill="var(--site-border)" mask="fade-bottom" className="pointer-events-none" style={{ opacity: "var(--site-grid-opacity)", zIndex: 0 }} />
        <div className="relative z-10 flex flex-col h-full">
          {sidebarContent(true)}
        </div>
      </aside>
    </>
  );
}
