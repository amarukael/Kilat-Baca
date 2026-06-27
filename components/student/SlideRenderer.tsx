"use client";

import type { PublicSlide } from "@/lib/types";

import { fc } from "@/lib/styles";

interface Props {
  slide: PublicSlide;
}

export default function SlideRenderer({ slide }: Props) {

  if (slide.type === "text") {
    const text = slide.contentText || "";
    const lines = text.split('\n');
    const totalLength = text.length;
    
    // Hitung font size dinamis berdasarkan panjang text dan jumlah baris
    const getFontSize = (): string => {
      // Jika banyak baris, kurangi font size
      if (lines.length > 8) return "clamp(20px, 4vw, 32px)";
      if (lines.length > 5) return "clamp(24px, 5vw, 40px)";
      if (lines.length > 3) return "clamp(28px, 6vw, 48px)";
      
      // Berdasarkan panjang total
      if (totalLength < 30) return "clamp(48px, 10vw, 72px)";
      if (totalLength < 60) return "clamp(40px, 8vw, 64px)";
      if (totalLength < 100) return "clamp(32px, 7vw, 56px)";
      if (totalLength < 150) return "clamp(28px, 6vw, 48px)";
      return "clamp(24px, 5vw, 40px)";
    };
    
    const fontSize = getFontSize();
    
    return (
      <div 
        data-testid="slide-renderer-text" 
        style={{ 
          textAlign: "center", 
          padding: "clamp(16px, 4vh, 48px) clamp(24px, 5vw, 48px)",
          maxWidth: "min(90vw, 1200px)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "auto"
        }}
      >
        <div style={{ 
          ...fc(700, fontSize), 
          color: "var(--text-dark)", 
          margin: "auto 0", 
          lineHeight: 1.4, 
          letterSpacing: "0.02em",
          wordWrap: "break-word",
          overflowWrap: "break-word",
          whiteSpace: "pre-wrap"
        }}>
          {text}
        </div>

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
        style={{ maxWidth: "min(85vw, 900px)", maxHeight: "65vh", objectFit: "contain", borderRadius: "12px" }}
      />
      {slide.imageLabel && (
        <p style={{ ...fc(700, "clamp(24px, 6vw, 52px)"), color: "var(--text-dark)", margin: 0 }}>
          {slide.imageLabel}
        </p>
      )}

    </div>
  );
}
