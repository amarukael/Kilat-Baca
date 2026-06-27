"use client";

import { useState } from 'react';
import DurationSetting from "./DurationSetting";
import QRCodeModal from './QRCodeModal';
import { fr } from "@/lib/styles";

interface Props {
  title: string;
  defaultDuration: number;
  defaultGap: number;
  shuffleEnabled: boolean;
  showSecondsTimer: boolean;
  isActive: boolean;
  studentUrl: string;
  category?: string;
  expiresAt?: string;
  onTitleChange: (v: string) => void;
  onDurationChange: (v: number) => void;
  onGapChange: (v: number) => void;
  onShuffleChange: (v: boolean) => void;
  onTimerChange: (v: boolean) => void;
  onCategoryChange: (v: string) => void;
  onExpiresAtChange: (v: string) => void;
  onCopyLink: () => void;
}

export default function SessionEditor({
  title, defaultDuration, defaultGap, shuffleEnabled, showSecondsTimer,
  isActive, studentUrl, category, expiresAt, onTitleChange, onDurationChange, onGapChange,
  onShuffleChange, onTimerChange, onCategoryChange, onExpiresAtChange, onCopyLink,
}: Props) {
  const [showQRModal, setShowQRModal] = useState(false);

  return (
    <div data-testid="session-editor" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <h2 style={{ ...fr(600, "15px"), color: "var(--text-dark)", margin: 0 }}>Pengaturan Sesi</h2>

      <div>
        <label style={{ display: "block", ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "6px" }}>Nama Sesi</label>
        <input
          data-testid="session-editor-title-input"
          type="text" value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", ...fr(400, "13px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
        />
      </div>

      <div>
        <label style={{ display: "block", ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "6px" }}>Kategori (Opsional)</label>
        <input
          data-testid="session-editor-category-input"
          type="text"
          value={category || ''}
          onChange={(e) => onCategoryChange(e.target.value)}
          placeholder="Contoh: Angka, Huruf, Hewan"
          style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", ...fr(400, "13px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
        />
      </div>

      <DurationSetting
        duration={defaultDuration}
        gap={defaultGap}
        onDurationChange={onDurationChange}
        onGapChange={onGapChange}
      />

      <div>
        <label style={{ display: "block", ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "6px" }}>Batas Waktu Akses (Opsional)</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            data-testid="session-editor-expiry-input"
            type="datetime-local"
            value={expiresAt ? new Date(expiresAt).toISOString().slice(0, 16) : ''}
            onChange={(e) => onExpiresAtChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
            style={{ flex: 1, padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", ...fr(400, "13px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
          />
          {expiresAt && (
            <button
              onClick={() => onExpiresAtChange('')}
              style={{ padding: "10px 12px", background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", ...fr(500, "12px"), color: "var(--text-dark)" }}
              title="Hapus batas waktu"
            >
              ×
            </button>
          )}
        </div>
        {expiresAt && (
          <p style={{ ...fr(400, "11px"), color: "var(--text-light)", marginTop: "4px", marginBottom: 0 }}>
            Sesi akan otomatis tidak dapat diakses setelah waktu ini
          </p>
        )}
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
        <input
          data-testid="session-editor-shuffle-checkbox"
          type="checkbox" checked={shuffleEnabled}
          onChange={(e) => onShuffleChange(e.target.checked)}
        />
        <span style={{ ...fr(500, "13px"), color: "var(--text-dark)" }}>Acak urutan slide</span>
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
        <input
          data-testid="session-editor-timer-checkbox"
          type="checkbox" checked={showSecondsTimer}
          onChange={(e) => onTimerChange(e.target.checked)}
        />
        <span style={{ ...fr(500, "13px"), color: "var(--text-dark)" }}>Tampilkan timer hitungan mundur</span>
      </label>

      {isActive && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
          <p style={{ ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "8px" }}>Link Murid</p>
          <div style={{ background: "var(--bg-light)", borderRadius: "8px", padding: "8px 10px", marginBottom: "8px" }}>
            <span style={{ ...fr(400, "11px"), color: "var(--text-dark)", wordBreak: "break-all" }}>{studentUrl}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              data-testid="session-editor-copy-link-button"
              onClick={onCopyLink}
              style={{ flex: 1, padding: "8px", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", ...fr(600, "12px") }}
            >
              Salin Link
            </button>
            <button
              data-testid="session-editor-qr-button"
              onClick={() => setShowQRModal(true)}
              style={{ flex: 1, padding: "8px", background: "var(--accent)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", ...fr(600, "12px") }}
            >
              Tampilkan QR
            </button>
          </div>
        </div>
      )}

      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        url={studentUrl}
      />
    </div>
  );
}
