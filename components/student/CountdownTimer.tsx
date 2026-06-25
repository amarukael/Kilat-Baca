"use client";

const fr = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-raleway), sans-serif", fontWeight: w, fontSize: s,
});

interface Props {
  seconds: number;
}

export default function CountdownTimer({ seconds }: Props) {
  return <span style={{ ...fr(600, "18px"), color: "var(--text-light)" }}>{seconds}</span>;
}
