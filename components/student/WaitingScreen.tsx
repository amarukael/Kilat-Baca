"use client";

import type { PublicSession } from "@/lib/types";

const fc = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-comfortaa), cursive", fontWeight: w, fontSize: s,
});
const fr = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-raleway), sans-serif", fontWeight: w, fontSize: s,
});

interface Props {
  session: PublicSession;
  isDone: boolean;
  totalSlides: number;
  onStart: () => void;
}

export default function WaitingScreen({ session, isDone, totalSlides, onStart }: Props) {
  return (
    <div style={{ background: "var(--bg-card)", borderRadius: "20px", padding: "48px 40px", maxWidth: "440px", width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
      {isDone ? (
        <>
          <div style={{ fontSize: "72px", marginBottom: "16px" }}>🎉</div>
          <h1 style={{ ...fc(700, "26px"), color: "var(--primary)", marginBottom: "8px" }}>Selesai!</h1>
          <p style={{ ...fr(400, "15px"), color: "var(--text-light)", marginBottom: "32px" }}>
            Kamu sudah melihat semua {totalSlides} slide. Bagus sekali!
          </p>
        </>
      ) : (
        <>
          <div style={{ fontSize: "72px", marginBottom: "16px" }}>📚</div>
          <h1 style={{ ...fc(700, "26px"), color: "var(--primary)", marginBottom: "8px" }}>{session.title}</h1>
          <p style={{ ...fr(400, "15px"), color: "var(--text-light)", marginBottom: "32px" }}>
            {session.slides.length} slide · {session.defaultDuration} dtk/slide
            {session.shuffleEnabled ? " · acak" : ""}
          </p>
        </>
      )}
      <button
        onClick={onStart}
        style={{ padding: "16px 48px", background: "var(--primary)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", ...fc(700, "18px") }}
      >
        {isDone ? "Ulangi" : "Mulai Belajar"}
      </button>
    </div>
  );
}
