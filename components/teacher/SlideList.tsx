"use client";

import type { Slide } from "@/lib/types";
import SlideCard from "@/components/teacher/SlideCard";
import { fr } from "@/lib/styles";

interface SlideListProps {
  slides: Slide[];
  onAddSlide: () => void;
  onEditSlide: (slide: Slide) => void;
  onDeleteSlide: (slideId: string) => void;
  onMoveSlide: (index: number, direction: -1 | 1) => void;
}

export default function SlideList({
  slides,
  onAddSlide,
  onEditSlide,
  onDeleteSlide,
  onMoveSlide,
}: SlideListProps) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ ...fr(600, "15px"), color: "var(--text-dark)", margin: 0 }}>Slide ({slides.length})</h2>
        <button
          data-testid="add-slide-button"
          onClick={onAddSlide}
          style={{ padding: "8px 16px", background: "var(--accent)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", ...fr(600, "13px") }}
        >
          + Tambah Slide
        </button>
      </div>

      {slides.length === 0 ? (
        <div style={{ background: "var(--bg-card)", border: "2px dashed var(--border)", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📄</div>
          <p style={{ ...fr(400, "14px"), color: "var(--text-light)", margin: 0 }}>Belum ada slide. Tambahkan yang pertama!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {slides.map((slide, idx) => (
            <SlideCard
              key={slide.id}
              slide={slide}
              index={idx}
              total={slides.length}
              onMoveUp={() => onMoveSlide(idx, -1)}
              onMoveDown={() => onMoveSlide(idx, 1)}
              onEdit={() => onEditSlide(slide)}
              onDelete={() => onDeleteSlide(slide.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
