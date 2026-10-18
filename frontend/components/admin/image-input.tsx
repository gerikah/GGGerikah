"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
export function ImageInput({ name = "file", required = false }: { name?: string; required?: boolean }) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return <label className="admin-field"><span>Image · PNG, JPG, WebP · maximum 3 MB</span><input name={name} type="file" accept="image/png,image/jpeg,image/webp" required={required} onChange={event => { const selected = event.target.files?.[0]; const problem = selected && (selected.size > 3 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(selected.type)) ? "Choose a PNG, JPG or WebP image no larger than 3 MB." : ""; event.target.setCustomValidity(problem); setError(problem); setPreview(!problem && selected ? URL.createObjectURL(selected) : ""); }} />{error && <small role="alert">{error}</small>}{preview && <Image className="admin-upload-preview" src={preview} width={800} height={450} unoptimized alt="Selected upload preview" />}</label>;
}
