"use client";

import { fr } from "@/lib/styles";

interface Props {
  seconds: number;
}

export default function CountdownTimer({ seconds }: Props) {
  return <span data-testid="countdown-timer" style={{ ...fr(600, "18px"), color: "var(--text-light)" }}>{seconds}</span>;
}
