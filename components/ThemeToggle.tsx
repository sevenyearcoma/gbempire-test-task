"use client";

import { Moon, Sun } from "lucide-react";
import { useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("dashboard-theme", theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-sm font-medium text-[var(--panel-foreground)] shadow-[0_10px_26px_rgba(14,18,28,.10)] backdrop-blur-sm transition-transform hover:-translate-y-0.5"
      aria-label="Переключить тему"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span>{theme === "dark" ? "Светлая тема" : "Тёмная тема"}</span>
    </button>
  );
}
