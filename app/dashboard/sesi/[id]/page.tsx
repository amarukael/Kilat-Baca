"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Session, Slide } from "@/lib/types";
import SessionEditor from "@/components/teacher/SessionEditor";
import SlideCard from "@/components/teacher/SlideCard";

const fr = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-raleway), sans-serif", fontWeight: w, fontSize: s,
});
const fc = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-comfortaa), cursive", fontWeight: w, fontSize: s,
});

type SlideFormData = {
  type: "text" | "image";
  contentText: string;
  imageUrl: string;
  imageLabel: string;
  customDuration: string;
  customGap: string;
};

function emptyForm(): SlideFormData {
  return { type: "text", contentText: "", imageUrl: "", imageLabel: "", customDuration: "", customGap: "" };
}

export default function SessionEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [title, setTitle] = useState("");
  const [defaultDuration, setDefaultDuration] = useState(3);
  const [defaultGap, setDefaultGap] = useState(1);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [showSecondsTimer, setShowSecondsTimer] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const [showSlideModal, setShowSlideModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [slideForm, setSlideForm] = useState<SlideFormData>(emptyForm());
  const [uploadLoading, setUploadLoading] = useState(false);
  const [slideSaving, setSlideSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (!res.ok) { router.push("/dashboard"); return; }
    const data = await res.json() as { session: Session };
    const s = data.session;
    setSession(s);
    setTitle(s.title);
    setDefaultDuration(s.defaultDuration);
    setDefaultGap(s.defaultGap);
    setShuffleEnabled(s.shuffleEnabled);
    setShowSecondsTimer(s.showSecondsTimer);
    setIsActive(s.isActive);
    setLoading(false);
  }, [sessionId, router]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  const saveSettings = useCallback(async (patch: Partial<{
    title: string; defaultDuration: number; defaultGap: number;
    shuffleEnabled: boolean; showSecondsTimer: boolean; isActive: boolean;
  }>) => {
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSession((prev) => prev ? { ...prev, ...patch } : prev);
  }, [sessionId]);

  const debounceSave = useCallback((patch: Parameters<typeof saveSettings>[0]) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    setSaveTimeout(setTimeout(() => saveSettings(patch), 700));
  }, [saveTimeout, saveSettings]);

  const sorted = session ? [...session.slides].sort((a, b) => a.orderIndex - b.orderIndex) : [];

  const openAddSlide = () => {
    setEditingSlide(null);
    setSlideForm(emptyForm());
    setShowSlideModal(true);
  };

  const openEditSlide = (slide: Slide) => {
    setEditingSlide(slide);
    setSlideForm({
      type: slide.type,
      contentText: slide.contentText ?? "",
      imageUrl: slide.imageUrl ?? "",
      imageLabel: slide.imageLabel ?? "",
      customDuration: slide.customDuration != null ? String(slide.customDuration) : "",
      customGap: slide.customGap != null ? String(slide.customGap) : "",
    });
    setShowSlideModal(true);
  };

  const uploadImage = async (file: File) => {
    setUploadLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    setUploadLoading(false);
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      showToast(d.error ?? "Gagal upload gambar");
      return;
    }
    const d = await res.json() as { url: string };
    setSlideForm((prev) => ({ ...prev, imageUrl: d.url }));
  };

  const saveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlideSaving(true);

    const body: Record<string, unknown> = {
      type: slideForm.type,
      ...(slideForm.type === "text" && { contentText: slideForm.contentText }),
      ...(slideForm.type === "image" && { imageUrl: slideForm.imageUrl, imageLabel: slideForm.imageLabel }),
      ...(slideForm.customDuration !== "" && { customDuration: Number(slideForm.customDuration) }),
      ...(slideForm.customGap !== "" && { customGap: Number(slideForm.customGap) }),
    };

    let res: Response;
    if (editingSlide) {
      res = await fetch(`/api/slides/${editingSlide.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
    } else {
      res = await fetch(`/api/sessions/${sessionId}/slides`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
    }

    setSlideSaving(false);
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      showToast(d.error ?? "Gagal menyimpan slide");
      return;
    }
    showToast(editingSlide ? "Slide diperbarui" : "Slide ditambahkan");
    setShowSlideModal(false);
    fetchSession();
  };

  const deleteSlide = async (slideId: string) => {
    if (!confirm("Hapus slide ini?")) return;
    const res = await fetch(`/api/slides/${slideId}`, { method: "DELETE" });
    if (res.ok) { showToast("Slide dihapus"); fetchSession(); }
  };

  const moveSlide = async (index: number, direction: -1 | 1) => {
    const newSorted = [...sorted];
    const target = index + direction;
    if (target < 0 || target >= newSorted.length) return;
    [newSorted[index], newSorted[target]] = [newSorted[target], newSorted[index]];
    await fetch(`/api/sessions/${sessionId}/slides`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slideIds: newSorted.map((s) => s.id) }),
    });
    fetchSession();
  };

  const studentUrl = typeof window !== "undefined" && session
    ? `${window.location.origin}/belajar/${session.shareToken}`
    : session ? `/belajar/${session.shareToken}` : "";

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "80px" }}>
        <span style={{ ...fr(400, "16px"), color: "var(--text-light)" }}>Memuat...</span>
      </div>
    );
  }

  if (!session) return null;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
        <button
          data-testid="editor-back-button"
          onClick={() => router.push("/dashboard")}
          style={{ padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", ...fr(500, "13px"), color: "var(--text-dark)" }}
        >
          ← Kembali
        </button>
        <h1 style={{ ...fc(700, "22px"), color: "var(--text-dark)", margin: 0, flex: 1 }}>{title}</h1>
        <span
          data-testid="editor-toggle-active"
          onClick={async () => { await saveSettings({ isActive: !isActive }); setIsActive(!isActive); }}
          style={{
            cursor: "pointer", padding: "6px 14px", borderRadius: "20px", ...fr(600, "13px"),
            background: isActive ? "rgba(107,207,127,0.15)" : "rgba(156,163,175,0.15)",
            color: isActive ? "var(--accent)" : "var(--text-light)",
          }}
        >
          {isActive ? "● Aktif" : "○ Nonaktif"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px", alignItems: "start" }}>
        <SessionEditor
          title={title}
          defaultDuration={defaultDuration}
          defaultGap={defaultGap}
          shuffleEnabled={shuffleEnabled}
          showSecondsTimer={showSecondsTimer}
          isActive={isActive}
          studentUrl={studentUrl}
          onTitleChange={(v) => { setTitle(v); debounceSave({ title: v }); }}
          onDurationChange={(v) => { setDefaultDuration(v); debounceSave({ defaultDuration: v }); }}
          onGapChange={(v) => { setDefaultGap(v); debounceSave({ defaultGap: v }); }}
          onShuffleChange={(v) => { setShuffleEnabled(v); saveSettings({ shuffleEnabled: v }); }}
          onTimerChange={(v) => { setShowSecondsTimer(v); saveSettings({ showSecondsTimer: v }); }}
          onCopyLink={() => { navigator.clipboard.writeText(studentUrl); showToast("Link disalin!"); }}
        />

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ ...fr(600, "15px"), color: "var(--text-dark)", margin: 0 }}>Slide ({sorted.length})</h2>
            <button
              data-testid="add-slide-button"
              onClick={openAddSlide}
              style={{ padding: "8px 16px", background: "var(--accent)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", ...fr(600, "13px") }}
            >
              + Tambah Slide
            </button>
          </div>

          {sorted.length === 0 ? (
            <div style={{ background: "var(--bg-card)", border: "2px dashed var(--border)", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📄</div>
              <p style={{ ...fr(400, "14px"), color: "var(--text-light)", margin: 0 }}>Belum ada slide. Tambahkan yang pertama!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {sorted.map((slide, idx) => (
                <SlideCard
                  key={slide.id}
                  slide={slide}
                  index={idx}
                  total={sorted.length}
                  onMoveUp={() => moveSlide(idx, -1)}
                  onMoveDown={() => moveSlide(idx, 1)}
                  onEdit={() => openEditSlide(slide)}
                  onDelete={() => deleteSlide(slide.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showSlideModal && (
        <div data-testid="slide-modal-overlay" className="modal-overlay" onClick={() => setShowSlideModal(false)}>
          <div
            data-testid="slide-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <h2 style={{ ...fc(700, "18px"), color: "var(--text-dark)", marginBottom: "20px" }}>
              {editingSlide ? "Edit Slide" : "Tambah Slide"}
            </h2>
            <form data-testid="slide-form" onSubmit={saveSlide}>
              {!editingSlide && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                  {(["text", "image"] as const).map((t) => (
                    <button
                      key={t} type="button"
                      data-testid={`slide-type-button-${t}`}
                      onClick={() => setSlideForm((prev) => ({ ...prev, type: t }))}
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
                    onChange={(e) => setSlideForm((prev) => ({ ...prev, contentText: e.target.value }))}
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
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }}
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
                      onChange={(e) => setSlideForm((prev) => ({ ...prev, imageLabel: e.target.value }))}
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
                    type="number" min={1} max={60} value={slideForm.customDuration}
                    onChange={(e) => setSlideForm((prev) => ({ ...prev, customDuration: e.target.value }))}
                    placeholder={`Default: ${defaultDuration}dtk`}
                    style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", ...fr(400, "13px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "6px" }}>Jeda khusus (dtk)</label>
                  <input
                    data-testid="slide-custom-gap-input"
                    type="number" min={0} max={10} value={slideForm.customGap}
                    onChange={(e) => setSlideForm((prev) => ({ ...prev, customGap: e.target.value }))}
                    placeholder={`Default: ${defaultGap}dtk`}
                    style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", ...fr(400, "13px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  data-testid="slide-modal-cancel-button"
                  type="button" onClick={() => setShowSlideModal(false)}
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
      )}

      {toast && <div className="toast" style={{ ...fr(500, "14px") }}>{toast}</div>}
    </>
  );
}
