"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@backend/supabase/auth";
import { createClient } from "@backend/supabase/server";
import { capabilitySchema, formValues, mediaSchema, projectFields, projectSchema, sectionSchema, settingsFields, settingsSchema } from "@api/validation/cms";
import type { ActionState } from "@api/contracts/action-state";

const uuid = z.uuid();
const invalid = (error: z.ZodError): ActionState => ({ message: "Some details need attention before saving.", errors: error.flatten().fieldErrors });
const failure = (code?: string): ActionState => ({ message: code === "23505" ? "That slug or project number is already in use. Choose a different one." : "The change could not be saved. Check your connection and Supabase setup, then try again." });
function refresh(slugs: string[] = [], globalSettings = false) {
  revalidatePath("/", globalSettings ? "layout" : "page"); revalidatePath("/work"); revalidatePath("/admin", "layout");
  slugs.filter(Boolean).forEach((slug) => revalidatePath(`/work/${slug}`));
}
function safeStoragePath(path: string, projectId: string) {
  return path.startsWith(`${projectId}/`) && !path.includes("..") && !path.includes("\\") && /^[a-zA-Z0-9/._-]+$/.test(path);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function saveSettings(_state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = settingsSchema.safeParse(formValues(form, settingsFields));
  if (!parsed.success) return invalid(parsed.error);
  const { error } = await supabase.from("site_settings").upsert({ id: 1, ...parsed.data });
  if (error) return failure(error.code);
  refresh([], true); return { success: true, message: "Site details saved. Your public portfolio is up to date." };
}

export async function createProject(_state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = projectSchema.safeParse(formValues(form, projectFields));
  if (!parsed.success) return invalid(parsed.error);
  const { data, error } = await supabase.from("projects").insert({ ...parsed.data, is_published: false }).select("id").single();
  if (error || !data) return failure(error?.code);
  refresh(); redirect(`/admin/projects/${data.id}?notice=created`);
}

export async function saveProject(id: string, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(id).success) return { message: "This project could not be found." };
  const parsed = projectSchema.safeParse(formValues(form, projectFields));
  if (!parsed.success) return invalid(parsed.error);
  const { data: old } = await supabase.from("projects").select("slug").eq("id", id).single();
  if (!old) return { message: "This project no longer exists." };
  const { error } = await supabase.from("projects").update(parsed.data).eq("id", id);
  if (error) return failure(error.code);
  refresh([old.slug, parsed.data.slug]); return { success: true, message: "Project details saved." };
}

export async function setPublished(id: string, published: boolean, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(id).success || form.get("confirm") !== "yes") return { message: "Confirm this publication change first." };
  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) return { message: "This project no longer exists." };
  if (published) {
    const values = { ...project, tools: project.tools.join(", "), year: project.year?.toString() ?? "", project_number: String(project.project_number), sort_order: String(project.sort_order) };
    const parsed = projectSchema.safeParse(values);
    if (!parsed.success) return invalid(parsed.error);
    if (project.cover_image_url && !project.cover_alt.trim()) return { message: "Add cover image alt text before publishing." };
  }
  const { error } = await supabase.from("projects").update({ is_published: published }).eq("id", id);
  if (error) return failure(error.code);
  refresh([project.slug]); return { success: true, message: published ? "Project published. It is now visible in the public archive." : "Project moved to draft. It is no longer visible to visitors." };
}

export async function deleteProject(id: string, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(id).success || form.get("confirm") !== "yes") return { message: "Confirm permanent deletion first." };
  const { data: project } = await supabase.from("projects").select("slug, cover_image_url").eq("id", id).single();
  if (!project) return { message: "This project no longer exists." };
  const { data: media, error: mediaError } = await supabase.from("project_media").select("storage_path").eq("project_id", id);
  if (mediaError) return failure(mediaError.code);
  const paths = [...new Set([...(media ?? []).map((item) => item.storage_path), project.cover_image_url])].filter((path) => safeStoragePath(path, id));
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return failure(error.code);
  const cleanup = paths.length ? await supabase.storage.from("portfolio-media").remove(paths) : null;
  refresh([project.slug]);
  redirect(cleanup?.error ? "/admin?notice=deleted-storage-warning" : "/admin?notice=deleted");
}

