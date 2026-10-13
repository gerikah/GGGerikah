import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ProjectForm } from "@/components/admin/project-form";
import { createProject } from "../../actions";

export default async function NewProjectPage() {
  if (!isSupabaseConfigured()) return null;
  await requireAdmin();
  return <><Link href="/admin" className="admin-back">← All projects</Link><div className="admin-page-heading"><div><p className="admin-eyebrow">PROJECT / NEW DRAFT</p><h1>A new chapter.</h1><p className="admin-muted">Create the draft first. Add sections and visuals on the next screen.</p></div></div><section className="admin-panel"><ProjectForm action={createProject} /></section></>;
}
