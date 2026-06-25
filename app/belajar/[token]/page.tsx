"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import type { PublicSession, PublicSlide } from "@/lib/types";

const fc = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-comfortaa), cursive", fontWeight: w, fontSize: s,
});
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

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = "idle" | "playing" | "gap" | "done";

export default function StudentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [session, setSession] = useState<PublicSession | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Playback state
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const playSlidesRef = useRef<PublicSlide[]>([]);
  const showSlideRef = useRef<(idx: number) => void>(null!);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const showSlide = useCallback((idx: number) => {
    const slides = playSlidesRef.current;
    if (idx >= slides.length) {
      clearTimers();
      setPhase("done");
      setCurrentIndex(0);
      return;
    }

    const slide = slides[idx];
    setCurrentIndex(idx);
    setPhase("playing");
    setSecondsLeft(slide.duration);

    clearTimers();

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current!);
      const gap = slide.gap;
      if (gap > 0) {
        setPhase("gap");
        setSecondsLeft(gap);
        intervalRef.current = setInterval(() => {
          setSecondsLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
        timerRef.current = setTimeout(() => {
          clearInterval(intervalRef.current!);
          showSlideRef.current(idx + 1);
        }, gap * 1000);
      } else {
        showSlideRef.current(idx + 1);
      }
    }, slide.duration * 1000);
  }, []);

  showSlideRef.current = showSlide;

  const startSession = () => {
    if (!session) return;
    const slides = session.shuffleEnabled ? fisherYates(session.slides) : [...session.slides];
    playSlidesRef.current = slides;
    showSlideRef.current(0);
  };

  const stopSession = () => {
    clearTimers();
    setPhase("idle");
    setCurrentIndex(0);
    playSlidesRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const currentSlide = playSlidesRef.current[currentIndex];

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

  // Idle / done screen
  if (phase === "idle" || phase === "done") {
    return (
      <div style={{ ...LIGHT_VARS, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-light)", padding: "24px" }}>
        <div style={{ background: "var(--bg-card)", borderRadius: "20px", padding: "48px 40px", maxWidth: "440px", width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
          {phase === "done" ? (
            <>
              <div style={{ fontSize: "72px", marginBottom: "16px" }}>🎉</div>
              <h1 style={{ ...fc(700, "26px"), color: "var(--primary)", marginBottom: "8px" }}>Selesai!</h1>
              <p style={{ ...fr(400, "15px"), color: "var(--text-light)", marginBottom: "32px" }}>
                Kamu sudah melihat semua {playSlidesRef.current.length} slide. Bagus sekali!
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
            onClick={startSession}
            style={{ padding: "16px 48px", background: "var(--primary)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", ...fc(700, "18px") }}
          >
            {phase === "done" ? "Ulangi" : "Mulai Belajar"}
          </button>
        </div>
      </div>
    );
  }

  // Playing / gap
  return (
    <div
      style={{ ...LIGHT_VARS, position: "fixed", inset: 0, background: phase === "gap" ? "var(--bg-light)" : "var(--bg-card)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
    >
      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
        <button
          onClick={stopSession}
          style={{ padding: "8px 16px", background: "rgba(0,0,0,0.06)", border: "none", borderRadius: "8px", cursor: "pointer", ...fr(500, "13px"), color: "var(--text-dark)" }}
        >
          ✕ Berhenti
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ ...fr(400, "13px"), color: "var(--text-light)" }}>
            {currentIndex + 1} / {playSlidesRef.current.length}
          </span>
          <button
            onClick={toggleFullscreen}
            style={{ padding: "8px 12px", background: "rgba(0,0,0,0.06)", border: "none", borderRadius: "8px", cursor: "pointer", ...fr(500, "13px"), color: "var(--text-dark)" }}
          >
            {isFullscreen ? "⊡" : "⛶"}
          </button>
        </div>
      </div>

      {/* Slide content */}
      {phase === "gap" ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--bg-light)", border: "2px solid var(--border)", margin: "0 auto 16px" }} />
          {session.showSecondsTimer && (
            <span style={{ ...fr(600, "20px"), color: "var(--text-light)" }}>{secondsLeft}</span>
          )}
        </div>
      ) : currentSlide?.type === "text" ? (
        <div style={{ textAlign: "center", padding: "32px 48px", maxWidth: "700px" }}>
          <p style={{ ...fc(700, "clamp(32px, 8vw, 72px)"), color: "var(--text-dark)", margin: 0, lineHeight: 1.2, letterSpacing: "0.02em" }}>
            {currentSlide.contentText}
          </p>
          {session.showSecondsTimer && (
            <div style={{ marginTop: "32px", ...fr(600, "18px"), color: "var(--text-light)" }}>{secondsLeft}</div>
          )}
        </div>
      ) : currentSlide?.type === "image" ? (
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", padding: "16px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentSlide.imageUrl}
            alt={currentSlide.imageLabel ?? ""}
            style={{ maxWidth: "min(80vw, 500px)", maxHeight: "55vh", objectFit: "contain", borderRadius: "12px" }}
          />
          {currentSlide.imageLabel && (
            <p style={{ ...fc(700, "clamp(24px, 6vw, 52px)"), color: "var(--text-dark)", margin: 0 }}>
              {currentSlide.imageLabel}
            </p>
          )}
          {session.showSecondsTimer && (
            <span style={{ ...fr(600, "18px"), color: "var(--text-light)" }}>{secondsLeft}</span>
          )}
        </div>
      ) : null}

      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: "var(--border)" }}>
        <div
          style={{
            height: "100%",
            background: "var(--primary)",
            width: `${((currentIndex + 1) / playSlidesRef.current.length) * 100}%`,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
