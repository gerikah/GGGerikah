import "server-only";
import { cache } from "react";
import { createClient } from "@backend/supabase/server";
import { isSupabaseConfigured } from "@backend/supabase/config";
import seedJson from "@database/seed-data.json";
import { resolveMediaUrl, resolveProjectMedia } from "./media";
import type { Capability, CaseStudy, HomepageContent, Project, SeedData, SiteSettings } from "@api/contracts/cms";

const seed = seedJson as unknown as SeedData;

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
    return [];
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
    return null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("*")
    .eq("slug", slug).eq("is_published", true).maybeSingle();
  if (error) dataError("the case study", error.message);
  if (!data) return null;
  const project = data as Project;
  const [mediaResult, cover] = await Promise.all([
    supabase.from("project_media").select("*").eq("project_id", project.id).not("slot", "is", null).order("slot"),
    resolveMediaUrl(project.cover_image_url, supabase),
  ]);
  if (mediaResult.error) dataError("case-study images", mediaResult.error.message);
  return {
    project: { ...project, cover_image_url: cover },
    media: await resolveProjectMedia(mediaResult.data ?? [], supabase),
  };
});

export const getHomepage = cache(async (): Promise<HomepageContent> => {
  const empty: HomepageContent = { id: 1, featured_project_id: null, secondary_one_id: null, secondary_two_id: null, editorial_one_path: "", editorial_one_alt: "", editorial_two_path: "", editorial_two_alt: "" };
  if (!isSupabaseConfigured()) return empty;
  const supabase = await createClient();
  const { data, error } = await supabase.from("homepage_content").select("*").eq("id", 1).single();
  if (error) dataError("homepage content", error.message);
  return { ...data, editorial_one_url: await resolveMediaUrl(data.editorial_one_path, supabase), editorial_two_url: await resolveMediaUrl(data.editorial_two_path, supabase) };
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
