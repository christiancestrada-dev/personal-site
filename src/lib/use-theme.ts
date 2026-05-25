"use client";
import { useEffect, useState } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  return { isDark };
}
