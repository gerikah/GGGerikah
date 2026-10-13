import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import seedJson from "./seed-data.json";
import { resolveMediaUrl, resolveProjectMedia } from "./media";
import type { Capability, CaseStudy, Project, ProjectSection, SeedData, SiteSettings } from "./types";

const seed = seedJson as SeedData;

function dataError(resource: string, message: string): never {
  throw new Error(`Unable to load ${resource} from Supabase. Check the migrations, seed, and RLS policies. ${message}`);
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!isSupabaseConfigured()) return seed.site_settings;
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  if (error || !data) dataError("site settings", error?.message ?? "The singleton record is missing.");
  return data as SiteSettings;
});

export const getProjects = cache(async (): Promise<Project[]> => {
  if (!isSupabaseConfigured()) {
    return seed.projects.filter((project) => project.is_published).sort((a, b) => a.sort_order - b.sort_order);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("*")
    .eq("is_published", true).order("sort_order").order("project_number");
  if (error) dataError("published projects", error.message);
  return Promise.all(((data ?? []) as Project[]).map(async (project) => ({
    ...project,
    cover_image_url: await resolveMediaUrl(project.cover_image_url, supabase),
  })));
});

export const getProject = cache(async (slug: string): Promise<CaseStudy | null> => {
  if (!isSupabaseConfigured()) {
    const project = seed.projects.find((item) => item.slug === slug && item.is_published);
    if (!project) return null;
    return {
      project,
      sections: seed.project_sections.filter((item) => item.project_id === project.id).sort((a, b) => a.sort_order - b.sort_order),
      media: seed.project_media.filter((item) => item.project_id === project.id).sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({ ...item, url: item.storage_path })),
    };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("*")
    .eq("slug", slug).eq("is_published", true).maybeSingle();
  if (error) dataError("the case study", error.message);
  if (!data) return null;
  const project = data as Project;
  const [sectionsResult, mediaResult, cover] = await Promise.all([
    supabase.from("project_sections").select("*").eq("project_id", project.id).order("sort_order"),
    supabase.from("project_media").select("*").eq("project_id", project.id).order("sort_order"),
    resolveMediaUrl(project.cover_image_url, supabase),
  ]);
  if (sectionsResult.error) dataError("case-study sections", sectionsResult.error.message);
  if (mediaResult.error) dataError("case-study images", mediaResult.error.message);
  return {
    project: { ...project, cover_image_url: cover },
    sections: (sectionsResult.data ?? []) as ProjectSection[],
    media: await resolveProjectMedia(mediaResult.data ?? [], supabase),
  };
});

export const getCapabilities = cache(async (): Promise<Capability[]> => {
  if (!isSupabaseConfigured()) {
    return seed.capabilities.filter((item) => item.is_published).sort((a, b) => a.sort_order - b.sort_order);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("capabilities").select("*")
    .eq("is_published", true).order("sort_order");
  if (error) dataError("capabilities and process", error.message);
  return (data ?? []) as Capability[];
});