export async function saveSection(projectId: string, sectionId: string | null, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(projectId).success || (sectionId && !uuid.safeParse(sectionId).success)) return { message: "This section could not be found." };
  const parsed = sectionSchema.safeParse(formValues(form, ["section_type", "heading", "body", "sort_order"]));
  if (!parsed.success) return invalid(parsed.error);
  const { data: project } = await supabase.from("projects").select("slug").eq("id", projectId).single();
  if (!project) return { message: "This project no longer exists." };
  const result = sectionId
    ? await supabase.from("project_sections").update(parsed.data).eq("id", sectionId).eq("project_id", projectId).select("id").single()
    : await supabase.from("project_sections").insert({ ...parsed.data, project_id: projectId }).select("id").single();
  if (result.error) return failure(result.error.code);
  refresh([project.slug]); return { success: true, message: sectionId ? "Section updated." : "Section added." };
}

export async function deleteSection(projectId: string, sectionId: string, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(projectId).success || !uuid.safeParse(sectionId).success || form.get("confirm") !== "yes") return { message: "Confirm section deletion first." };
  const { data: project } = await supabase.from("projects").select("slug").eq("id", projectId).single();
  if (!project) return { message: "This project no longer exists." };
  const { error } = await supabase.from("project_sections").delete().eq("id", sectionId).eq("project_id", projectId);
  if (error) return failure(error.code);
  refresh([project.slug]); return { success: true, message: "Section deleted." };
}

