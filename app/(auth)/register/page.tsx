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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) return;
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
    <>
      {/* Modal Syarat & Ketentuan */}
      {showTermsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="terms-modal-title"
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowTermsModal(false); }}
        >
          <div style={{
            background: "var(--bg-card)", borderRadius: "16px",
            width: "100%", maxWidth: "560px", maxHeight: "80vh",
            display: "flex", flexDirection: "column",
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          }}>
            {/* Header modal */}
            <div style={{
              padding: "24px 28px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <h2 id="terms-modal-title" style={{ ...fc(700, "20px"), color: "var(--text-dark)", margin: 0 }}>
                Syarat &amp; Ketentuan
              </h2>
              <button
                onClick={() => setShowTermsModal(false)}
                aria-label="Tutup modal"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  ...fr(600, "20px"), color: "var(--text-light)", lineHeight: 1, padding: "4px 8px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Konten — scrollable */}
            <div style={{ padding: "20px 28px 28px", overflowY: "auto", flex: 1 }}>
              <p style={{ ...fr(400, "13px"), color: "var(--text-light)", marginBottom: "16px" }}>
                Terakhir diperbarui: 27 Juni 2026
              </p>

              <section style={{ marginBottom: "20px" }}>
                <h3 style={{ ...fc(600, "15px"), color: "var(--text-dark)", marginBottom: "8px" }}>
                  1. Penerimaan Syarat
                </h3>
                <p style={{ ...fr(400, "14px"), color: "var(--text-dark)", lineHeight: 1.6, margin: 0 }}>
                  Dengan mendaftar dan menggunakan Kilat Baca, Anda menyatakan telah membaca, memahami, dan
                  menyetujui seluruh syarat dan ketentuan yang berlaku. Jika Anda tidak menyetujui salah satu
                  ketentuan, harap tidak menggunakan layanan ini.
                </p>
              </section>

              <section style={{ marginBottom: "20px" }}>
                <h3 style={{ ...fc(600, "15px"), color: "var(--text-dark)", marginBottom: "8px" }}>
                  2. Penggunaan Layanan
                </h3>
                <ul style={{ ...fr(400, "14px"), color: "var(--text-dark)", lineHeight: 1.8, paddingLeft: "20px", margin: 0 }}>
                  <li>Layanan Kilat Baca diperuntukkan bagi pengajar TK/PAUD dan tenaga pendidik anak usia dini.</li>
                  <li>Akun hanya boleh digunakan oleh satu pengguna dan tidak boleh dibagikan kepada pihak lain.</li>
                  <li>Pengguna bertanggung jawab menjaga kerahasiaan kata sandi akun masing-masing.</li>
                  <li>Dilarang menggunakan layanan untuk tujuan yang melanggar hukum atau merugikan pihak lain.</li>
                </ul>
              </section>

              <section style={{ marginBottom: "20px" }}>
                <h3 style={{ ...fc(600, "15px"), color: "var(--text-dark)", marginBottom: "8px" }}>
                  3. Konten dan Materi Belajar
                </h3>
                <p style={{ ...fr(400, "14px"), color: "var(--text-dark)", lineHeight: 1.6, margin: 0 }}>
                  Pengguna bertanggung jawab penuh atas konten (teks, gambar, audio) yang diunggah ke platform.
                  Konten tidak boleh mengandung unsur kekerasan, pornografi, SARA, atau melanggar hak cipta pihak
                  ketiga. Kami berhak menghapus konten yang melanggar ketentuan ini tanpa pemberitahuan sebelumnya.
                </p>
              </section>

              <section style={{ marginBottom: "20px" }}>
                <h3 style={{ ...fc(600, "15px"), color: "var(--text-dark)", marginBottom: "8px" }}>
                  4. Privasi Data
                </h3>
                <p style={{ ...fr(400, "14px"), color: "var(--text-dark)", lineHeight: 1.6, margin: 0 }}>
                  Kami mengumpulkan data yang diperlukan untuk menjalankan layanan, termasuk nama, alamat email,
                  dan data aktivitas penggunaan. Data tidak akan dijual atau dibagikan kepada pihak ketiga tanpa
                  persetujuan Anda, kecuali diwajibkan oleh hukum yang berlaku.
                </p>
              </section>

              <section style={{ marginBottom: "20px" }}>
                <h3 style={{ ...fc(600, "15px"), color: "var(--text-dark)", marginBottom: "8px" }}>
                  5. Persetujuan Akun
                </h3>
                <p style={{ ...fr(400, "14px"), color: "var(--text-dark)", lineHeight: 1.6, margin: 0 }}>
                  Pendaftaran akun memerlukan persetujuan dari administrator. Akun yang belum disetujui tidak dapat
                  mengakses fitur penuh layanan. Kami berhak menolak atau menonaktifkan akun yang melanggar
                  ketentuan ini.
                </p>
              </section>

              <section style={{ marginBottom: "20px" }}>
                <h3 style={{ ...fc(600, "15px"), color: "var(--text-dark)", marginBottom: "8px" }}>
                  6. Batasan Tanggung Jawab
                </h3>
                <p style={{ ...fr(400, "14px"), color: "var(--text-dark)", lineHeight: 1.6, margin: 0 }}>
                  Kilat Baca disediakan "sebagaimana adanya". Kami tidak menjamin layanan bebas dari gangguan atau
                  kesalahan. Kami tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan
                  atau ketidakmampuan menggunakan layanan ini.
                </p>
              </section>

              <section>
                <h3 style={{ ...fc(600, "15px"), color: "var(--text-dark)", marginBottom: "8px" }}>
                  7. Perubahan Ketentuan
                </h3>
                <p style={{ ...fr(400, "14px"), color: "var(--text-dark)", lineHeight: 1.6, margin: 0 }}>
                  Kami dapat mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diberitahukan melalui
                  email atau notifikasi dalam aplikasi. Penggunaan layanan setelah perubahan berlaku dianggap
                  sebagai persetujuan terhadap ketentuan baru.
                </p>
              </section>
            </div>

            {/* Footer modal */}
            <div style={{ padding: "16px 28px 24px", borderTop: "1px solid var(--border)" }}>
              <button
                onClick={() => { setAgreedToTerms(true); setShowTermsModal(false); }}
                style={{
                  width: "100%", padding: "12px",
                  background: "var(--primary)", color: "white",
                  border: "none", borderRadius: "8px", cursor: "pointer",
                  ...fr(600, "14px"),
                }}
              >
                Saya Mengerti &amp; Setuju
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card register */}
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
              placeholder="guru@sekolah.id"
              style={{ width: "100%", padding: "12px", border: "2px solid var(--border)", borderRadius: "8px", ...fr(400, "14px"), background: "var(--bg-light)", color: "var(--text-dark)", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", ...fr(600, "14px"), marginBottom: "8px", color: "var(--text-dark)" }}>Kata Sandi</label>
            <input
              data-testid="register-password-input"
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              style={{ width: "100%", padding: "12px", border: "2px solid var(--border)", borderRadius: "8px", ...fr(400, "14px"), background: "var(--bg-light)", color: "var(--text-dark)", boxSizing: "border-box" }}
            />
          </div>

          {/* Checkbox syarat & ketentuan */}
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <input
              data-testid="register-terms-checkbox"
              id="terms-checkbox"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              style={{ marginTop: "2px", width: "16px", height: "16px", accentColor: "var(--primary)", flexShrink: 0, cursor: "pointer" }}
            />
            <label htmlFor="terms-checkbox" style={{ ...fr(400, "13px"), color: "var(--text-dark)", lineHeight: 1.5, cursor: "pointer" }}>
              Saya telah membaca dan menyetujui{" "}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                style={{
                  background: "none", border: "none", padding: 0,
                  color: "var(--primary)", ...fr(600, "13px"),
                  cursor: "pointer", textDecoration: "underline",
                }}
              >
                Syarat &amp; Ketentuan
              </button>{" "}
              penggunaan Kilat Baca.
            </label>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", padding: "10px 14px", border: "1px solid var(--danger)", borderRadius: "8px", ...fr(500, "13px"), color: "var(--danger)", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          <button
            data-testid="register-submit-button"
            type="submit" disabled={loading || !agreedToTerms}
            style={{
              width: "100%", padding: "14px",
              background: agreedToTerms ? "var(--primary)" : "var(--border)",
              color: agreedToTerms ? "white" : "var(--text-light)",
              border: "none", borderRadius: "8px",
              cursor: loading || !agreedToTerms ? "not-allowed" : "pointer",
              ...fr(600, "15px"),
              opacity: loading ? 0.7 : 1,
              transition: "background 0.2s, color 0.2s",
            }}
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
    </>
  );
}
