"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { fr, fc } from "@/lib/styles";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Gagal mendaftar"); return; }
      router.replace("/pending");
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="register-container" style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
      <h1 style={{ ...fc(700, "28px"), color: "var(--text-dark)", marginBottom: "8px", textAlign: "center" }}>
        📚 Kilat Baca
      </h1>
      <p style={{ ...fr(400, "14px"), color: "var(--text-light)", textAlign: "center", marginBottom: "32px" }}>
        Buat akun pengajar baru
      </p>

      <form data-testid="register-form" onSubmit={submit}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", ...fr(600, "14px"), marginBottom: "8px", color: "var(--text-dark)" }}>Nama Lengkap</label>
          <input
            data-testid="register-name-input"
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Miss Halimah"
            style={{ width: "100%", padding: "12px", border: "2px solid var(--border)", borderRadius: "8px", ...fr(400, "14px"), background: "var(--bg-light)", color: "var(--text-dark)", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", ...fr(600, "14px"), marginBottom: "8px", color: "var(--text-dark)" }}>Email</label>
          <input
            data-testid="register-email-input"
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="miss.halimah@sekolah.id"
            style={{ width: "100%", padding: "12px", border: "2px solid var(--border)", borderRadius: "8px", ...fr(400, "14px"), background: "var(--bg-light)", color: "var(--text-dark)", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", ...fr(600, "14px"), marginBottom: "8px", color: "var(--text-dark)" }}>Password</label>
          <input
            data-testid="register-password-input"
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            style={{ width: "100%", padding: "12px", border: "2px solid var(--border)", borderRadius: "8px", ...fr(400, "14px"), background: "var(--bg-light)", color: "var(--text-dark)", boxSizing: "border-box" }}
          />
        </div>

        {error && (
          <div data-testid="register-error" style={{ padding: "12px", background: "rgba(255,120,117,0.1)", border: "1px solid var(--danger)", borderRadius: "8px", ...fr(500, "13px"), color: "var(--danger)", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <button
          data-testid="register-submit-button"
          type="submit" disabled={loading}
          style={{ width: "100%", padding: "14px", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", ...fr(600, "15px"), opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Mendaftar..." : "Daftar"}
        </button>
      </form>

      <p style={{ ...fr(400, "13px"), color: "var(--text-light)", textAlign: "center", marginTop: "20px" }}>
        Sudah punya akun?{" "}
        <a data-testid="register-login-link" href="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
          Masuk
        </a>
      </p>
    </div>
  );
}
