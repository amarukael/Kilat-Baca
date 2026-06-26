"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Session, Slide } from "@/lib/types";
import SessionEditor from "@/components/teacher/SessionEditor";
import SlideList from "@/components/teacher/SlideList";
import SlideModal, { type SlideFormData } from "@/components/teacher/SlideModal";
import { fr, fc } from "@/lib/styles";

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

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

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

        <SlideList
          slides={sorted}
          onAddSlide={openAddSlide}
          onEditSlide={openEditSlide}
          onDeleteSlide={deleteSlide}
          onMoveSlide={moveSlide}
        />
      </div>

      {showSlideModal && (
        <SlideModal
          editingSlide={editingSlide}
          slideForm={slideForm}
          slideSaving={slideSaving}
          uploadLoading={uploadLoading}
          defaultDuration={defaultDuration}
          defaultGap={defaultGap}
          onClose={() => setShowSlideModal(false)}
          onSubmit={saveSlide}
          onFormChange={(patch) => setSlideForm((prev) => ({ ...prev, ...patch }))}
          onUploadImage={uploadImage}
        />
      )}

      {toast && <div className="toast" style={{ ...fr(500, "14px") }}>{toast}</div>}
    </>
  );
}
