import "server-only";
import { randomUUID, createHash } from "node:crypto";
import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
export async function uploadImage(supabase: SupabaseClient, file: FormDataEntryValue | null, folder: string): Promise<{ path: string; error?: never } | { error: string; path?: never }> {
  if (!(file instanceof File) || !file.size) return { error: "Choose an image to upload." };
  if (file.size > 3 * 1024 * 1024) return { error: "Images must be 3 MB or smaller." };
  const extension = new Map([["image/png", "png"], ["image/jpeg", "jpg"], ["image/webp", "webp"]]).get(file.type);
  if (!extension) return { error: "Choose a PNG, JPG, or WebP image." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const genuine = file.type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : file.type === "image/png" ? [137,80,78,71,13,10,26,10].every((n,i) => bytes[i] === n) : bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP";
  if (!genuine) return { error: "The image contents do not match the file format. Export it again as PNG, JPG, or WebP." };
  let dimensions: { width?: number; height?: number };
  try { dimensions = await sharp(bytes, { limitInputPixels: 40_000_000 }).metadata(); }
  catch { return { error: "This image cannot be decoded. Export it again as PNG, JPG or WebP." }; }
  const hash = createHash("sha256").update(bytes).digest("hex");
  const existing = await supabase.from("media_assets").select("storage_path").eq("sha256", hash).eq("deleting", false).limit(1).maybeSingle();
  if (existing.error) return { error: "The Media Library is unavailable. Apply the CMS workspace migration before uploading." };
  if (existing.data) {
    const present = await supabase.storage.from("portfolio-media").createSignedUrl(existing.data.storage_path, 60);
    if (present.error) return { error: "An identical image is indexed but its stored file cannot be read. Check the library before retrying; your saved image is unchanged." };
    return { path: existing.data.storage_path };
  }
  const path = `${folder}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("portfolio-media").upload(path, bytes, { contentType: file.type, cacheControl: "3600", upsert: false });
  if (error) return { error: `Upload failed: ${error.message}. Your saved image has not changed.` };
  const indexed = await supabase.from("media_assets").insert({ storage_path: path, filename: file.name.slice(0,255), content_type: file.type, byte_size: file.size, width: dimensions.width, height: dimensions.height, sha256: hash });
  if (indexed.error) {
    const cleanup = await supabase.storage.from("portfolio-media").remove([path]);
    return { error: cleanup.error ? "The upload could not be indexed or cleaned up. Your saved image is unchanged; run media reconciliation before retrying." : "The upload could not be saved to the Media Library. Your saved image is unchanged. Please retry." };
  }
  return { path };
}