export async function uploadMedia(projectId: string, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(projectId).success) return { message: "This project could not be found." };
  const parsed = mediaSchema.safeParse(formValues(form, ["alt_text", "caption", "layout", "sort_order"]));
  if (!parsed.success) return invalid(parsed.error);
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { message: "Choose an image to upload." };
  if (file.size > 10 * 1024 * 1024) return { message: "Images must be 10 MB or smaller. Compress the image and try again." };
  const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
  const extension = allowed.get(file.type);
  if (!extension) return { message: "Upload a JPEG, PNG, or WebP image." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const genuine = file.type === "image/jpeg" ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : file.type === "image/png" ? [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
    : bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (!genuine) return { message: "This file does not match its image format. Export it as JPEG, PNG, or WebP and try again." };
  const { data: project } = await supabase.from("projects").select("slug").eq("id", projectId).single();
  if (!project) return { message: "This project no longer exists." };
  const storagePath = `${projectId}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("portfolio-media").upload(storagePath, bytes, { contentType: file.type, cacheControl: "3600", upsert: false });
  if (uploadError) return { message: "The upload failed. Check that the portfolio-media bucket and its admin policies are configured." };
  const { error } = await supabase.from("project_media").insert({ project_id: projectId, storage_path: storagePath, media_type: "image", ...parsed.data });
  if (error) {
    await supabase.storage.from("portfolio-media").remove([storagePath]);
    return failure(error.code);
  }
  refresh([project.slug]); return { success: true, message: "Image uploaded to the project gallery. Choose Set as cover to use it on project cards." };
}

export async function saveMedia(projectId: string, mediaId: string, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(projectId).success || !uuid.safeParse(mediaId).success) return { message: "This image could not be found." };
  const parsed = mediaSchema.safeParse(formValues(form, ["alt_text", "caption", "layout", "sort_order"]));
  if (!parsed.success) return invalid(parsed.error);
  const { data: project } = await supabase.from("projects").select("slug,cover_image_url").eq("id", projectId).single();
  const { data: media } = await supabase.from("project_media").select("storage_path").eq("id", mediaId).eq("project_id", projectId).single();
  if (!project || !media) return { message: "This image or project no longer exists." };
  const { error } = await supabase.from("project_media").update(parsed.data).eq("id", mediaId).eq("project_id", projectId);
  if (error) return failure(error.code);
  if (project.cover_image_url === media.storage_path) {
    const { error: coverError } = await supabase.from("projects").update({ cover_alt: parsed.data.alt_text }).eq("id", projectId);
    if (coverError) {
      refresh([project.slug]);
      return { message: "Image details saved, but the cover description could not be updated. Save the cover description in the Cover section before continuing." };
    }
  }
  refresh([project.slug]); return { success: true, message: "Image details saved." };
}

export async function setCover(projectId: string, mediaId: string, _state: ActionState, _form: FormData): Promise<ActionState> {
  void _state; void _form;
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(projectId).success || !uuid.safeParse(mediaId).success) return { message: "This image could not be found." };
  const { data: media } = await supabase.from("project_media").select("storage_path,alt_text").eq("id", mediaId).eq("project_id", projectId).single();
  if (!media?.alt_text.trim()) return { message: "Add image alt text before using it as a cover." };
  const { data: project, error } = await supabase.from("projects").update({ cover_image_url: media.storage_path, cover_alt: media.alt_text }).eq("id", projectId).select("slug").single();
  if (error || !project) return failure(error?.code);
  refresh([project.slug]); return { success: true, message: "Project cover updated." };
}

export async function clearCover(projectId: string, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(projectId).success || form.get("confirm") !== "yes") return { message: "Confirm cover removal first." };
  const { data, error } = await supabase.from("projects").update({ cover_image_url: "", cover_alt: "" }).eq("id", projectId).select("slug").single();
  if (error || !data) return failure(error?.code);
  refresh([data.slug]); return { success: true, message: "Cover removed. The project will show an asset placeholder until you set a new cover." };
}

export async function saveCoverAlt(projectId: string, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(projectId).success) return { message: "This project could not be found." };
  const parsed = z.string().trim().min(1, "Cover image alt text is required.").max(500).safeParse(form.get("cover_alt"));
  if (!parsed.success) return invalid(parsed.error);
  const { data: project, error } = await supabase.from("projects").update({ cover_alt: parsed.data }).eq("id", projectId).select("slug").single();
  if (error || !project) return failure(error?.code);
  refresh([project.slug]); return { success: true, message: "Cover image description saved." };
}

export async function deleteMedia(projectId: string, mediaId: string, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(projectId).success || !uuid.safeParse(mediaId).success || form.get("confirm") !== "yes") return { message: "Confirm image deletion first." };
  // The database removes the media row and clears a matching cover in one transaction.
  const { data, error } = await supabase.rpc("delete_project_media", { p_project_id: projectId, p_media_id: mediaId });
  if (error) return error.code === "P0002" ? { message: "This image or project no longer exists." } : failure(error.code);
  const deleted = (data as { storage_path: string; slug: string }[] | null)?.[0];
  if (!deleted) return { message: "The image could not be deleted. Confirm the database migration has been applied, then try again." };
  const cleanup = safeStoragePath(deleted.storage_path, projectId) ? await supabase.storage.from("portfolio-media").remove([deleted.storage_path]) : null;
  refresh([deleted.slug]);
  return cleanup?.error ? { message: "Image removed from the project, but storage cleanup failed. Remove the unused file in Supabase Storage." } : { success: true, message: "Image deleted." };
}

export async function saveCapability(id: string | null, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (id && !uuid.safeParse(id).success) return { message: "This item could not be found." };
  const parsed = capabilitySchema.safeParse({ ...formValues(form, ["title", "description", "kind", "sort_order"]), is_published: form.get("is_published") === "yes" });
  if (!parsed.success) return invalid(parsed.error);
  const result = id ? await supabase.from("capabilities").update(parsed.data).eq("id", id).select("id").single() : await supabase.from("capabilities").insert(parsed.data).select("id").single();
  if (result.error) return failure(result.error.code);
  refresh(); return { success: true, message: id ? "Item updated." : "Item added." };
}

export async function deleteCapability(id: string, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(id).success || form.get("confirm") !== "yes") return { message: "Confirm item deletion first." };
  const { error } = await supabase.from("capabilities").delete().eq("id", id);
  if (error) return failure(error.code);
  refresh(); return { success: true, message: "Item deleted." };
}
