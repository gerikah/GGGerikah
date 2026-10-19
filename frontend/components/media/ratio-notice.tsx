import { MEDIA_SPEC, ratioMismatch, type MediaVariant } from "./media-spec";

export function RatioNotice({ width, height, variant }: { width?: number | null; height?: number | null; variant: MediaVariant }) {
  if (!width || !height || !ratioMismatch(width, height, variant)) return null;
  return <small className="media-ratio-notice" role="status">This image is {width} × {height} px. The frame uses {variant === "portrait" ? "9:17" : "2:1"}, so empty space will remain around the complete artwork. To fill it, export at {MEDIA_SPEC[variant].width} × {MEDIA_SPEC[variant].height} px or a larger size with the same ratio. No cropping is applied.</small>;
}
