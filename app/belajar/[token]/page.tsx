"use client";

import { use, useEffect, useState } from "react";
import type { PublicSession } from "@/lib/types";
import { useSessionPlayer } from "@/hooks/useSessionPlayer";
import WaitingScreen from "@/components/student/WaitingScreen";
import GapScreen from "@/components/student/GapScreen";
import SlideRenderer from "@/components/student/SlideRenderer";
import ReadingTimer from "@/components/student/ReadingTimer";

const fr = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-raleway), sans-serif", fontWeight: w, fontSize: s,
});

// Force light mode on student view — override html.dark variables
const LIGHT_VARS: React.CSSProperties = {
  "--primary": "#5B8DEE",
  "--primary-light": "#8AAFFF",
  "--accent": "#6BCF7F",
  "--accent-light": "#A3E9B5",
  "--warning": "#FFD666",
  "--danger": "#FF7875",
  "--text-dark": "#1F2937",
  "--text-light": "#9CA3AF",
  "--bg-light": "#F9FAFB",
  "--bg-card": "#FFFFFF",
  "--border": "#E5E7EB",
  "--success": "#52C41A",
} as React.CSSProperties;

export default function StudentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [session, setSession] = useState<PublicSession | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const {
    phase, currentIndex, secondsLeft, isFullscreen,
    currentSlide, totalSlides,
    startSession, stopSession, toggleFullscreen,
  } = useSessionPlayer(session);

  useEffect(() => {
    fetch(`/api/public/session/${token}`)
      .then(async (res) => {
        if (!res.ok) { setError("Sesi tidak ditemukan atau tidak aktif."); return; }
        const data = await res.json() as { session: PublicSession };
        setSession(data.session);
      })
      .catch(() => setError("Gagal memuat sesi. Periksa koneksi internet."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div style={{ ...LIGHT_VARS, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-light)" }}>
        <span style={{ ...fr(400, "16px"), color: "var(--text-light)" }}>Memuat sesi...</span>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ ...LIGHT_VARS, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-light)", flexDirection: "column", gap: "16px", padding: "24px" }}>
        <div style={{ fontSize: "64px" }}>😕</div>
        <p style={{ ...fr(500, "16px"), color: "var(--text-dark)", textAlign: "center" }}>{error || "Sesi tidak tersedia."}</p>
      </div>
    );
  }

  if (phase === "idle" || phase === "done") {
    return (
      <div style={{ ...LIGHT_VARS, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-light)", padding: "24px" }}>
        <WaitingScreen session={session} isDone={phase === "done"} totalSlides={totalSlides} onStart={startSession} />
      </div>
    );
  }

  return (
    <div style={{ ...LIGHT_VARS, position: "fixed", inset: 0, background: phase === "gap" ? "var(--bg-light)" : "var(--bg-card)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
        <button
          onClick={stopSession}
          style={{ padding: "8px 16px", background: "rgba(0,0,0,0.06)", border: "none", borderRadius: "8px", cursor: "pointer", ...fr(500, "13px"), color: "var(--text-dark)" }}
        >
          ✕ Berhenti
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ ...fr(400, "13px"), color: "var(--text-light)" }}>
            {currentIndex + 1} / {totalSlides}
          </span>
          <button
            onClick={toggleFullscreen}
            style={{ padding: "8px 12px", background: "rgba(0,0,0,0.06)", border: "none", borderRadius: "8px", cursor: "pointer", ...fr(500, "13px"), color: "var(--text-dark)" }}
          >
            {isFullscreen ? "⊡" : "⛶"}
          </button>
        </div>
      </div>

      {phase === "gap"
        ? <GapScreen secondsLeft={secondsLeft} showTimer={session.showSecondsTimer} />
        : currentSlide
          ? <SlideRenderer slide={currentSlide} secondsLeft={secondsLeft} showTimer={session.showSecondsTimer} />
          : null}

      <ReadingTimer
        secondsLeft={secondsLeft}
        duration={phase === "gap" ? (currentSlide?.gap ?? 0) : (currentSlide?.duration ?? 0)}
      />
    </div>
  );
}
