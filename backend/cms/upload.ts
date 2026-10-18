import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
export async function uploadImage(supabase: SupabaseClient, file: FormDataEntryValue | null, folder: string): Promise<{ path: string; error?: never } | { error: string; path?: never }> {
  if (!(file instanceof File) || !file.size) return { error: "Choose an image to upload." };
  if (file.size > 3 * 1024 * 1024) return { error: "Images must be 3 MB or smaller." };
  const extension = new Map([["image/png", "png"], ["image/jpeg", "jpg"], ["image/webp", "webp"]]).get(file.type);
  if (!extension) return { error: "Choose a PNG, JPG, or WebP image." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const genuine = file.type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : file.type === "image/png" ? [137,80,78,71,13,10,26,10].every((n,i) => bytes[i] === n) : bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP";
  if (!genuine) return { error: "The image contents do not match the file format. Export it again as PNG, JPG, or WebP." };
  const path = `${folder}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("portfolio-media").upload(path, bytes, { contentType: file.type, cacheControl: "3600", upsert: false });
  if (error) return { error: `Upload failed: ${error.message}. Your saved image has not changed.` };
  return { path };
}
