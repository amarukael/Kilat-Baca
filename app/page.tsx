import { redirect } from "next/navigation";
import { getTeacherId } from "@/lib/auth";
import { fc, fr } from "@/lib/styles";

export default async function HomePage() {
  const teacherId = await getTeacherId();
  if (teacherId) redirect("/dashboard");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-light)", color: "var(--text-dark)" }}>

      {/* Navbar */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--bg-card)", borderBottom: "1px solid var(--border)",
        padding: "0 32px", height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ ...fc(700, "20px"), color: "var(--primary)" }}>📚 Kilat Baca</span>
        <a
          href="/login"
          style={{
            ...fr(600, "14px"), color: "white",
            background: "var(--primary)", padding: "10px 24px",
            borderRadius: "8px", textDecoration: "none",
          }}
        >
          Masuk sebagai Guru
        </a>
      </nav>

      {/* Hero */}
      <section style={{
        padding: "80px 32px 64px",
        textAlign: "center",
        maxWidth: "720px",
        margin: "0 auto",
      }}>
        <div style={{ fontSize: "56px", marginBottom: "24px" }}>⚡</div>
        <h1 style={{ ...fc(700, "40px"), color: "var(--text-dark)", marginBottom: "16px", lineHeight: 1.2 }}>
          Kilat Baca
        </h1>
        <p style={{ ...fr(400, "18px"), color: "var(--text-light)", marginBottom: "40px", lineHeight: 1.6 }}>
          Kilat Baca membantu guru menyiapkan sesi pembelajaran visual berbasis flash card.
          Murid cukup buka link — tanpa install, tanpa login.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="/login"
            style={{
              ...fr(600, "16px"), color: "white",
              background: "var(--primary)", padding: "14px 32px",
              borderRadius: "10px", textDecoration: "none",
            }}
          >
            Mulai Mengajar
          </a>
          <a
            href="#cara-pakai"
            style={{
              ...fr(600, "16px"), color: "var(--primary)",
              background: "transparent",
              border: "2px solid var(--primary)",
              padding: "14px 32px",
              borderRadius: "10px", textDecoration: "none",
            }}
          >
            Lihat Cara Pakai
          </a>
        </div>
      </section>

      {/* Kelebihan */}
      <section style={{ background: "var(--bg-card)", padding: "64px 32px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ ...fc(700, "28px"), color: "var(--text-dark)", textAlign: "center", marginBottom: "48px" }}>
            Kenapa Kilat Baca?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "32px" }}>
            {[
              { icon: "🎯", title: "Terstruktur", desc: "Guru atur durasi tampil dan jeda per slide. Tidak ada yang terburu-buru, tidak ada yang ketinggalan." },
              { icon: "📱", title: "Tanpa Install", desc: "Murid buka link di browser. Tidak perlu download aplikasi, tidak perlu daftar akun." },
              { icon: "🖼️", title: "Gambar & Teks", desc: "Slide bisa berupa gambar dari Google Drive atau teks besar yang langsung terlihat dari jauh." },
              { icon: "🔀", title: "Bisa Diacak", desc: "Aktifkan shuffle agar urutan slide berbeda tiap sesi — murid tidak hafal urutan, otak tetap aktif." },
              { icon: "⏱️", title: "Timer Otomatis", desc: "Setelah guru mulai, sesi berjalan otomatis. Guru bisa fokus memandu kelas, bukan klik tombol." },
              { icon: "🌙", title: "Dark Mode", desc: "Nyaman dipakai di ruang kelas dengan pencahayaan berbeda — terang atau gelap sama-sama enak dilihat." },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: "var(--bg-light)", borderRadius: "12px",
                padding: "28px 24px", border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>{icon}</div>
                <h3 style={{ ...fr(700, "16px"), color: "var(--text-dark)", marginBottom: "8px" }}>{title}</h3>
                <p style={{ ...fr(400, "14px"), color: "var(--text-light)", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contoh Kasus */}
      <section style={{ padding: "64px 32px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <h2 style={{ ...fc(700, "28px"), color: "var(--text-dark)", textAlign: "center", marginBottom: "48px" }}>
            Contoh Penggunaan
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[
              {
                label: "Kelas Pagi TK A",
                desc: "Bu Rina menyiapkan 20 slide kata buah-buahan malam sebelumnya. Pagi harinya, ia tinggal aktifkan sesi dan bagikan link ke layar proyektor. Murid menyebut kata yang muncul bersama-sama.",
              },
              {
                label: "Latihan Kalimat Sederhana",
                desc: "Pak Dodi membuat sesi dengan 10 slide kalimat pendek — masing-masing tampil 2 detik dengan jeda 1 detik. Setelah sesi selesai, ia minta murid mengulang kalimat yang mereka ingat.",
              },
              {
                label: "Sesi Angka 1–20",
                desc: "Guru mengupload gambar kartu angka dari Google Drive. Shuffle diaktifkan agar tiap pertemuan urutannya berbeda. Murid berlomba menyebut angka lebih cepat dari slide berikutnya.",
              },
            ].map(({ label, desc }, i) => (
              <div key={i} style={{
                display: "flex", gap: "20px", alignItems: "flex-start",
                background: "var(--bg-card)", borderRadius: "12px",
                padding: "24px", border: "1px solid var(--border)",
              }}>
                <div style={{
                  width: "36px", height: "36px", minWidth: "36px",
                  background: "var(--primary)", color: "white", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  ...fr(700, "16px"),
                }}>
                  {i + 1}
                </div>
                <div>
                  <h3 style={{ ...fr(700, "15px"), color: "var(--text-dark)", marginBottom: "6px" }}>{label}</h3>
                  <p style={{ ...fr(400, "14px"), color: "var(--text-light)", lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cara Pakai */}
      <section id="cara-pakai" style={{ background: "var(--bg-card)", padding: "64px 32px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h2 style={{ ...fc(700, "28px"), color: "var(--text-dark)", textAlign: "center", marginBottom: "48px" }}>
            Cara Menggunakan
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              { step: "1", title: "Daftar & Login", desc: "Buat akun guru. Setelah disetujui admin, login ke dashboard." },
              { step: "2", title: "Buat Sesi Baru", desc: "Beri nama sesi, atur durasi tampil tiap slide dan jeda antar slide." },
              { step: "3", title: "Tambahkan Slide", desc: "Upload gambar dari Google Drive atau ketik teks langsung. Susun urutannya sesuai kebutuhan." },
              { step: "4", title: "Aktifkan & Bagikan", desc: "Aktifkan sesi lalu salin link murid. Bagikan ke layar kelas atau kirim ke orang tua." },
              { step: "5", title: "Murid Buka Link", desc: "Murid buka link di browser. Sesi berjalan otomatis — countdown, slide per slide, selesai." },
            ].map(({ step, title, desc }, i, arr) => (
              <div key={step} style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: "40px", height: "40px", minWidth: "40px",
                    background: "var(--primary)", color: "white",
                    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    ...fc(700, "16px"),
                  }}>
                    {step}
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: "2px", flex: 1, minHeight: "32px", background: "var(--border)", margin: "4px 0" }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < arr.length - 1 ? "32px" : "0", paddingTop: "8px" }}>
                  <h3 style={{ ...fr(700, "15px"), color: "var(--text-dark)", marginBottom: "4px" }}>{title}</h3>
                  <p style={{ ...fr(400, "14px"), color: "var(--text-light)", lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section style={{ padding: "64px 32px", textAlign: "center" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2 style={{ ...fc(700, "28px"), color: "var(--text-dark)", marginBottom: "12px" }}>
            Siap mulai mengajar?
          </h2>
          <p style={{ ...fr(400, "16px"), color: "var(--text-light)", marginBottom: "32px" }}>
            Buat sesi pertama kamu sekarang. Gratis, langsung pakai.
          </p>
          <a
            href="/login"
            style={{
              ...fr(600, "16px"), color: "white",
              background: "var(--primary)", padding: "14px 40px",
              borderRadius: "10px", textDecoration: "none",
              display: "inline-block",
            }}
          >
            Masuk ke Dashboard
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "24px 32px",
        textAlign: "center",
      }}>
        <p style={{ ...fr(400, "13px"), color: "var(--text-light)" }}>
          © 2026 Kilat Baca
        </p>
      </footer>

    </div>
  );
}
