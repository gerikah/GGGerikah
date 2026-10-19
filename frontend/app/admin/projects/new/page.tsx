import { EditorSteps } from "@frontend/components/admin/editor-steps";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { requireAdmin } from "@backend/supabase/auth";
import { isSupabaseConfigured } from "@backend/supabase/config";
import { ProjectForm } from "@frontend/components/admin/project-form";
import { saveEditorialProject } from "@api/actions/editorial";

export default async function NewProjectPage() {
  if (!isSupabaseConfigured()) return null;
  await requireAdmin();
  return <><Link href="/admin/projects" className="admin-back">← All projects</Link><div className="admin-page-heading"><div><h1>Add project</h1><p className="admin-muted">Start with what you know. Opening Images automatically saves your draft; you can finish the details later.</p></div></div><EditorSteps step="details" /><section className="admin-panel"><ProjectForm draftId={randomUUID()} action={saveEditorialProject.bind(null, null)} /></section></>;
}
