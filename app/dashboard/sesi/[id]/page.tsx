"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Session, Slide } from "@/lib/types";

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

  // Settings edit state
  const [title, setTitle] = useState("");
  const [defaultDuration, setDefaultDuration] = useState(3);
  const [defaultGap, setDefaultGap] = useState(1);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [showSecondsTimer, setShowSecondsTimer] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Slide modal state
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

  // Auto-save settings with debounce
  const saveSettings = useCallback(async (patch: Partial<{ title: string; defaultDuration: number; defaultGap: number; shuffleEnabled: boolean; showSecondsTimer: boolean; isActive: boolean }>) => {
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      res = await fetch(`/api/sessions/${sessionId}/slides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    if (res.ok) {
      showToast("Slide dihapus");
      fetchSession();
    }
  };

  const moveSlide = async (index: number, direction: -1 | 1) => {
    const newSorted = [...sorted];
    const target = index + direction;
    if (target < 0 || target >= newSorted.length) return;
    [newSorted[index], newSorted[target]] = [newSorted[target], newSorted[index]];
    const slideIds = newSorted.map((s) => s.id);
    await fetch(`/api/sessions/${sessionId}/slides`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slideIds }),
    });
    fetchSession();
  };

  const studentUrl = typeof window !== "undefined" && session
    ? `${window.location.origin}/belajar/${session.shareToken}`
    : session ? `/belajar/${session.shareToken}` : "";

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", paddingTop: "80px" }}><span style={{ ...fr(400, "16px"), color: "var(--text-light)" }}>Memuat...</span></div>;
  }

  if (!session) return null;

  return (
    <>
      {/* Back + title */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{ padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", ...fr(500, "13px"), color: "var(--text-dark)" }}
        >
          ← Kembali
        </button>
        <h1 style={{ ...fc(700, "22px"), color: "var(--text-dark)", margin: 0, flex: 1 }}>{title}</h1>
        <span
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
        {/* Settings panel */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2 style={{ ...fr(600, "15px"), color: "var(--text-dark)", margin: 0 }}>Pengaturan Sesi</h2>

          <div>
            <label style={{ display: "block", ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "6px" }}>Nama Sesi</label>
            <input
              type="text" value={title}
              onChange={(e) => { setTitle(e.target.value); debounceSave({ title: e.target.value }); }}
              style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", ...fr(400, "13px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "6px" }}>Durasi (dtk)</label>
              <input
                type="number" min={1} max={60} value={defaultDuration}
                onChange={(e) => { const v = Number(e.target.value); setDefaultDuration(v); debounceSave({ defaultDuration: v }); }}
                style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", ...fr(400, "13px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "6px" }}>Jeda (dtk)</label>
              <input
                type="number" min={0} max={10} value={defaultGap}
                onChange={(e) => { const v = Number(e.target.value); setDefaultGap(v); debounceSave({ defaultGap: v }); }}
                style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", ...fr(400, "13px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
              />
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox" checked={shuffleEnabled}
              onChange={(e) => { setShuffleEnabled(e.target.checked); saveSettings({ shuffleEnabled: e.target.checked }); }}
            />
            <span style={{ ...fr(500, "13px"), color: "var(--text-dark)" }}>Acak urutan slide</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox" checked={showSecondsTimer}
              onChange={(e) => { setShowSecondsTimer(e.target.checked); saveSettings({ showSecondsTimer: e.target.checked }); }}
            />
            <span style={{ ...fr(500, "13px"), color: "var(--text-dark)" }}>Tampilkan timer hitungan mundur</span>
          </label>

          {isActive && (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
              <p style={{ ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "8px" }}>Link Murid</p>
              <div style={{ background: "var(--bg-light)", borderRadius: "8px", padding: "8px 10px", marginBottom: "8px" }}>
                <span style={{ ...fr(400, "11px"), color: "var(--text-dark)", wordBreak: "break-all" }}>{studentUrl}</span>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(studentUrl); showToast("Link disalin!"); }}
                style={{ width: "100%", padding: "8px", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", ...fr(600, "12px") }}
              >
                Salin Link
              </button>
            </div>
          )}
        </div>

        {/* Slides panel */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ ...fr(600, "15px"), color: "var(--text-dark)", margin: 0 }}>Slide ({sorted.length})</h2>
            <button
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
                <div
                  key={slide.id}
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <button
                      onClick={() => moveSlide(idx, -1)}
                      disabled={idx === 0}
                      style={{ padding: "2px 8px", background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: "4px", cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1, ...fr(500, "12px") }}
                    >▲</button>
                    <button
                      onClick={() => moveSlide(idx, 1)}
                      disabled={idx === sorted.length - 1}
                      style={{ padding: "2px 8px", background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: "4px", cursor: idx === sorted.length - 1 ? "not-allowed" : "pointer", opacity: idx === sorted.length - 1 ? 0.3 : 1, ...fr(500, "12px") }}
                    >▼</button>
                  </div>

                  <span style={{ ...fr(500, "12px"), color: "var(--text-light)", minWidth: "24px", textAlign: "center" }}>{idx + 1}</span>

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
                      onClick={() => openEditSlide(slide)}
                      style={{ padding: "6px 12px", background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer", ...fr(500, "12px"), color: "var(--text-dark)" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteSlide(slide.id)}
                      style={{ padding: "6px 12px", background: "transparent", border: "1px solid var(--danger)", borderRadius: "6px", cursor: "pointer", ...fr(500, "12px"), color: "var(--danger)" }}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slide modal */}
      {showSlideModal && (
        <div className="modal-overlay" onClick={() => setShowSlideModal(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <h2 style={{ ...fc(700, "18px"), color: "var(--text-dark)", marginBottom: "20px" }}>
              {editingSlide ? "Edit Slide" : "Tambah Slide"}
            </h2>
            <form onSubmit={saveSlide}>
              {!editingSlide && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                  {(["text", "image"] as const).map((t) => (
                    <button
                      key={t} type="button"
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
                      type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadLoading}
                      style={{ width: "100%", padding: "10px", background: "var(--bg-light)", border: "1px dashed var(--border)", borderRadius: "8px", cursor: "pointer", ...fr(500, "13px"), color: "var(--text-light)" }}
                    >
                      {uploadLoading ? "Mengupload..." : slideForm.imageUrl ? "Ganti Gambar" : "Pilih Gambar"}
                    </button>
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "6px" }}>Label Gambar (opsional)</label>
                    <input
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
                    type="number" min={1} max={60} value={slideForm.customDuration}
                    onChange={(e) => setSlideForm((prev) => ({ ...prev, customDuration: e.target.value }))}
                    placeholder={`Default: ${defaultDuration}dtk`}
                    style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", ...fr(400, "13px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "6px" }}>Jeda khusus (dtk)</label>
                  <input
                    type="number" min={0} max={10} value={slideForm.customGap}
                    onChange={(e) => setSlideForm((prev) => ({ ...prev, customGap: e.target.value }))}
                    placeholder={`Default: ${defaultGap}dtk`}
                    style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", ...fr(400, "13px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button" onClick={() => setShowSlideModal(false)}
                  style={{ flex: 1, padding: "12px", background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", ...fr(500, "14px"), color: "var(--text-dark)" }}
                >
                  Batal
                </button>
                <button
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
