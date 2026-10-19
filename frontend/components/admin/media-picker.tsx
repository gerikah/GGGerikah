"use client";
import { useState } from "react";
import type { MediaAsset } from "@api/contracts/media-library";
import { assignLibraryImage } from "@api/actions/media-library";
import { MediaFrame } from "@frontend/components/media/media-frame";
import { type MediaVariant } from "@frontend/components/media/media-spec";
import { RatioNotice } from "@frontend/components/media/ratio-notice";
import { ActionForm, Field } from "./action-form";

export function MediaPicker({ assets, target, projectId = "", slot = 0, alt = "", variant = "landscape" }: { assets: MediaAsset[]; target: string; projectId?: string; slot?: number; alt?: string; variant?: MediaVariant }) {
  const [search, setSearch] = useState(""), [selected, setSelected] = useState("");
  const images = assets.filter(a => !a.deleting && a.filename.toLowerCase().includes(search.toLowerCase()));
  const asset = assets.find(a => a.id === selected);
  return <ActionForm action={assignLibraryImage} submitLabel="Use selected image" disabled={!selected}>
    <input type="hidden" name="target" value={target} /><input type="hidden" name="project_id" value={projectId} /><input type="hidden" name="slot" value={slot} />
    <label className="admin-field"><span>Find an existing image</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label>
    <div className="admin-picker-grid">{images.map(a => <label key={a.id} className={selected === a.id ? "is-selected" : ""}><input type="radio" name="asset_id" value={a.id} checked={selected === a.id} onChange={() => setSelected(a.id)} required /><MediaFrame src={a.url} alt="" variant={variant} sizes="180px" unoptimized /><span>{a.filename}</span></label>)}</div>
    {!images.length && <p>No matching images. Upload a new file instead.</p>}
    {asset && <RatioNotice width={asset.width} height={asset.height} variant={variant} />}
    <Field key={selected} name="alt_text" label="Image alt text" value={alt || asset?.alt_text} limit={160} required />
    {target === "gallery" && <Field name="caption" label="Caption" limit={90} />}
  </ActionForm>;
}
