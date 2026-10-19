import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaAsset, MediaUsage } from "@api/contracts/media-library";
export async function getMediaLibrary(supabase: SupabaseClient): Promise<MediaAsset[]> {
  const [assets, projects, gallery, homepage] = await Promise.all([
    supabase.from("media_assets").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("id,title,cover_image_url,is_published"),
    supabase.from("project_media").select("project_id,storage_path,slot"),
    supabase.from("homepage_content").select("editorial_one_path,editorial_two_path").eq("id",1).single(),
  ]);
  if (assets.error || projects.error || gallery.error || homepage.error) throw new Error("Unable to load Media Library. Check the connection and apply the CMS workspace migration.");
  const paths = assets.data.map(a => a.storage_path);
  const signed = paths.length ? await supabase.storage.from("portfolio-media").createSignedUrls(paths, 3600) : { data: [] };
  return assets.data.map(asset => {
    const usages: MediaUsage[] = [];
    for (const project of projects.data) {
      const base = { projectId: project.id, href: `/admin/projects/${project.id}?step=images`, published: project.is_published };
      if (project.cover_image_url === asset.storage_path) usages.push({ ...base, label: `${project.title} · Cover`, category: "cover" });
      for (const item of gallery.data.filter(m => m.project_id === project.id && m.storage_path === asset.storage_path)) usages.push({ ...base, published: base.published && item.slot !== null, retained: item.slot === null, label: `${project.title} · ${item.slot === null ? "Retained gallery image" : `Gallery slot ${item.slot + 1}`}`, category: "gallery" });
    }
    for (const position of ["one", "two"] as const) if (homepage.data[`editorial_${position}_path`] === asset.storage_path) usages.push({ label: `Homepage · Editorial ${position === "one" ? 1 : 2}`, href: "/admin/homepage", category: "homepage", published: true });
    return { ...asset, usages, url: signed.data?.find(s => s.path === asset.storage_path)?.signedUrl ?? "" } as MediaAsset;
  });
}
