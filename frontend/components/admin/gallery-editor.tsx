import Link from "next/link";
import type { Project, ProjectMedia } from "@api/contracts/cms";
import type { MediaAsset } from "@api/contracts/media-library";
import { assignGallery, uploadGallerySlot } from "@api/actions/editorial";
import { saveMedia } from "@api/actions/admin";
import { ActionForm, Field } from "./action-form";
import { ImageTile } from "./image-tile";
export function GalleryEditor({ project, media, assets }: { project: Project; media: ProjectMedia[]; assets: MediaAsset[] }) {
 const total = project.gallery_layout === "mixed" ? 5 : 6;
 const slots = Array.from({length:total},(_,index)=>({index,layout:project.gallery_layout === "mixed" && index<3 ? "portrait" : "half"}));
 const unused = media.filter(m=>m.slot===null);
 return <><p className="gallery-count">{media.filter(m=>m.slot!==null).length} / {total} images uploaded</p><p className="admin-muted">Click an empty tile to upload. PNG, JPG or WebP, up to 3 MB. Replaced images are retained.</p><div className={`admin-gallery-grid ${project.gallery_layout === "mixed" ? "is-mixed" : ""}`}>{slots.map(s=>{
 const item = media.find(m=>m.slot===s.index);
 const title = `${s.layout==="portrait" ? "Portrait" : "Landscape"} slot ${project.gallery_layout==="mixed" && s.index>=3 ? s.index-2 : s.index+1}`;
 return <ImageTile key={`${project.gallery_layout}-${s.index}-${item?.id ?? "empty"}`} title={title} url={item?.url} alt={item?.alt_text} caption={item?.caption} portrait={s.layout==="portrait"} gallery upload={uploadGallerySlot.bind(null,project.id,s.index)} assets={assets} target="gallery" projectId={project.id} slot={s.index}
 remove={item && !project.is_published ? assignGallery.bind(null,project.id,item.id) : undefined} removeFields={<input type="hidden" name="slot" value="unassigned" />}
 controls={item && <><ActionForm action={saveMedia.bind(null,project.id,item.id)} submitLabel="Save image details"><Field name="alt_text" label="Image alt text" value={item.alt_text} limit={160} required /><Field name="caption" label="Caption" value={item.caption} limit={90} /><input type="hidden" name="layout" value={item.layout} /><input type="hidden" name="sort_order" value={item.sort_order} /></ActionForm><ActionForm action={assignGallery.bind(null,project.id,item.id)} submitLabel="Move image"><label className="admin-field"><span>Move to position</span><select name="slot" defaultValue={item.slot ?? ""}>{slots.filter(v=>v.layout===item.layout).map(v=><option value={v.index} key={v.index}>Slot {v.index+1}{media.some(m=>m.slot===v.index&&m.id!==item.id) ? " (swap)" : ""}</option>)}</select></label></ActionForm></>} />;
 })}</div>{unused.length>0 && <p className="admin-message">{unused.length} earlier images are retained. Use “Choose from library” to reuse them, or <Link href={`/admin/media?project=${project.id}`}>view this project’s media →</Link></p>}</>;
}
