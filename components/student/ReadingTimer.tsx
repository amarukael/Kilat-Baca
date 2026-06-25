"use client";

interface Props {
  current: number;
  total: number;
}

export default function ReadingTimer({ current, total }: Props) {
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: "var(--border)" }}>
      <div
        style={{
          height: "100%",
          background: "var(--primary)",
          width: `${((current + 1) / total) * 100}%`,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}
