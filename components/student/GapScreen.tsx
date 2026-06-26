"use client";

import { fr } from "@/lib/styles";

interface Props {
  secondsLeft: number;
  showTimer: boolean;
}

export default function GapScreen({ secondsLeft, showTimer }: Props) {
  return (
    <div data-testid="gap-screen" style={{ textAlign: "center" }}>
      <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--bg-light)", border: "2px solid var(--border)", margin: "0 auto 16px" }} />
      {showTimer && (
        <span data-testid="gap-screen-timer" style={{ ...fr(600, "20px"), color: "var(--text-light)" }}>{secondsLeft}</span>
      )}
    </div>
  );
}
