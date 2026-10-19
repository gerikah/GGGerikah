"use client";
import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { UploadSimpleIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import type { FormAction } from "@api/contracts/action-state";
import type { MediaAsset } from "@api/contracts/media-library";
import { ActionForm, Field } from "./action-form";
import { ImageInput } from "./image-input";
import { MediaPicker } from "./media-picker";
export function ImageTile({ title, url, alt = "", caption = "", portrait = false, upload, altName = "alt_text", gallery = false, controls, assets, target, projectId, slot, remove, removeFields }: {
 title: string; url?: string; alt?: string; caption?: string; portrait?: boolean; upload: FormAction; altName?: string; gallery?: boolean; controls?: ReactNode; assets: MediaAsset[]; target: string; projectId?: string; slot?: number; remove?: FormAction; removeFields?: ReactNode;
}) {
 const editorial = target === "homepage-one" || target === "homepage-two";
 const sizeHint = editorial ? "500 × 800 px · 5:8 portrait" : portrait ? "450 × 850 px · 9:17 portrait" : gallery ? "699 × 343 px · 2.04:1 landscape" : "1428 × 700 px · 2.04:1 landscape";
 const dialog = useRef<HTMLDialogElement>(null), picker = useRef<HTMLInputElement>(null);
 const [file, setFile] = useState<File | null>(null), [tab, setTab] = useState("upload"), [revision, setRevision] = useState(0);
 function choose(file: File) { setFile(file); setTab("upload"); dialog.current?.showModal(); }
 function close() { if (dialog.current?.querySelector('[aria-busy="true"]')) return; if (dialog.current?.querySelector('[data-dirty="true"]') && !window.confirm("Discard unsaved image changes?")) return; dialog.current?.close(); setFile(null); setTab("upload"); setRevision(value=>value+1); }
 return <article className={`admin-image-tile ${editorial ? "is-editorial" : portrait ? "is-portrait" : gallery ? "" : "is-cover"}`}><h3>{title}</h3><button className="admin-tile-image" aria-label={url ? `Edit ${title}` : `Add image: ${title}`} onClick={() => url ? dialog.current?.showModal() : picker.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const next = e.dataTransfer.files[0]; if(next) choose(next); }}>{url ? <><Image src={url} alt={alt} fill sizes="(max-width: 600px) 90vw, 40vw" unoptimized /><span className="admin-tile-edit"><PencilSimpleIcon size={18} /> Edit image</span></> : <span><UploadSimpleIcon size={30} /><strong>Add Image</strong><small>Click or drop an image</small></span>}</button><input ref={picker} type="file" accept="image/png,image/jpeg,image/webp" className="admin-visually-hidden" tabIndex={-1} aria-label={`Choose file for ${title}`} onChange={e => { const next = e.target.files?.[0]; if(next) choose(next); e.target.value = ""; }} />
 <div className="admin-tile-actions"><small>{sizeHint}</small><button type="button" onClick={() => { setTab("library"); dialog.current?.showModal(); }}>Choose from library</button></div>
 <dialog ref={dialog} className="admin-dialog admin-image-dialog" aria-label={title} onCancel={e => { e.preventDefault(); close(); }}><div className="admin-dialog-heading"><h2>{title}</h2><button type="button" className="admin-icon-button" aria-label="Close image editor" onClick={close}>×</button></div>
 <p className="admin-muted">Recommended: {sizeHint}</p>
 <div key={revision}><div className="admin-tabs"><button type="button" aria-pressed={tab === "upload"} onClick={() => setTab("upload")}>{url ? "Replace image" : "Upload image"}</button><button type="button" aria-pressed={tab === "library"} onClick={() => setTab("library")}>Media Library</button>{url && <button type="button" aria-pressed={tab === "edit"} onClick={() => setTab("edit")}>Edit details / position</button>}</div>
 <div hidden={tab !== "upload"}><ActionForm key={file?.name + String(file?.lastModified)} action={upload} submitLabel={url ? "Save replacement" : "Upload image"}><ImageInput required initialFile={file} /><Field name={altName} label="Image alt text" value={alt} limit={160} required />{gallery && <Field name="caption" label="Caption" value={caption} limit={90} />}</ActionForm></div>
 <div hidden={tab !== "library"}><MediaPicker assets={assets} target={target} projectId={projectId} slot={slot} alt={alt} /></div>
 {url && <div hidden={tab !== "edit"} className="admin-image-controls"><div>{controls}</div>{remove ? <ActionForm action={remove} submitLabel="Remove image" confirmLabel="Remove this image from its position? The file stays in the Media Library." danger>{removeFields}</ActionForm> : <p className="admin-muted">Unpublish this project before removing an image.</p>}</div>}</div>
 </dialog></article>;
}
