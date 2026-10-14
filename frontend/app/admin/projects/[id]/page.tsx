import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@backend/supabase/auth";
import { isSupabaseConfigured } from "@backend/supabase/config";
import { resolveMediaUrl } from "@backend/cms/media";
import type { Project, ProjectMedia, ProjectSection } from "@api/contracts/cms";
import { ActionForm, Field } from "@frontend/components/admin/action-form";
import { ProjectForm } from "@frontend/components/admin/project-form";
import { SectionForm } from "@frontend/components/admin/section-form";
import { MediaFields } from "@frontend/components/admin/media-fields";
import { clearCover, deleteMedia, deleteProject, deleteSection, saveCoverAlt, saveMedia, saveProject, saveSection, setCover, setPublished, uploadMedia } from "@api/actions/admin";

export default async function ProjectEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
  if (!isSupabaseConfigured()) return null;
  const { supabase } = await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [projectResult, sectionResult, mediaResult] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("project_sections").select("*").eq("project_id", id).order("sort_order").order("created_at"),
    supabase.from("project_media").select("*").eq("project_id", id).order("sort_order").order("created_at"),
  ]);
  if (projectResult.error) throw new Error("Unable to load project.");
  if (!projectResult.data) notFound();
  const project = projectResult.data as Project;
  const sections = (sectionResult.data ?? []) as ProjectSection[];
  const media = (mediaResult.data ?? []) as ProjectMedia[];
  const resolvedMedia = await Promise.all(media.map(async (item) => {
    try { return { ...item, url: await resolveMediaUrl(item.storage_path, supabase) }; }
    catch { return { ...item, url: "" }; }
  }));
  let coverUrl = "";
  if (project.cover_image_url) {
    try { coverUrl = await resolveMediaUrl(project.cover_image_url, supabase); } catch { /* Show the missing-asset state while keeping the editor usable. */ }
  }
  const { notice } = await searchParams;
  return <><Link href="/admin" className="admin-back">← All projects</Link><div className="admin-page-heading"><div><p className="admin-eyebrow">PROJECT {String(project.project_number).padStart(2, "0")} / EDITOR</p><h1>{project.title}</h1><span className={`admin-badge ${project.is_published ? "is-published" : ""}`}>{project.is_published ? "Published" : "Draft"}</span></div>{project.is_published && <Link href={`/work/${project.slug}`} target="_blank" rel="noopener noreferrer" className="admin-button">Preview published case study ↗</Link>}</div>
    {notice === "created" && <p className="admin-message is-success" role="status">Draft created. Add your story and images, then publish when it is ready.</p>}
    <nav className="admin-editor-nav" aria-label="Project editor sections"><a href="#project-details">Details</a><a href="#project-cover">Cover</a><a href="#project-sections">Story blocks</a><a href="#project-gallery">Gallery</a><a href="#project-publish">Publish</a></nav>
    <section className="admin-panel" id="project-details"><div className="admin-section-heading"><p className="admin-eyebrow">01 / PROJECT DETAILS</p><h2>The facts.</h2></div><ProjectForm project={project} action={saveProject.bind(null, id)} /></section>
    <section className="admin-panel" id="project-cover"><div className="admin-section-heading"><p className="admin-eyebrow">02 / COVER IMAGE</p><h2>First impressions.</h2></div>
      {coverUrl ? <div className="admin-cover-preview"><Image src={coverUrl} alt={project.cover_alt || "Current project cover preview"} fill sizes="(max-width: 760px) 90vw, 800px" unoptimized /></div> : <div className="admin-asset-placeholder"><span>IMAGE / PENDING</span><p>{project.cover_image_url ? "This cover could not be loaded. Check the asset, or upload a replacement below." : "This project needs a cover. Upload a real project image below, then choose Set as cover."}</p></div>}
      {project.cover_image_url && <><ActionForm action={saveCoverAlt.bind(null, id)} submitLabel="Save cover description"><Field label="Cover image alt text" name="cover_alt" value={project.cover_alt} required /></ActionForm><details className="admin-danger-details"><summary>Remove current cover</summary><ActionForm action={clearCover.bind(null, id)} submitLabel="Remove cover" confirmLabel="Remove the cover from this project. Its gallery image will remain available." danger /></details></>}
    </section>
    <section className="admin-panel" id="project-sections"><div className="admin-section-heading"><p className="admin-eyebrow">03 / STORY BLOCKS</p><h2>A story, in sections.</h2><p className="admin-muted">Change the display order to arrange your case study. Lower numbers come first.</p></div>
      {sectionResult.error ? <p className="admin-message is-error">Story blocks could not be loaded. Refresh before editing.</p> : <>{!sections.length && <p className="admin-empty-note">No blocks yet. Add context, a design response, or a reflection.</p>}{sections.map((section) => <details className="admin-editor-item" key={section.id}><summary><span>{String(section.sort_order).padStart(2, "0")} / {section.section_type.replaceAll("_", " ")}</span><strong>{section.heading || "Untitled block"}</strong></summary><div className="admin-editor-item-body"><SectionForm section={section} action={saveSection.bind(null, id, section.id)} /><ActionForm action={deleteSection.bind(null, id, section.id)} className="admin-delete-form" submitLabel="Delete block" confirmLabel="Permanently delete this story block." danger /></div></details>)}
        <details className="admin-editor-item admin-add-item"><summary>+ Add a story block</summary><div className="admin-editor-item-body"><SectionForm action={saveSection.bind(null, id, null)} order={(sections.at(-1)?.sort_order ?? -1) + 1} /></div></details></>}
    </section>
    <section className="admin-panel" id="project-gallery"><div className="admin-section-heading"><p className="admin-eyebrow">04 / PROJECT VISUALS</p><h2>Show the thinking.</h2><p className="admin-muted">JPEG, PNG, or WebP · up to 10 MB per image. Captions and display order also drive the public gallery.</p></div>
      {mediaResult.error ? <p className="admin-message is-error">Gallery images could not be loaded. Refresh before editing.</p> : <>{!resolvedMedia.length && <p className="admin-empty-note">No gallery images yet. Upload real project visuals to begin.</p>}<div className="admin-media-list">{resolvedMedia.map((item) => <details className="admin-editor-item" key={item.id}><summary><span>{String(item.sort_order).padStart(2, "0")} / IMAGE</span><strong>{item.caption || item.alt_text}</strong>{project.cover_image_url === item.storage_path && <span className="admin-badge">Cover</span>}</summary><div className="admin-editor-item-body">
        {item.url ? <div className="admin-media-preview"><Image src={item.url} alt={item.alt_text} width={1200} height={800} sizes="(max-width: 760px) 90vw, 700px" unoptimized /></div> : <p className="admin-message is-error">Image file unavailable. Upload a replacement and remove this entry.</p>}
        <p className="admin-fine">Image ID: <code>{item.id}</code></p><ActionForm action={saveMedia.bind(null, id, item.id)} submitLabel="Save image details"><MediaFields media={item} /></ActionForm>
        {project.cover_image_url !== item.storage_path && <ActionForm action={setCover.bind(null, id, item.id)} className="admin-compact-form" submitLabel="Set as cover" />}
        <ActionForm action={deleteMedia.bind(null, id, item.id)} className="admin-delete-form" submitLabel="Delete image" confirmLabel="Permanently delete this image and its uploaded file. A bundled original asset remains in the repository." danger />
      </div></details>)}</div>
        <details className="admin-editor-item admin-add-item"><summary>+ Upload an image</summary><div className="admin-editor-item-body"><ActionForm action={uploadMedia.bind(null, id)} submitLabel="Upload image"><label className="admin-field"><span>Image file *</span><input type="file" name="file" accept="image/jpeg,image/png,image/webp" required /></label><MediaFields order={(media.at(-1)?.sort_order ?? -1) + 1} /></ActionForm></div></details></>}
    </section>
    <section className="admin-panel" id="project-publish"><div className="admin-section-heading"><p className="admin-eyebrow">05 / PUBLICATION</p><h2>{project.is_published ? "Out in the world." : "Ready when you are."}</h2><p className="admin-muted">{project.is_published ? "Saved changes to this project are immediately visible to visitors. Move it to draft while making a larger revision." : "Draft projects are visible only in this CMS. Publish after reviewing the facts, images, and alt text."}</p></div><ActionForm key={String(project.is_published)} action={setPublished.bind(null, id, !project.is_published)} submitLabel={project.is_published ? "Move to draft" : "Publish project"} confirmLabel={project.is_published ? "Hide this project from the public archive." : "I have reviewed this project and want it to be publicly visible."} /></section>
    <section className="admin-panel admin-danger-panel"><p className="admin-eyebrow">PERMANENT ACTION</p><h2>Delete this project.</h2><p>This removes the project, its story blocks, gallery entries, and uploaded files.</p><ActionForm action={deleteProject.bind(null, id)} submitLabel="Permanently delete project" confirmLabel={`I understand that “${project.title}” and its content will be permanently deleted.`} danger /></section>
  </>;
}
