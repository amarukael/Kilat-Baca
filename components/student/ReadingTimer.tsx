"use client";

interface Props {
  secondsLeft: number;
  duration: number;
}

export default function ReadingTimer({ secondsLeft, duration }: Props) {
  const pct = duration > 0 ? `${(secondsLeft / duration) * 100}%` : "0%";
  return (
    <div data-testid="reading-timer" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: "var(--border)" }}>
      <div
        data-testid="reading-timer-bar"
        style={{
          height: "100%",
          background: "var(--primary)",
          width: pct,
          transition: "width 1s linear",
          willChange: "width",
        }}
      />
    </div>
  );
}
