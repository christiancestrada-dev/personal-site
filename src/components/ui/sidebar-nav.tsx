"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Zap, Gift, Clock, Mail, Calendar, Menu, X, ChevronLeft, ChevronRight, ChevronDown, Sun, Moon, Monitor, LinkIcon, Info, Video } from "lucide-react";
import { BGPattern } from "@/components/ui/bg-pattern";
import { Signature } from "@/components/ui/signature";

// ─── Nav links ───────────────────────────────────────────────────────────────

type SubNavItem = { href: string; label: string; shortcut: string; icon: typeof Home };
type NavItem =
  | { href: string; label: string; icon: typeof Home; shortcut: string; subItems?: undefined }
  | { label: string; icon: typeof Home; shortcut: string; subItems: SubNavItem[] };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home, shortcut: "1" },
  { href: "/now", label: "Now", icon: Zap, shortcut: "2" },
  // { href: "/reading", label: "Reading", icon: BookOpen, shortcut: "3" }, // archived
  { href: "/links", label: "Links", icon: LinkIcon, shortcut: "4" },
  // { href: "/things", label: "Things", icon: Gift, shortcut: "5" },
  { href: "/stuff", label: "Stuff", icon: Video, shortcut: "5" },
  { href: "/clock", label: "Visualizations", icon: Clock, shortcut: "6" },
  { href: "/about-site", label: "About This Site", icon: Info, shortcut: "7" },
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- theme lives in localStorage, unavailable during SSR
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- collapsed state lives in localStorage, unavailable during SSR
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navHovered, setNavHovered] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const chordTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-expand the group containing the current page
  useEffect(() => {
    const group = NAV_ITEMS.find((n) => n.subItems?.some((s) => s.href === pathname));
    if (group) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reflects current route into expand state
      setExpandedGroup(group.label);
    }
  }, [pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close drawer in response to route change
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev: boolean) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }, [setCollapsed]);

  // Keyboard shortcuts: 1-9=nav, 0=contact, /=schedule, 4 also arms a short chord
  // window (t/l/s) to jump straight into a Things subtab.
  useEffect(() => {
    const clearChord = () => {
      if (chordTimeoutRef.current) {
        clearTimeout(chordTimeoutRef.current);
        chordTimeoutRef.current = null;
      }
    };

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      // Mid-chord: a subtab letter was pressed after "4"
      if (chordTimeoutRef.current) {
        const group = NAV_ITEMS.find((n) => n.subItems);
        const sub = group?.subItems?.find((s) => s.shortcut === e.key);
        clearChord();
        if (sub) {
          router.push(sub.href);
          return;
        }
        // not a chord key — fall through to normal handling below
      }

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
      if (!item) return;

      if (item.subItems) {
        setExpandedGroup(item.label);
        chordTimeoutRef.current = setTimeout(() => {
          chordTimeoutRef.current = null;
          router.push(item.subItems[0].href);
        }, 1500);
        return;
      }

      router.push(item.href);
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      clearChord();
    };
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
        {NAV_ITEMS.map((item) => {
          const { label, icon: Icon, shortcut } = item;

          if (item.subItems) {
            const isGroupActive = item.subItems.some((s) => s.href === pathname);
            const isExpanded = expandedGroup === label;
            return (
              <div key={label}>
                <button
                  type="button"
                  title={collapsed && !isMobile ? `${label} (${shortcut})` : undefined}
                  onClick={() => setExpandedGroup(isExpanded ? null : label)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-150"
                  style={{
                    backgroundColor: isGroupActive ? "var(--site-nav-active)" : "transparent",
                    color: "var(--site-text-bright)",
                    justifyContent: (!isMobile && collapsed) ? "center" : "flex-start",
                  }}
                  onMouseEnter={(e) => {
                    if (!isGroupActive) e.currentTarget.style.backgroundColor = "var(--site-nav-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isGroupActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Icon size={16} />
                  {(isMobile || !collapsed) && (
                    <>
                      <span className="text-xs font-medium flex-1 text-left">{label}</span>
                      <ChevronDown
                        size={14}
                        style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 150ms" }}
                      />
                      <span
                        className="text-[11px] font-mono font-medium inline-flex items-center justify-center rounded"
                        style={{
                          color: "var(--site-text-bright)",
                          backgroundColor: "var(--site-nav-active)",
                          border: "1px solid var(--site-border)",
                          minWidth: 22,
                          height: 22,
                          padding: "0 5px",
                        }}
                      >
                        {shortcut}
                      </span>
                    </>
                  )}
                </button>

                {isExpanded && (isMobile || !collapsed) && (
                  <div className="mt-1 ml-4 space-y-1 pl-3" style={{ borderLeft: "1px solid var(--site-border)" }}>
                    {item.subItems.map((sub) => {
                      const isActive = pathname === sub.href;
                      const SubIcon = sub.icon;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="flex items-center gap-2.5 pl-3 pr-1 py-2 rounded-md transition-colors duration-150"
                          style={{
                            backgroundColor: isActive ? "var(--site-nav-active)" : "transparent",
                            color: "var(--site-text-bright)",
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) e.currentTarget.style.backgroundColor = "var(--site-nav-hover)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <SubIcon size={14} style={{ opacity: 0.8 }} />
                          <span className="text-xs font-medium flex-1">{sub.label}</span>
                          <span
                            className="text-[10px] font-mono inline-flex items-center justify-center rounded-full uppercase"
                            style={{
                              color: "var(--site-text-dim)",
                              backgroundColor: "transparent",
                              border: "1px dashed var(--site-border)",
                              minWidth: 18,
                              height: 18,
                              padding: "0 4px",
                              marginRight: 10,
                            }}
                          >
                            {sub.shortcut}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const href = item.href;
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
                      backgroundColor: "var(--site-nav-active)",
                      border: "1px solid var(--site-border)",
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
                backgroundColor: "var(--site-nav-active)",
                border: "1px solid var(--site-border)",
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
                backgroundColor: "var(--site-nav-active)",
                border: "1px solid var(--site-border)",
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
          borderImage: "linear-gradient(to bottom, var(--site-border), color-mix(in srgb, var(--site-accent) 15%, transparent), var(--site-border)) 1",
        }}
      >
        {/* Subtle grid texture — behind content, fades on nav hover */}
        <BGPattern
          variant="grid" size={32} fill="var(--site-border)" mask="fade-bottom"
          className="pointer-events-none transition-opacity duration-300"
          style={{ opacity: navHovered ? 0 : "var(--site-grid-opacity)", zIndex: 0 }}
        />
        {/* Very subtle pink gradient on right edge */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background: "linear-gradient(to right, transparent 60%, color-mix(in srgb, var(--site-accent) 4%, transparent) 100%)",
            opacity: navHovered ? 0 : 1,
            zIndex: 1,
          }}
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
          <X size={20} style={{ color: "var(--site-text)" }} />
        ) : (
          <Menu size={20} style={{ color: "var(--site-text)" }} />
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

