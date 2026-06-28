"use client";

import { useRef } from "react";
import type { Slide } from "@/lib/types";
import { fr, fc } from "@/lib/styles";

export type SlideFormData = {
  type: "text" | "image";
  contentText: string;
  imageUrl: string;
  imageLabel: string;
  customDuration: string;
  customGap: string;
};

interface SlideModalProps {
  editingSlide: Slide | null;
  slideForm: SlideFormData;
  slideSaving: boolean;
  uploadLoading: boolean;
  defaultDuration: number;
  defaultGap: number;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (patch: Partial<SlideFormData>) => void;
  onUploadImage: (file: File) => void;
}

export default function SlideModal({
  editingSlide,
  slideForm,
  slideSaving,
  uploadLoading,
  defaultDuration,
  defaultGap,
  onClose,
  onSubmit,
  onFormChange,
  onUploadImage,
}: SlideModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div data-testid="slide-modal-overlay" className="modal-overlay" onClick={onClose}>
      <div
        data-testid="slide-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}
      >
        <h2 style={{ ...fc(700, "18px"), color: "var(--text-dark)", marginBottom: "20px" }}>
          {editingSlide ? "Edit Slide" : "Tambah Slide"}
        </h2>
        <form data-testid="slide-form" onSubmit={onSubmit}>
          {!editingSlide && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              {(["text", "image"] as const).map((t) => (
                <button
                  key={t} type="button"
                  data-testid={`slide-type-button-${t}`}
                  onClick={() => onFormChange({ type: t })}
                  style={{
                    flex: 1, padding: "10px", border: `2px solid ${slideForm.type === t ? "var(--primary)" : "var(--border)"}`,
                    borderRadius: "8px", cursor: "pointer", ...fr(600, "13px"),
                    background: slideForm.type === t ? "rgba(91,141,238,0.08)" : "var(--bg-light)",
                    color: slideForm.type === t ? "var(--primary)" : "var(--text-dark)",
                  }}
                >
                  {t === "text" ? "📝 Teks" : "🖼️ Gambar"}
                </button>
              ))}
            </div>
          )}

          {slideForm.type === "text" ? (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "6px" }}>Teks Slide</label>
              <textarea
                data-testid="slide-text-input"
                required value={slideForm.contentText}
                onChange={(e) => onFormChange({ contentText: e.target.value })}
                rows={3}
                style={{ width: "100%", padding: "12px", border: "1px solid var(--border)", borderRadius: "8px", ...fr(400, "14px"), background: "var(--bg-light)", color: "var(--text-dark)", resize: "vertical" }}
              />
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "6px" }}>Gambar</label>
                {slideForm.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slideForm.imageUrl} alt="preview" style={{ width: "100%", maxHeight: "160px", objectFit: "contain", borderRadius: "8px", marginBottom: "8px", border: "1px solid var(--border)" }} />
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadImage(f); }}
                />
                <button
                  data-testid="slide-upload-button"
                  type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadLoading}
                  style={{ width: "100%", padding: "10px", background: "var(--bg-light)", border: "1px dashed var(--border)", borderRadius: "8px", cursor: "pointer", ...fr(500, "13px"), color: "var(--text-light)" }}
                >
                  {uploadLoading ? "Mengupload..." : slideForm.imageUrl ? "Ganti Gambar" : "Pilih Gambar"}
                </button>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "6px" }}>Label Gambar (opsional)</label>
                <input
                  data-testid="slide-image-label-input"
                  type="text" value={slideForm.imageLabel}
                  onChange={(e) => onFormChange({ imageLabel: e.target.value })}
                  placeholder="Misal: Huruf A, Apel"
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", ...fr(400, "13px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
                />
              </div>
            </>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "6px" }}>Durasi khusus (dtk)</label>
              <input
                data-testid="slide-custom-duration-input"
                type="number" min={1} max={1800} value={slideForm.customDuration}
                onChange={(e) => onFormChange({ customDuration: e.target.value })}
                placeholder={`Default: ${defaultDuration}dtk`}
                style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", ...fr(400, "13px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "6px" }}>Jeda khusus (dtk)</label>
              <input
                data-testid="slide-custom-gap-input"
                type="number" min={0} max={600} value={slideForm.customGap}
                onChange={(e) => onFormChange({ customGap: e.target.value })}
                placeholder={`Default: ${defaultGap}dtk`}
                style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", ...fr(400, "13px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              data-testid="slide-modal-cancel-button"
              type="button" onClick={onClose}
              style={{ flex: 1, padding: "12px", background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", ...fr(500, "14px"), color: "var(--text-dark)" }}
            >
              Batal
            </button>
            <button
              data-testid="slide-modal-save-button"
              type="submit" disabled={slideSaving || (slideForm.type === "image" && !slideForm.imageUrl)}
              style={{ flex: 1, padding: "12px", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", ...fr(600, "14px"), opacity: slideSaving ? 0.7 : 1 }}
            >
              {slideSaving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
