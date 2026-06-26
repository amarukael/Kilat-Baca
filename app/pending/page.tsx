"use client";

import { useRouter } from "next/navigation";

const fr = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-raleway), sans-serif", fontWeight: w, fontSize: s,
});
const fc = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-comfortaa), cursive", fontWeight: w, fontSize: s,
});

export default function PendingPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-light)",
      padding: "24px",
    }}>
      <div style={{
        background: "var(--bg-card)",
        borderRadius: "16px",
        padding: "48px 40px",
        width: "100%",
        maxWidth: "440px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        textAlign: "center",
      }}>
        {/* Ikon */}
        <div style={{ fontSize: "56px", marginBottom: "20px", lineHeight: 1 }}>
          ⏳
        </div>

        <h1 style={{ ...fc(700, "24px"), color: "var(--text-dark)", marginBottom: "12px" }}>
          Pendaftaran Berhasil!
        </h1>

        <p style={{ ...fr(400, "15px"), color: "var(--text-light)", marginBottom: "8px", lineHeight: "1.6" }}>
          Akun Anda sedang menunggu konfirmasi dari admin.
        </p>

        <p style={{ ...fr(400, "14px"), color: "var(--text-light)", marginBottom: "32px", lineHeight: "1.6" }}>
          Anda akan mendapatkan akses setelah admin menyetujui pendaftaran. Silakan coba login kembali setelah mendapat konfirmasi.
        </p>

        {/* Divider */}
        <div style={{
          border: "none",
          borderTop: "1px solid var(--border)",
          marginBottom: "28px",
        }} />

        <button
          onClick={() => router.push("/login")}
          style={{
            width: "100%",
            padding: "13px",
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            ...fr(600, "15px"),
          }}
        >
          Ke Halaman Login
        </button>
      </div>
    </div>
  );
}
