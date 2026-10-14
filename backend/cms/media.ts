import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectMedia } from "@api/contracts/cms";

export const MEDIA_BUCKET = "portfolio-media";
export const SIGNED_URL_LIFETIME = 300;

/** CMS fields store raw object paths. Existing bundled assets keep /images URLs. */
export async function resolveMediaUrl(path: string, supabase: SupabaseClient): Promise<string> {
  if (!path || path.startsWith("/")) return path;
  let storagePath = path;
  if (/^https?:\/\//i.test(path)) {
    const parsed = new URL(path);
    const configuredUrl = process.env.SUPABASE_URL;
    if (!configuredUrl || parsed.origin !== new URL(configuredUrl).origin) return path;
    const prefix = `/storage/v1/object/`;
    const match = parsed.pathname.match(new RegExp(`^${prefix}(?:public|sign|authenticated)/${MEDIA_BUCKET}/(.+)$`));
    if (!match) return path;
    storagePath = decodeURIComponent(match[1]);
  }
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_LIFETIME);
  if (error || !data?.signedUrl) {
    throw new Error(`Cannot load project image "${storagePath}": ${error?.message ?? "No signed URL returned"}`);
  }
  return data.signedUrl;
}

export async function resolveProjectMedia(media: ProjectMedia[], supabase: SupabaseClient): Promise<ProjectMedia[]> {
  return Promise.all(media.map(async (item) => ({
    ...item,
    url: await resolveMediaUrl(item.storage_path, supabase),
  })));
}
