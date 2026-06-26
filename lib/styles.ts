/**
 * Shared font style helpers — import ke semua file yang butuh fr/fc.
 * fr = Raleway (body/UI text)
 * fc = Comfortaa (heading/brand text)
 */

export const fr = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-raleway), sans-serif", fontWeight: w, fontSize: s,
});

export const fc = (w: number | string, s: string): React.CSSProperties => ({
  fontFamily: "var(--font-comfortaa), cursive", fontWeight: w, fontSize: s,
});
