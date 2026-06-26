"use client";

import DurationSetting from "./DurationSetting";

const fr = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-raleway), sans-serif", fontWeight: w, fontSize: s,
});

interface Props {
  title: string;
  defaultDuration: number;
  defaultGap: number;
  shuffleEnabled: boolean;
  showSecondsTimer: boolean;
  isActive: boolean;
  studentUrl: string;
  onTitleChange: (v: string) => void;
  onDurationChange: (v: number) => void;
  onGapChange: (v: number) => void;
  onShuffleChange: (v: boolean) => void;
  onTimerChange: (v: boolean) => void;
  onCopyLink: () => void;
}

export default function SessionEditor({
  title, defaultDuration, defaultGap, shuffleEnabled, showSecondsTimer,
  isActive, studentUrl, onTitleChange, onDurationChange, onGapChange,
  onShuffleChange, onTimerChange, onCopyLink,
}: Props) {
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

      <DurationSetting
        duration={defaultDuration}
        gap={defaultGap}
        onDurationChange={onDurationChange}
        onGapChange={onGapChange}
      />

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
          <button
            data-testid="session-editor-copy-link-button"
            onClick={onCopyLink}
            style={{ width: "100%", padding: "8px", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", ...fr(600, "12px") }}
          >
            Salin Link
          </button>
        </div>
      )}
    </div>
  );
}
