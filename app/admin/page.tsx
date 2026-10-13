import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  if (!isSupabaseConfigured()) return null;
  const { supabase } = await requireAdmin();
  const { data: projects, error } = await supabase.from("projects").select("id,title,slug,project_number,category,is_published,cover_image_url,sort_order").order("sort_order").order("project_number");
  const { notice } = await searchParams;
  const published = projects?.filter((project) => project.is_published).length ?? 0;
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">YOUR WORK / EDITION CONTROL</p><h1>The archive.</h1><p className="admin-muted">{projects?.length ?? 0} projects · {published} published · {(projects?.length ?? 0) - published} drafts</p></div><Link href="/admin/projects/new" className="admin-button">+ New project</Link></div>
    {notice === "deleted" && <p className="admin-message is-success" role="status">Project and its uploaded images deleted.</p>}
    {notice === "deleted-storage-warning" && <p className="admin-message is-error" role="status">Project deleted. Some storage files could not be removed; check the project folder in Supabase Storage.</p>}
    {error ? <div className="admin-panel"><h2>Content could not be loaded.</h2><p>Check your Supabase connection and confirm the migration has been applied, then refresh this page.</p></div>
      : !projects?.length ? <div className="admin-panel admin-empty"><span>NO. 00</span><h2>Your next story starts here.</h2><p>Create a draft, add real project details and visuals, then publish when it is ready.</p><Link href="/admin/projects/new" className="admin-button">Create your first draft</Link></div>
        : <div className="admin-project-list">{projects.map((project) => <article key={project.id} className="admin-project-row"><span className="admin-project-number">{String(project.project_number).padStart(2, "0")}</span><div><div className="admin-row-title"><h2><Link href={`/admin/projects/${project.id}`}>{project.title}</Link></h2><span className={`admin-badge ${project.is_published ? "is-published" : ""}`}>{project.is_published ? "Published" : "Draft"}</span></div><p className="admin-muted">{project.category}</p>{!project.cover_image_url && <p className="admin-asset-note">Cover image needs replacing / uploading</p>}</div><div className="admin-row-actions"><Link href={`/admin/projects/${project.id}`} className="admin-link">Edit project →</Link>{project.is_published && <Link href={`/work/${project.slug}`} target="_blank" rel="noopener noreferrer" className="admin-link">Preview ↗</Link>}</div></article>)}</div>}
    <div className="admin-shortcuts"><Link href="/admin/settings"><span>01 / SITE DETAILS</span><h2>Keep your introduction current. ↗</h2></Link><Link href="/admin/capabilities"><span>02 / CAPABILITIES & PROCESS</span><h2>Shape the way you work. ↗</h2></Link></div>
  </>;
}
