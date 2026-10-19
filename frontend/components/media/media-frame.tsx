"use client";

import Image from "next/image";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MEDIA_SIZES, type MediaVariant } from "./media-spec";

type ImageProps = {
  src: string;
  alt: string;
  sizes: string;
  eager?: boolean;
  unoptimized?: boolean;
  onDimensions?: (width: number, height: number) => void;
  onUnavailable?: () => void;
};

function Artwork({ src, alt, sizes, eager, unoptimized, onDimensions, onUnavailable }: ImageProps) {
  const [state, setState] = useState<"optimized" | "original" | "failed">("optimized");
  const original = unoptimized || state === "original" || src.startsWith("blob:");
  if (state === "failed") return <span className="media-fallback" role="img" aria-label={`Image unavailable: ${alt}`}><span>Image unavailable</span><small>Reload the page to try again.</small></span>;
  return <Image src={src} alt={alt} fill sizes={sizes}
    loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"}
    unoptimized={original}
    onLoad={event => onDimensions?.(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)}
    onError={() => {
      setState(original ? "failed" : "original");
      if (original) onUnavailable?.();
    }}
  />;
}

export function MediaFrame({ src, alt = "", variant = "landscape", sizes = MEDIA_SIZES.full, className = "", eager, unoptimized, onDimensions, children }: Omit<ImageProps, "src" | "alt" | "sizes"> & {
  src?: string;
  alt?: string;
  sizes?: string;
  variant?: MediaVariant;
  className?: string;
  children?: ReactNode;
}) {
  const refresh = useFreshMedia(src);
  return <span className={`media-frame media-frame--${variant} ${className}`} data-media-variant={variant}>
    {src ? <Artwork key={src} src={src} alt={alt} sizes={sizes} eager={eager} unoptimized={unoptimized} onDimensions={onDimensions} onUnavailable={refresh} /> : <span className="media-empty" role="img" aria-label={alt || "Image not yet added"}>{children}</span>}
  </span>;
}

// Fullscreen is an original-asset viewer, not a content-image frame.
export function OriginalMedia({ src, alt }: { src: string; alt: string }) {
  const refresh = useFreshMedia(src);
  return <span className="media-original"><Artwork key={src} src={src} alt={alt} sizes="100vw" eager unoptimized onUnavailable={refresh} /></span>;
}

function useFreshMedia(src?: string) {
  const router = useRouter();
  const attempted = useRef(false);
  return useCallback(() => {
    if (attempted.current || !src?.includes("/storage/v1/object/sign/")) return;
    attempted.current = true;
    // Re-run the existing server reads with the visitor's session and RLS.
    // This obtains fresh signed URLs without exposing an unrestricted signer.
    router.refresh();
  }, [router, src]);
}
