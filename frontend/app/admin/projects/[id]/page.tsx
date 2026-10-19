import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@backend/supabase/auth";
import { resolveMediaUrl } from "@backend/cms/media";
import { getMediaLibrary } from "@backend/cms/library";
import type { Project, ProjectMedia } from "@api/contracts/cms";
import { projectSchema } from "@api/validation/cms";
import { ActionForm, Field } from "@frontend/components/admin/action-form";
import { ImageTile } from "@frontend/components/admin/image-tile";
import { EditorSteps } from "@frontend/components/admin/editor-steps";
import { ProjectForm } from "@frontend/components/admin/project-form";
import { GalleryEditor } from "@frontend/components/admin/gallery-editor";
import { clearCover, deleteProject, saveCoverAlt, setPublished } from "@api/actions/admin";
import { saveEditorialProject, uploadCover } from "@api/actions/editorial";
export default async function ProjectEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ step?: string; notice?: string }> }) {
 const { supabase } = await requireAdmin(), { id } = await params;
 if (!z.uuid().safeParse(id).success) redirect("/admin?notice=project-unavailable");
 const [{data:record,error}, mediaResult, query] = await Promise.all([supabase.from("projects").select("*").eq("id",id).maybeSingle(),supabase.from("project_media").select("*").eq("project_id",id).order("created_at"),searchParams]);
 if(error||mediaResult.error) throw new Error("Unable to load project editor.");
 if(!record) redirect("/admin?notice=project-unavailable");
 const project = record as Project, media = await Promise.all((mediaResult.data as ProjectMedia[]).map(async item=>({...item,url:await resolveMediaUrl(item.storage_path,supabase).catch(()=>"")})));
 const step = ["images","review"].includes(query.step ?? "") ? query.step! : "details";
 let cover = ""; try { cover = await resolveMediaUrl(project.cover_image_url,supabase); } catch { /* Allow a missing cover to be replaced. */ }
 const parsed = projectSchema.safeParse({...project,tools:project.tools.join(", "),year:project.year?.toString() ?? ""});
 const missing = parsed.success ? [] : parsed.error.issues.map(issue=>({message:issue.message,step:"details"}));
 if(!project.cover_image_url || !cover) missing.push({message:"Missing image: Project cover.",step:"images"});
 if(!project.cover_alt.trim()) missing.push({message:"Add alt text for the project cover.",step:"images"});
 const total = project.gallery_layout==="mixed" ? 5 : 6;
 for(let i=0;i<total;i++) {
  const portrait = project.gallery_layout==="mixed"&&i<3, item = media.find(m=>m.slot===i);
  const label = `${portrait ? "Portrait" : "Landscape"} slot ${project.gallery_layout==="mixed"&&i>=3 ? i-2 : i+1}`;
  if(!item?.url) missing.push({message:`Missing image: ${label}.`,step:"images"});
  else if(!item.alt_text.trim() || item.layout!==(portrait?"portrait":"half")) missing.push({message:`Check alt text and image layout: ${label}.`,step:"images"});
 }
 const assets = step==="images" ? await getMediaLibrary(supabase) : [];
 return <><Link href="/admin/projects" className="admin-back">← All projects</Link><div className="admin-page-heading"><div><h1>{project.title}</h1><span className={`admin-badge ${project.is_published?"is-published":""}`}>{project.is_published?"Published":"Draft"}</span></div><Link className="admin-button admin-button-danger" href={`/admin/projects/${id}/preview`} target="_blank" rel="noopener noreferrer">Preview project ↗</Link></div>
 <EditorSteps id={id} step={step} />
 {query.notice==="saved" && <p className="admin-message is-success" role="status">Draft saved. Continue adding details and images whenever you’re ready.</p>}
 {step==="details" && <section className="admin-panel"><h2>Project details</h2><p>Empty fields are allowed in drafts. Required information is checked again before publication.</p><ProjectForm project={project} action={saveEditorialProject.bind(null,id)} /></section>}
 {step==="images" && <><section className="admin-panel"><h2>Project cover</h2><p>The cover appears in project listings. Recommended 16:9; PNG, JPG or WebP, up to 3 MB.</p><ImageTile title="Project cover" url={cover} alt={project.cover_alt} altName="cover_alt" upload={uploadCover.bind(null,id)} assets={assets} target="cover" projectId={id} remove={!project.is_published&&cover ? clearCover.bind(null,id) : undefined} controls={<ActionForm action={saveCoverAlt.bind(null,id)} submitLabel="Save cover alt text"><Field name="cover_alt" label="Cover alt text" value={project.cover_alt} limit={160} required /></ActionForm>} /></section><section className="admin-panel"><h2>Visual Board</h2><GalleryEditor project={project} media={media} assets={assets} /></section><div className="admin-sticky-actions"><span>Images save as you upload.</span><Link className="admin-button" href={`/admin/projects/${id}?step=review`}>Continue to review →</Link></div></>}
 {step==="review" && <><section className="admin-panel"><h2>Review & publish</h2><div className="admin-grid"><div>{cover && <div className="admin-cover-preview"><Image src={cover} alt={project.cover_alt} fill sizes="40vw" unoptimized /></div>}<h3>{project.title}</h3><p>{project.short_description||"Subtitle needed"}</p><p className="admin-muted">{[project.role,project.year,project.project_type,project.status].filter(Boolean).join(" · ")}</p><p className="admin-muted">{project.tools.join(", ")}</p></div><div><h3>{missing.length ? `${missing.length} items need attention` : "Ready to publish"}</h3>{missing.length ? <ul className="admin-completion-list">{missing.map((item,i)=><li key={i}><Link href={`/admin/projects/${id}?step=${item.step}`}>{item.message} →</Link></li>)}</ul> : <p>Required details, cover and every gallery slot are complete.</p>}<Link className="admin-link" href={`/admin/projects/${id}?step=details`}>Edit project details →</Link></div></div><h3>Gallery preview · {project.gallery_layout==="mixed"?"Portrait + Landscape":"All Landscape"}</h3><div className={`admin-gallery-grid admin-review-gallery ${project.gallery_layout==="mixed"?"is-mixed":""}`}>{Array.from({length:total},(_,i)=>{const item=media.find(m=>m.slot===i);return <div key={i} className="admin-review-image">{item?.url?<Image src={item.url} alt={item.alt_text} width={480} height={270} unoptimized />:<span>Slot {i+1} · Empty</span>}</div>;})}</div></section>
 <section className="admin-panel admin-publish-panel"><div className="admin-sticky-actions"><Link className="admin-button admin-button-danger" href={`/admin/projects/${id}/preview`} target="_blank">Preview project ↗</Link>{!project.is_published && <Link className="admin-button admin-button-danger" href="/admin/projects?status=draft">Save draft & exit</Link>}<ActionForm key={String(project.is_published)} action={setPublished.bind(null,id,!project.is_published)} submitLabel={project.is_published?"Unpublish":"Publish project"} disabled={!project.is_published&&missing.length>0} confirmLabel={project.is_published?"Hide this project from the public portfolio? Homepage assignments will be cleared.":"Publish this project to the public portfolio?"} /></div><p className="admin-muted">All changes shown here are saved. {missing.length>0?"Complete the linked items above to enable publishing.":""}</p></section>
 <section className="admin-panel"><h2>Delete project</h2><p>Project records are deleted permanently. Uploaded files stay in the Media Library.</p><ActionForm action={deleteProject.bind(null,id)} submitLabel="Delete project" confirmLabel={`Permanently delete ${project.title} and its project records?`} danger /></section></>}
 </>;
}
