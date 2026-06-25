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
  if (slide.type === "text") {
    return (
      <div style={{ textAlign: "center", padding: "32px 48px", maxWidth: "700px" }}>
        <p style={{ ...fc(700, "clamp(32px, 8vw, 72px)"), color: "var(--text-dark)", margin: 0, lineHeight: 1.2, letterSpacing: "0.02em" }}>
          {slide.contentText}
        </p>
        {showTimer && (
          <div style={{ marginTop: "32px" }}>
            <CountdownTimer seconds={secondsLeft} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", padding: "16px" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
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
