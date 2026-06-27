"use client";
import { useDarkMode } from "@/hooks/useDarkMode";
import { fr } from "@/lib/styles";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { dark, toggle } = useDarkMode();

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-light)", padding: "20px", position: "relative",
    }}>
      {/* Tombol dark mode toggle */}
      <button
        onClick={toggle}
        aria-label={dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
        title={dark ? "Mode terang" : "Mode gelap"}
        style={{
          position: "fixed", top: "16px", right: "16px",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "8px", padding: "8px 12px",
          cursor: "pointer", ...fr(500, "18px"),
          color: "var(--text-dark)", lineHeight: 1,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          zIndex: 10,
        }}
      >
        {dark ? "☀️" : "🌙"}
      </button>

      {children}
    </div>
  );
}
