"use client";

const fr = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-raleway), sans-serif", fontWeight: w, fontSize: s,
});

interface Props {
  duration: number;
  gap: number;
  onDurationChange: (v: number) => void;
  onGapChange: (v: number) => void;
}

export default function DurationSetting({ duration, gap, onDurationChange, onGapChange }: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
      <div>
        <label style={{ display: "block", ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "6px" }}>Durasi (dtk)</label>
        <input
          type="number" min={1} max={60} value={duration}
          onChange={(e) => onDurationChange(Number(e.target.value))}
          style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", ...fr(400, "13px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
        />
      </div>
      <div>
        <label style={{ display: "block", ...fr(500, "12px"), color: "var(--text-light)", marginBottom: "6px" }}>Jeda (dtk)</label>
        <input
          type="number" min={0} max={10} value={gap}
          onChange={(e) => onGapChange(Number(e.target.value))}
          style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", ...fr(400, "13px"), background: "var(--bg-light)", color: "var(--text-dark)" }}
        />
      </div>
    </div>
  );
}
