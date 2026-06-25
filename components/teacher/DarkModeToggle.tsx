"use client";

import { useDarkMode } from "@/hooks/useDarkMode";

const fr = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-raleway), sans-serif", fontWeight: w, fontSize: s,
});

export default function DarkModeToggle() {
  const { dark, toggle } = useDarkMode();
  return (
    <button
      onClick={toggle}
      title={dark ? "Mode terang" : "Mode gelap"}
      style={{ padding: "6px 12px", background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", ...fr(500, "13px"), color: "var(--text-dark)" }}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
