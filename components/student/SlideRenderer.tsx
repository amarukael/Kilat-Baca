"use client";

import type { PublicSlide } from "@/lib/types";
import CountdownTimer from "./CountdownTimer";

const fc = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-comfortaa), cursive", fontWeight: w, fontSize: s,
});

interface Props {
  slide: PublicSlide;
  secondsLeft: number;
  showTimer: boolean;
}

export default function SlideRenderer({ slide, secondsLeft, showTimer }: Props) {
  // Hitung font size dinamis berdasarkan panjang text
  const getResponsiveFontSize = (text: string): string => {
    const length = text.length;
    if (length < 30) return "clamp(48px, 10vw, 72px)";
    if (length < 60) return "clamp(40px, 8vw, 64px)";
    if (length < 100) return "clamp(32px, 7vw, 56px)";
    if (length < 150) return "clamp(28px, 6vw, 48px)";
    return "clamp(24px, 5vw, 40px)";
  };

  if (slide.type === "text") {
    const fontSize = getResponsiveFontSize(slide.contentText || "");
    
    return (
      <div 
        data-testid="slide-renderer-text" 
        style={{ 
          textAlign: "center", 
          padding: "clamp(16px, 4vh, 48px) clamp(24px, 5vw, 48px)",
          maxWidth: "min(90vw, 700px)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          overflow: "auto"
        }}
      >
        <p style={{ 
          ...fc(700, fontSize), 
          color: "var(--text-dark)", 
          margin: 0, 
          lineHeight: 1.3, 
          letterSpacing: "0.02em",
          wordWrap: "break-word",
          overflowWrap: "break-word"
        }}>
          {slide.contentText}
        </p>
        {showTimer && (
          <div style={{ marginTop: "clamp(16px, 3vh, 32px)" }}>
            <CountdownTimer seconds={secondsLeft} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div data-testid="slide-renderer-image" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", padding: "16px" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-testid="slide-renderer-image-element"
        src={slide.imageUrl}
        alt={slide.imageLabel ?? ""}
        style={{ maxWidth: "min(80vw, 500px)", maxHeight: "55vh", objectFit: "contain", borderRadius: "12px" }}
      />
      {slide.imageLabel && (
        <p style={{ ...fc(700, "clamp(24px, 6vw, 52px)"), color: "var(--text-dark)", margin: 0 }}>
          {slide.imageLabel}
        </p>
      )}
      {showTimer && <CountdownTimer seconds={secondsLeft} />}
    </div>
  );
}
