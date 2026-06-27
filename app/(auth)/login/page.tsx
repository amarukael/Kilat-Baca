"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { fr, fc } from "@/lib/styles";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Gagal login"); return; }
      router.replace("/dashboard");
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="login-container" style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
      <h1 style={{ ...fc(700, "28px"), color: "var(--text-dark)", marginBottom: "8px", textAlign: "center" }}>
        📚 Kilat Baca
      </h1>
      <p style={{ ...fr(400, "14px"), color: "var(--text-light)", textAlign: "center", marginBottom: "32px" }}>
        Masuk ke panel pengajar
      </p>

      <form data-testid="login-form" onSubmit={submit}>
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="login-email" style={{ display: "block", ...fr(600, "14px"), marginBottom: "8px", color: "var(--text-dark)" }}>
            Email
          </label>
          <input
            id="login-email"
            name="email"
            data-testid="login-email-input"
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="guru@sekolah.id"
            style={{ width: "100%", padding: "12px", border: "2px solid var(--border)", borderRadius: "8px", ...fr(400, "14px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
          />
        </div>
        <div style={{ marginBottom: "24px" }}>
          <label htmlFor="login-password" style={{ display: "block", ...fr(600, "14px"), marginBottom: "8px", color: "var(--text-dark)" }}>
            Password
          </label>
          <input
            id="login-password"
            name="password"
            data-testid="login-password-input"
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: "100%", padding: "12px", border: "2px solid var(--border)", borderRadius: "8px", ...fr(400, "14px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
          />
        </div>

        {error && (
          <div data-testid="login-error" style={{ padding: "12px", background: "rgba(255,120,117,0.1)", border: "1px solid var(--danger)", borderRadius: "8px", ...fr(500, "13px"), color: "var(--danger)", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <button
          data-testid="login-submit-button"
          type="submit" disabled={loading}
          style={{ width: "100%", padding: "14px", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", ...fr(600, "15px"), opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Masuk..." : "Masuk"}
        </button>
      </form>

      <p style={{ ...fr(400, "13px"), color: "var(--text-light)", textAlign: "center", marginTop: "20px" }}>
        Belum punya akun?{" "}
        <a data-testid="login-register-link" href="/register" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
          Daftar
        </a>
      </p>
    </div>
  );
}
