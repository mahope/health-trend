"use client";

import { useState } from "react";

function getTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const t = document.documentElement.dataset.theme;
  return t === "dark" ? "dark" : "light";
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  if (theme === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // ignore
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return getTheme();
  });

  return (
    <button
      type="button"
      className="inline-flex h-9 items-center justify-center rounded-lg border border-black/10 bg-white/60 px-3 text-sm text-neutral-900 shadow-sm backdrop-blur hover:bg-white/80 dark:border-white/10 dark:bg-black/20 dark:text-neutral-100 dark:hover:bg-black/30"
      onClick={() => {
        const next = theme === "dark" ? "light" : "dark";
        applyTheme(next);
        setTheme(next);
      }}
      aria-label="Skift tema"
      title="Skift tema"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
