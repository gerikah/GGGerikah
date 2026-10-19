"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
export function ImageInput({ name = "file", required = false, initialFile }: { name?: string; required?: boolean; initialFile?: File | null }) {
  const [preview, setPreview] = useState(""), [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  function select(file?: File) {
    const problem = file && (file.size > 3 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) ? "Choose a PNG, JPG or WebP image no larger than 3 MB." : "";
    input.current?.setCustomValidity(problem); setError(problem); setPreview(!problem && file ? URL.createObjectURL(file) : "");
  }
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => { if (initialFile && input.current) { const transfer = new DataTransfer(); transfer.items.add(initialFile); input.current.files = transfer.files; input.current.dispatchEvent(new Event("change", { bubbles: true })); } }, [initialFile]);
  return <label className="admin-field admin-dropzone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (input.current && e.dataTransfer.files[0]) { const transfer = new DataTransfer(); transfer.items.add(e.dataTransfer.files[0]); input.current.files = transfer.files; select(e.dataTransfer.files[0]); input.current.dispatchEvent(new Event("change", { bubbles: true })); } }}><span>↑ Drop an image here or choose a file</span><small>PNG, JPG, WebP · Maximum 3 MB</small><input ref={input} name={name} type="file" accept="image/png,image/jpeg,image/webp" required={required} onChange={e => select(e.target.files?.[0])} />{error && <small role="alert">{error}</small>}{preview && <Image className="admin-upload-preview" src={preview} width={800} height={450} unoptimized alt="Selected upload preview" />}</label>;
}
