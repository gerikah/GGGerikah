import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@backend/supabase/auth";
import { resolveMediaUrl, resolveProjectMedia } from "@backend/cms/media";
import { getSiteSettings } from "@backend/cms/data";
import { ProjectDetail } from "@frontend/components/case-study/project-detail";
import { Footer } from "@frontend/components/layout/footer";
import "@frontend/styles/editorial.css";
export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin(); const { id } = await params;
  if (!z.uuid().safeParse(id).success) redirect("/admin?notice=project-unavailable");
  const { data: project, error: projectError } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (projectError) throw new Error("Unable to load project preview.");
  if (!project) redirect("/admin?notice=project-unavailable");
  const { data: media, error } = await supabase.from("project_media").select("*").eq("project_id", id).not("slot", "is", null).order("slot");
  if (error) throw new Error("Unable to load preview images.");
  return <><p className="admin-message">Private preview of saved content. Empty gallery slots are omitted.</p><div className="od-public"><ProjectDetail project={{ ...project, cover_image_url: await resolveMediaUrl(project.cover_image_url, supabase) }} media={await resolveProjectMedia(media, supabase)} /><Footer settings={await getSiteSettings()} /></div></>;
}
