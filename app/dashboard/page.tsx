"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@/lib/types";

const fr = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-raleway), sans-serif", fontWeight: w, fontSize: s,
});
const fc = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-comfortaa), cursive", fontWeight: w, fontSize: s,
});

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchSessions = async () => {
    const res = await fetch("/api/sessions");
    if (res.ok) {
      const data = await res.json() as { sessions: Session[] };
      setSessions(data.sessions ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, []);

  const deleteSession = async (id: string, title: string) => {
    if (!confirm(`Hapus sesi "${title}"? Semua slide akan terhapus.`)) return;
    const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      showToast("Sesi dihapus");
    } else {
      showToast("Gagal menghapus sesi");
    }
  };

  const toggleActive = async (session: Session) => {
    const res = await fetch(`/api/sessions/${session.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !session.isActive }),
    });
    if (res.ok) {
      const data = await res.json() as { session: Session };
      setSessions((prev) => prev.map((s) => s.id === session.id ? data.session : s));
    }
  };

  const studentUrl = (token: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/belajar/${token}` : `/belajar/${token}`;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "80px" }}>
        <span style={{ ...fr(400, "16px"), color: "var(--text-light)" }}>Memuat...</span>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <h1 style={{ ...fc(700, "24px"), color: "var(--text-dark)", margin: 0 }}>Sesi Pembelajaran</h1>
        <button
          onClick={() => router.push("/dashboard/sesi")}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", ...fr(600, "14px") }}
        >
          + Buat Sesi Baru
        </button>
      </div>

      {sessions.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: "80px" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>📭</div>
          <p style={{ ...fr(500, "16px"), color: "var(--text-light)" }}>Belum ada sesi. Buat yang pertama!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {sessions.map((s) => (
            <div
              key={s.id}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ ...fr(600, "16px"), color: "var(--text-dark)", margin: 0, flex: 1, marginRight: "12px" }}>{s.title}</h3>
                <span
                  onClick={() => toggleActive(s)}
                  style={{
                    cursor: "pointer", padding: "4px 10px", borderRadius: "20px", ...fr(500, "12px"),
                    background: s.isActive ? "rgba(107,207,127,0.15)" : "rgba(156,163,175,0.15)",
                    color: s.isActive ? "var(--accent)" : "var(--text-light)",
                  }}
                  title={s.isActive ? "Aktif — klik untuk nonaktifkan" : "Nonaktif — klik untuk aktifkan"}
                >
                  {s.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ ...fr(400, "12px"), color: "var(--text-light)" }}>{s.slides.length} slide</span>
                <span style={{ ...fr(400, "12px"), color: "var(--text-light)" }}>·</span>
                <span style={{ ...fr(400, "12px"), color: "var(--text-light)" }}>{s.defaultDuration}dtk/slide</span>
              </div>

              {s.isActive && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-light)", borderRadius: "8px", padding: "8px 12px" }}>
                  <span style={{ ...fr(400, "11px"), color: "var(--text-light)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {studentUrl(s.shareToken)}
                  </span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(studentUrl(s.shareToken)); showToast("Link disalin!"); }}
                    style={{ padding: "4px 10px", background: "var(--primary)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", ...fr(500, "11px"), flexShrink: 0 }}
                  >
                    Salin
                  </button>
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button
                  onClick={() => router.push(`/dashboard/sesi/${s.id}`)}
                  style={{ flex: 1, padding: "10px", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", ...fr(600, "13px") }}
                >
                  Edit Sesi
                </button>
                <button
                  onClick={() => deleteSession(s.id, s.title)}
                  style={{ padding: "10px 14px", background: "transparent", border: "1px solid var(--danger)", borderRadius: "8px", cursor: "pointer", ...fr(500, "13px"), color: "var(--danger)" }}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="toast" style={{ ...fr(500, "14px") }}>{toast}</div>
      )}
    </>
  );
}
