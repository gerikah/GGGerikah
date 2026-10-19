import Link from "next/link";
import { requireAdmin } from "@backend/supabase/auth";
import { ProjectList } from "@frontend/components/admin/project-list";
export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("projects").select("id,title,slug,is_published,cover_image_url,updated_at").order("updated_at", { ascending: false });
  if (error) throw new Error("Unable to load projects.");
  const { status } = await searchParams;
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">YOUR PORTFOLIO</p><h1>Projects</h1><p className="admin-muted">Manage drafts and published work.</p></div><Link href="/admin/projects/new" className="admin-button">+ Add new project</Link></div><ProjectList key={status} projects={data} initialStatus={["draft", "published"].includes(status ?? "") ? status : "all"} /></>;
}
