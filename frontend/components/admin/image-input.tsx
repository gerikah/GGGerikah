"use client";
import { useEffect, useRef, useState } from "react";
import { MediaFrame } from "@frontend/components/media/media-frame";
import { MEDIA_SPEC, type MediaVariant } from "@frontend/components/media/media-spec";
import { RatioNotice } from "@frontend/components/media/ratio-notice";

export function ImageInput({ name = "file", required = false, initialFile, variant }: { name?: string; required?: boolean; initialFile?: File | null; variant?: MediaVariant }) {
  const [preview, setPreview] = useState(""), [error, setError] = useState("");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const input = useRef<HTMLInputElement>(null);
  function select(file?: File) {
    const problem = file && (file.size > 3 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) ? "Choose a PNG, JPG or WebP image no larger than 3 MB." : "";
    input.current?.setCustomValidity(problem);
    setError(problem); setDimensions({ width: 0, height: 0 });
    setPreview(!problem && file ? URL.createObjectURL(file) : "");
  }
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => { if (initialFile && input.current) { const transfer = new DataTransfer(); transfer.items.add(initialFile); input.current.files = transfer.files; input.current.dispatchEvent(new Event("change", { bubbles: true })); } }, [initialFile]);
  const frameVariant = variant ?? (dimensions.height > dimensions.width ? "portrait" : "landscape");
  return <label className="admin-field admin-dropzone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (input.current && e.dataTransfer.files[0]) { const transfer = new DataTransfer(); transfer.items.add(e.dataTransfer.files[0]); input.current.files = transfer.files; input.current.dispatchEvent(new Event("change", { bubbles: true })); } }}>
    <span>↑ Drop an image here or choose a file</span><small>PNG, JPG, WebP · Maximum 3 MB</small>
    {variant && <small>Recommended: {MEDIA_SPEC[variant].label}. Larger exports with the same ratio are welcome.</small>}
    <input ref={input} name={name} type="file" accept="image/png,image/jpeg,image/webp" required={required} onChange={e => select(e.target.files?.[0])} />
    {error && <small role="alert">{error}</small>}
    {preview && <MediaFrame className="admin-upload-preview" src={preview} variant={frameVariant} unoptimized alt="Selected upload preview" onDimensions={(width, height) => setDimensions({ width, height })} />}
    {preview && variant && <RatioNotice {...dimensions} variant={variant} />}
  </label>;
}
