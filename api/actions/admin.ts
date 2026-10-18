"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@backend/supabase/auth";
import { createClient } from "@backend/supabase/server";
import { capabilitySchema, formValues, mediaSchema, projectSchema, settingsFields, settingsSchema } from "@api/validation/cms";
import type { ActionState } from "@api/contracts/action-state";

const uuid = z.uuid();
const invalid = (error: z.ZodError): ActionState => ({ message: "Some details need attention before saving.", errors: error.flatten().fieldErrors });
const failure = (code?: string): ActionState => ({ message: code === "23505" ? "That slug or project number is already in use. Choose a different one." : "The change could not be saved. Check your connection and Supabase setup, then try again." });
function refresh(slugs: string[] = [], globalSettings = false) {
  revalidatePath("/", globalSettings ? "layout" : "page"); revalidatePath("/work"); revalidatePath("/admin", "layout");
  slugs.filter(Boolean).forEach((slug) => revalidatePath(`/work/${slug}`));
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

export async function setPublished(id: string, published: boolean, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(id).success || form.get("confirm") !== "yes") return { message: "Confirm this publication change first." };
  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) return { message: "This project no longer exists." };
  if (published) {
    const values = { ...project, tools: project.tools.join(", "), year: project.year?.toString() ?? "", project_number: String(project.project_number), sort_order: String(project.sort_order) };
    const parsed = projectSchema.safeParse(values);
    if (!parsed.success) return invalid(parsed.error);
    if (!project.cover_image_url || !project.cover_alt.trim()) return { message: "Upload a cover and add its alt text before publishing." };
    const { data: gallery, error: galleryError } = await supabase.from("project_media").select("slot,layout,alt_text").eq("project_id", id).not("slot", "is", null);
    const total = project.gallery_layout === "mixed" ? 5 : 6;
    if (galleryError || !gallery || gallery.length !== total || gallery.some(m => !m.alt_text.trim() || m.slot >= total || m.layout !== (project.gallery_layout === "mixed" && m.slot < 3 ? "portrait" : "half"))) return { message: `Complete all ${total} Visual Board slots and their alt text before publishing.` };
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
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return failure(error.code);
  refresh([project.slug]);
  redirect("/admin?notice=deleted");
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
  const parsed = z.string().trim().min(1, "Cover image alt text is required.").max(160).safeParse(form.get("cover_alt"));
  if (!parsed.success) return invalid(parsed.error);
  const { data: project, error } = await supabase.from("projects").update({ cover_alt: parsed.data }).eq("id", projectId).select("slug").single();
  if (error || !project) return failure(error?.code);
  refresh([project.slug]); return { success: true, message: "Cover image description saved." };
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
