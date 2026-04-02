"use client";

import { useState, useEffect } from "react";

export function usePageAdmin(pageName: string) {
  const password = `${pageName}pls`;
  const storageKey = `site-admin-${pageName}`;
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(storageKey) === "true") setIsAdmin(true);
  }, [storageKey]);

  const login = () => {
    if (input === password) {
      setIsAdmin(true);
      localStorage.setItem(storageKey, "true");
      setShowPrompt(false);
      setInput("");
      setError(false);
    } else {
      setError(true);
    }
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem(storageKey);
  };

  const openPrompt = () => setShowPrompt(true);
  const closePrompt = () => { setShowPrompt(false); setInput(""); setError(false); };

  return { isAdmin, showPrompt, input, setInput, error, login, logout, openPrompt, closePrompt };
}
