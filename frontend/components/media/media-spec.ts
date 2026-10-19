export type MediaVariant = "portrait" | "landscape";

// Reference exports only. CSS frames scale to their container.
export const MEDIA_SPEC = {
  portrait: { width: 450, height: 850, ratio: 9 / 17, label: "450 × 850 px · 9:17 portrait" },
  landscape: { width: 700, height: 350, ratio: 2, label: "700 × 350 px · 2:1 landscape" },
} as const;

export function ratioMismatch(width: number, height: number, variant: MediaVariant): boolean {
  // Allow at most one source pixel of export rounding, not a different crop.
  return width > 0 && height > 0 && Math.abs(width - height * MEDIA_SPEC[variant].ratio) > 1;
}

export function galleryVariant(layout: "landscape" | "mixed", slot: number): MediaVariant {
  return layout === "mixed" && slot < 3 ? "portrait" : "landscape";
}

// Match .wrap (1440px max, 18px mobile gutters, 4vw desktop gutters).
export const MEDIA_SIZES = {
  full: "(max-width: 600px) calc(100vw - 36px), (max-width: 1565px) 92vw, 1440px",
  half: "(max-width: 600px) calc(100vw - 36px), (max-width: 1565px) calc(46vw - 12px), 708px",
  portrait: "(max-width: 400px) calc(100vw - 36px), (max-width: 600px) calc(50vw - 26px), (max-width: 1565px) calc(30.6667vw - 16px), 464px",
  editorial: "(max-width: 600px) calc(100vw - 36px), (max-width: 1024px) calc(46vw - 12px), (max-width: 1854px) calc(33.33335vw - 12px), 606px",
  admin: "(max-width: 800px) calc(100vw - 80px), (max-width: 1400px) 40vw, 600px",
} as const;
