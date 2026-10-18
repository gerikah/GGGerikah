import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@backend/supabase/auth";
import { resolveMediaUrl, resolveProjectMedia } from "@backend/cms/media";
import type { Project, ProjectMedia } from "@api/contracts/cms";
import { ActionForm, Field } from "@frontend/components/admin/action-form";
import { ImageInput } from "@frontend/components/admin/image-input";
import { ProjectForm } from "@frontend/components/admin/project-form";
import { GalleryEditor } from "@frontend/components/admin/gallery-editor";
import { clearCover, deleteProject, saveCoverAlt, setPublished } from "@api/actions/admin";
import { saveEditorialProject, uploadCover } from "@api/actions/editorial";
export default async function ProjectEditor({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) redirect("/admin?notice=project-unavailable");
  const [projectResult, mediaResult] = await Promise.all([supabase.from("projects").select("*").eq("id", id).maybeSingle(), supabase.from("project_media").select("*").eq("project_id", id).order("created_at")]);
  if (projectResult.error || mediaResult.error) throw new Error("Unable to load project editor.");
  if (!projectResult.data) redirect("/admin?notice=project-unavailable");
  const project = projectResult.data as Project;
  const media = await resolveProjectMedia(mediaResult.data as ProjectMedia[], supabase);
  let cover = "";
  try { cover = await resolveMediaUrl(project.cover_image_url, supabase); } catch { /* Keep replacement available if a saved file is missing. */ }
  return <><Link href="/admin" className="admin-back">← All projects</Link><div className="admin-page-heading"><div><h1>{project.title}</h1><span className="admin-badge">{project.is_published ? "Published" : "Draft"}</span></div><Link className="admin-button" href={`/admin/projects/${id}/preview`} target="_blank">Preview page ↗</Link></div>
    <nav className="admin-editor-nav" aria-label="Project sections"><a href="#details">Details</a><a href="#cover">Cover</a><a href="#gallery">Visual Board</a><a href="#publish">Publish</a></nav>
    <section className="admin-panel" id="details"><h2>Project details</h2><ProjectForm project={project} action={saveEditorialProject.bind(null, id)} /></section>
    <section className="admin-panel" id="cover"><h2>Cover image</h2><p className="admin-muted">Separate from your Visual Board. Displayed in a 16:9 frame without cropping.</p>{cover && <div className="admin-cover-preview"><Image src={cover} alt={project.cover_alt} fill sizes="80vw" unoptimized /></div>}{project.cover_image_url && !cover && <p role="alert">The saved file could not be loaded. Upload a replacement below.</p>}<ActionForm action={uploadCover.bind(null, id)} submitLabel={cover ? "Replace cover" : "Upload cover"}><ImageInput required /><Field name="cover_alt" label="Cover alt text" value={project.cover_alt} limit={160} required /></ActionForm>{cover && <><ActionForm action={saveCoverAlt.bind(null, id)} submitLabel="Save cover alt text"><Field name="cover_alt" label="Saved cover alt text" value={project.cover_alt} limit={160} required /></ActionForm>{!project.is_published && <ActionForm action={clearCover.bind(null, id)} submitLabel="Remove cover" confirmLabel="Remove the draft cover. Its stored file is retained." danger />}</>}</section>
    <section className="admin-panel" id="gallery"><h2>Visual Board</h2><GalleryEditor project={project} media={media} /></section>
    <section className="admin-panel" id="publish"><h2>{project.is_published ? "Publication" : "Ready to publish?"}</h2><p className="admin-muted">Save details first. Publishing requires a cover and every gallery slot, with alt text. Unpublish to change layouts or remove images.</p><ActionForm key={String(project.is_published)} action={setPublished.bind(null, id, !project.is_published)} submitLabel={project.is_published ? "Unpublish" : "Publish project"} confirmLabel={project.is_published ? "Hide this project from the public archive." : "I have reviewed the saved project and want to publish it."} /></section>
    <section className="admin-panel"><h2>Delete project</h2><p>This deletes the project and its related records. Stored files are retained to protect any shared references.</p><ActionForm action={deleteProject.bind(null, id)} submitLabel="Delete project" confirmLabel={`Permanently delete ${project.title} and its project records.`} danger /></section>
  </>;
}
