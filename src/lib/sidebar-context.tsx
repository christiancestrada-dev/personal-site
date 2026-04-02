"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface SidebarVisibilityContextValue {
  sidebarHidden: boolean;
  setSidebarHidden: (hidden: boolean) => void;
}

const SidebarVisibilityContext = createContext<SidebarVisibilityContextValue>({
  sidebarHidden: false,
  setSidebarHidden: () => {},
});

export function SidebarVisibilityProvider({ children }: { children: ReactNode }) {
  const [sidebarHidden, setSidebarHiddenState] = useState(false);

  const setSidebarHidden = useCallback((hidden: boolean) => {
    setSidebarHiddenState(hidden);
  }, []);

  return (
    <SidebarVisibilityContext.Provider value={{ sidebarHidden, setSidebarHidden }}>
      {children}
    </SidebarVisibilityContext.Provider>
  );
}

export function useSidebarVisibility() {
  return useContext(SidebarVisibilityContext);
}
