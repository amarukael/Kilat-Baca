"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@/lib/types";

import { fr, fc } from "@/lib/styles";

export default function NewSessionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError("");
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    if (res.ok) {
      const data = await res.json() as { session: Session };
      router.push(`/dashboard/sesi/${data.session.id}`);
    } else {
      setError("Gagal membuat sesi. Coba lagi.");
      setCreating(false);
    }
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", paddingTop: "40px" }}>
      <button
        data-testid="new-session-back-button"
        onClick={() => router.push("/dashboard")}
        style={{ marginBottom: "24px", padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", ...fr(500, "13px"), color: "var(--text-dark)" }}
      >
        ← Kembali
      </button>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "32px" }}>
        <h1 style={{ ...fc(700, "22px"), color: "var(--text-dark)", marginBottom: "24px" }}>Buat Sesi Baru</h1>

        <form data-testid="new-session-form" onSubmit={createSession}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", ...fr(500, "13px"), color: "var(--text-light)", marginBottom: "8px" }}>
              Nama Sesi
            </label>
            <input
              data-testid="new-session-title-input"
              autoFocus
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Misal: Minggu 1 — Huruf A"
              style={{ width: "100%", padding: "12px", border: "2px solid var(--border)", borderRadius: "8px", ...fr(400, "14px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
            />
          </div>

          {error && (
            <p style={{ ...fr(400, "13px"), color: "var(--danger)", marginBottom: "16px" }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              data-testid="new-session-cancel-button"
              type="button"
              onClick={() => router.push("/dashboard")}
              style={{ flex: 1, padding: "12px", background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", ...fr(500, "14px"), color: "var(--text-dark)" }}
            >
              Batal
            </button>
            <button
              data-testid="new-session-submit-button"
              type="submit"
              disabled={creating}
              style={{ flex: 1, padding: "12px", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", cursor: creating ? "not-allowed" : "pointer", ...fr(600, "14px"), opacity: creating ? 0.7 : 1 }}
            >
              {creating ? "Membuat..." : "Buat Sesi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
