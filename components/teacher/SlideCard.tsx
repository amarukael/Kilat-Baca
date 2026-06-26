"use client";

import type { Slide } from "@/lib/types";

const fr = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-raleway), sans-serif", fontWeight: w, fontSize: s,
});

interface Props {
  slide: Slide;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function SlideCard({ slide, index, total, onMoveUp, onMoveDown, onEdit, onDelete }: Props) {
  return (
    <div data-testid="slide-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <button
          data-testid="slide-card-move-up"
          onClick={onMoveUp} disabled={index === 0}
          style={{ padding: "2px 8px", background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: "4px", cursor: index === 0 ? "not-allowed" : "pointer", opacity: index === 0 ? 0.3 : 1, ...fr(500, "12px") }}
        >▲</button>
        <button
          data-testid="slide-card-move-down"
          onClick={onMoveDown} disabled={index === total - 1}
          style={{ padding: "2px 8px", background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: "4px", cursor: index === total - 1 ? "not-allowed" : "pointer", opacity: index === total - 1 ? 0.3 : 1, ...fr(500, "12px") }}
        >▼</button>
      </div>

      <span style={{ ...fr(500, "12px"), color: "var(--text-light)", minWidth: "24px", textAlign: "center" }}>{index + 1}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{
            padding: "2px 8px", borderRadius: "4px", ...fr(600, "11px"),
            background: slide.type === "text" ? "rgba(91,141,238,0.12)" : "rgba(107,207,127,0.12)",
            color: slide.type === "text" ? "var(--primary)" : "var(--accent)",
          }}>
            {slide.type === "text" ? "TEKS" : "GAMBAR"}
          </span>
          {(slide.customDuration != null || slide.customGap != null) && (
            <span style={{ ...fr(400, "11px"), color: "var(--text-light)" }}>
              {slide.customDuration != null ? `${slide.customDuration}dtk` : ""}
              {slide.customGap != null ? ` · jeda ${slide.customGap}dtk` : ""}
            </span>
          )}
        </div>
        {slide.type === "text" ? (
          <p style={{ ...fr(500, "14px"), color: "var(--text-dark)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {slide.contentText}
          </p>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.imageUrl} alt={slide.imageLabel ?? ""} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px", border: "1px solid var(--border)" }} />
            <span style={{ ...fr(400, "13px"), color: "var(--text-light)" }}>{slide.imageLabel || "Tanpa label"}</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button
          data-testid="slide-card-edit-button"
          onClick={onEdit}
          style={{ padding: "6px 12px", background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer", ...fr(500, "12px"), color: "var(--text-dark)" }}
        >Edit</button>
        <button
          data-testid="slide-card-delete-button"
          onClick={onDelete}
          style={{ padding: "6px 12px", background: "transparent", border: "1px solid var(--danger)", borderRadius: "6px", cursor: "pointer", ...fr(500, "12px"), color: "var(--danger)" }}
        >Hapus</button>
      </div>
    </div>
  );
}
