"use client";

import { useState, useEffect } from "react";
import type { PublicSession } from "@/lib/types";

import { fr, fc } from "@/lib/styles";

interface Props {
  session: PublicSession;
  isDone: boolean;
  totalSlides: number;
  onStart: () => void;
}

export default function WaitingScreen({ session, isDone, totalSlides, onStart }: Props) {
  const [imagesReady, setImagesReady] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalImages, setTotalImages] = useState(0);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isDone) {
      setImagesReady(true);
      return;
    }

    const imageSlides = session.slides.filter(
      (s) => s.type === "image" && s.imageUrl
    );

    if (imageSlides.length === 0) {
      setImagesReady(true);
      return;
    }

    setTotalImages(imageSlides.length);
    setLoadedCount(0);
    setImagesReady(false);

    let settled = 0;
    imageSlides.forEach((slide) => {
      const img = new window.Image();
      img.onload = img.onerror = () => {
        settled += 1;
        setLoadedCount(settled);
        if (settled === imageSlides.length) {
          setImagesReady(true);
        }
      };
      img.src = slide.imageUrl!;
    });
  }, [session, isDone]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isProcessing = !isDone && !imagesReady;

  return (
    <div data-testid="waiting-screen" style={{ background: "var(--bg-card)", borderRadius: "20px", padding: "48px 40px", maxWidth: "440px", width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
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
          {isProcessing && (
            <p style={{ ...fr(400, "13px"), color: "var(--text-light)", marginBottom: "16px" }}>
              Menyiapkan gambar... {loadedCount}/{totalImages}
            </p>
          )}
        </>
      )}
      <button
        data-testid="waiting-screen-start-button"
        onClick={imagesReady ? onStart : undefined}
        disabled={isProcessing}
        style={{
          padding: "16px 48px",
          background: isProcessing ? "var(--border)" : "var(--primary)",
          color: isProcessing ? "var(--text-light)" : "white",
          border: "none",
          borderRadius: "12px",
          cursor: isProcessing ? "not-allowed" : "pointer",
          ...fc(700, "18px"),
          transition: "background 0.2s, color 0.2s",
        }}
      >
        {isProcessing ? "Sedang Memproses..." : isDone ? "Ulangi" : "Mulai Belajar"}
      </button>
    </div>
  );
}
