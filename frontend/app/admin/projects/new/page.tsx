import Link from "next/link";
import { requireAdmin } from "@backend/supabase/auth";
import { isSupabaseConfigured } from "@backend/supabase/config";
import { ProjectForm } from "@frontend/components/admin/project-form";
import { saveEditorialProject } from "@api/actions/editorial";

export default async function NewProjectPage() {
  if (!isSupabaseConfigured()) return null;
  await requireAdmin();
  return <><Link href="/admin" className="admin-back">← All projects</Link><div className="admin-page-heading"><div><h1>Add project</h1><p className="admin-muted">Write two short sections and upload a cover. You can complete the Visual Board after saving your draft.</p></div></div><section className="admin-panel"><ProjectForm action={saveEditorialProject.bind(null, null)} /></section></>;
}
