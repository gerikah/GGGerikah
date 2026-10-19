"use client";
import { useState } from "react";
import Image from "next/image";
import type { MediaAsset } from "@api/contracts/media-library";
import { assignLibraryImage } from "@api/actions/media-library";
import { ActionForm, Field } from "./action-form";
export function MediaPicker({ assets, target, projectId = "", slot = 0, alt = "" }: { assets: MediaAsset[]; target: string; projectId?: string; slot?: number; alt?: string }) {
  const [search, setSearch] = useState(""), [selected, setSelected] = useState("");
  const images = assets.filter(a => !a.deleting && a.filename.toLowerCase().includes(search.toLowerCase()));
  return <ActionForm action={assignLibraryImage} submitLabel="Use selected image" disabled={!selected}>
    <input type="hidden" name="target" value={target} /><input type="hidden" name="project_id" value={projectId} /><input type="hidden" name="slot" value={slot} />
    <label className="admin-field"><span>Find an existing image</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label>
    <div className="admin-picker-grid">{images.map(a => <label key={a.id} className={selected === a.id ? "is-selected" : ""}><input type="radio" name="asset_id" value={a.id} checked={selected === a.id} onChange={() => setSelected(a.id)} required />{a.url && <Image src={a.url} alt="" width={180} height={120} unoptimized />}<span>{a.filename}</span></label>)}</div>
    {!images.length && <p>No matching images. Upload a new file instead.</p>}
    <Field key={selected} name="alt_text" label="Image alt text" value={alt || assets.find(a => a.id === selected)?.alt_text} limit={160} required />
    {target === "gallery" && <Field name="caption" label="Caption" limit={90} />}
  </ActionForm>;
}
