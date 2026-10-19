import Link from "next/link";
import { requireAdmin } from "@backend/supabase/auth";
import { isSupabaseConfigured } from "@backend/supabase/config";
export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  if (!isSupabaseConfigured()) return null;
  const { supabase } = await requireAdmin();
  const { data: projects, error } = await supabase.from("projects").select("id,title,is_published,cover_image_url,updated_at").order("updated_at", { ascending: false });
  if (error) throw new Error("Unable to load dashboard.");
  const { notice } = await searchParams, drafts = projects.filter(p => !p.is_published);
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">YOUR WORKSPACE</p><h1>Dashboard</h1><p className="admin-muted">A home for your work in progress.</p></div><Link href="/admin/projects/new" className="admin-button">+ Add new project</Link></div>
    {notice === "deleted" && <p className="admin-message is-success" role="status">Project deleted. Its images remain in the Media Library.</p>}
    {notice === "project-unavailable" && <p className="admin-message" role="status">That project is no longer available. Choose an existing project or create a new draft.</p>}
    <div className="admin-stats">{[["Total projects", projects.length, "/admin/projects"], ["Published", projects.length - drafts.length, "/admin/projects?status=published"], ["Drafts", drafts.length, "/admin/projects?status=draft"]].map(([label, number, href]) => <Link href={String(href)} key={label}><span>{label}</span><strong>{number}</strong></Link>)}</div>
    <div className="admin-quick-actions"><Link href="/admin/projects/new">+ Create a project</Link><Link href="/admin/media">↑ Upload images</Link><Link href="/admin/homepage">↗ Edit homepage</Link></div>
    <div className="admin-grid"><section className="admin-panel"><h2>Recent projects</h2>{projects.slice(0, 5).map(p => <Link className="admin-summary-row" href={`/admin/projects/${p.id}`} key={p.id}><span>{p.title}</span><span className="admin-badge">{p.is_published ? "Published" : "Draft"}</span></Link>)}{!projects.length && <p>No projects yet. Start with a draft; you can add images later.</p>}<Link className="admin-link" href="/admin/projects">View all projects →</Link></section><section className="admin-panel"><h2>Drafts needing attention</h2>{drafts.slice(0, 5).map(p => <Link className="admin-summary-row" href={`/admin/projects/${p.id}?step=review`} key={p.id}><span>{p.title}<small>{p.cover_image_url ? "Review details and gallery" : "Add a cover image"}</small></span><span>→</span></Link>)}{!drafts.length && <p>No unfinished drafts. Your next idea can start here.</p>}</section></div></>;
}
