"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@backend/supabase/auth";
import { uploadImage } from "@backend/cms/upload";
import { formValues, projectFields, draftProjectSchema, mediaSchema } from "@api/validation/cms";
import type { ActionState } from "@api/contracts/action-state";
const uuid = z.uuid();
function refresh() { revalidatePath("/", "layout"); revalidatePath("/admin", "layout"); }
function failure(error: { code?: string; message: string }): ActionState { return { message: error.code === "23505" ? "That slug is already in use. Choose another slug; your entered values are preserved." : `Could not save: ${error.message}` }; }

export async function saveEditorialProject(id: string | null, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (id && !uuid.safeParse(id).success) return { message: "Invalid project." };
  const candidate = form.get("draft_id");
  const projectId = id ?? (uuid.safeParse(candidate).success ? String(candidate) : randomUUID());
  const values = formValues(form, projectFields);
  const parsed = draftProjectSchema.safeParse({ ...values, title: values.title.trim() || "Untitled project", slug: values.slug.trim() || `draft-${projectId}` });
  if (!parsed.success) return { message: "Check the fields below. Your values have been preserved.", errors: parsed.error.flatten().fieldErrors };
  const file = form.get("cover_file");
  let path: string | null = null;
  let alt: string | null = null;
  if (file instanceof File && file.size) {
    const result = z.string().trim().min(1, "Cover alt text is required when uploading a cover.").max(160).safeParse(form.get("cover_alt"));
    if (!result.success) return { message: "Add cover alt text (1–160 characters)." };
    alt = result.data;
    const upload = await uploadImage(supabase, file, projectId);
    if (upload.error) return { message: upload.error };
    path = upload.path!;
  }
  const { error } = await supabase.rpc("save_editorial_project", { p_id: projectId, p_details: parsed.data, p_cover_path: path, p_cover_alt: alt });
  if (error) { return failure(error); }
  refresh();
  const next = form.get("next_step");
  if (!id || next === "images" || next === "review") redirect(`/admin/projects/${projectId}?step=${next === "images" || next === "review" ? next : "details"}&notice=saved`);
  return { success: true, message: "Project saved. Displaced gallery images remain in Unassigned media." };
}

export async function uploadCover(id: string, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(id).success) return { message: "Invalid project." };
  const alt = z.string().trim().min(1).max(160).safeParse(form.get("cover_alt"));
  if (!alt.success) return { message: "Cover alt text must contain 1–160 characters." };
  const { data: project } = await supabase.from("projects").select("id").eq("id", id).single();
  if (!project) return { message: "Project not found." };
  const upload = await uploadImage(supabase, form.get("file"), id);
  if (upload.error) return { message: upload.error };
  const { error } = await supabase.from("projects").update({ cover_image_url: upload.path, cover_alt: alt.data }).eq("id", id).select("id").single();
  if (error) { return failure(error); }
  refresh(); return { success: true, message: "Cover uploaded and saved. The previous file is retained in storage." };
}

export async function uploadGallerySlot(id: string, slot: number, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(id).success) return { message: "Invalid project." };
  const { data: project } = await supabase.from("projects").select("gallery_layout").eq("id", id).single();
  if (!project || !Number.isInteger(slot) || slot < 0 || slot >= (project.gallery_layout === "mixed" ? 5 : 6)) return { message: "Save the layout and reload the gallery before uploading." };
  const layout = project.gallery_layout === "mixed" && slot < 3 ? "portrait" : "half";
  const parsed = mediaSchema.safeParse({ ...formValues(form, ["alt_text", "caption"]), layout, sort_order: slot });
  if (!parsed.success) return { message: "Check the image details.", errors: parsed.error.flatten().fieldErrors };
  const upload = await uploadImage(supabase, form.get("file"), id);
  if (upload.error) return { message: upload.error };
  const { data, error } = await supabase.from("project_media").insert({ ...parsed.data, project_id: id, storage_path: upload.path, slot: null }).select("id").single();
  if (error || !data) { return failure(error!); }
  const assigned = await supabase.rpc("assign_gallery_image", { p_project_id: id, p_media_id: data.id, p_slot: slot });
  if (assigned.error) { refresh(); return { message: `Uploaded to Unassigned media, but could not fill the slot: ${assigned.error.message}. The original slot is unchanged.` }; }
  refresh(); return { success: true, message: "Image saved in the gallery slot. Any replaced image is in Unassigned media." };
}

export async function assignGallery(id: string, mediaId: string, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(id).success || !uuid.safeParse(mediaId).success) return { message: "Invalid image." };
  const value = form.get("slot");
  const slot = value === "unassigned" ? null : Number(value);
  if (slot !== null && (!Number.isInteger(slot) || slot < 0 || slot > 5)) return { message: "Choose a valid slot." };
  const { error } = await supabase.rpc("assign_gallery_image", { p_project_id: id, p_media_id: mediaId, p_slot: slot });
  if (error) return failure(error);
  refresh(); return { success: true, message: "Gallery updated. Compatible occupied slots are swapped." };
}

export async function saveHomepage(_state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const fields = ["featured_project_id", "secondary_one_id", "secondary_two_id"];
  const values = fields.map(f => String(form.get(f) || ""));
  if (values.some(v => v && !uuid.safeParse(v).success)) return { message: "Choose a published project or an empty slot." };
  const selected = values.filter(Boolean);
  if (new Set(selected).size !== selected.length) return { message: "Choose a different project for each homepage slot." };
  const { error } = await supabase.from("homepage_content").update(Object.fromEntries(fields.map((f,i) => [f, values[i] || null]))).eq("id", 1);
  if (error) return failure(error);
  refresh(); return { success: true, message: "Homepage projects saved." };
}

export async function saveEditorialImage(position: "one" | "two", _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!["one", "two"].includes(position)) return { message: "Invalid image position." };
  const remove = form.get("remove") === "yes";
  if (remove && form.get("confirm") !== "yes") return { message: "Confirm image removal." };
  const alt = z.string().trim().min(1).max(160).safeParse(form.get("alt_text"));
  if (!remove && !alt.success) return { message: "Add image alt text (1–160 characters)." };
  let path = "";
  if (!remove) { const upload = await uploadImage(supabase, form.get("file"), "homepage"); if (upload.error) return { message: upload.error }; path = upload.path!; }
  const { error } = await supabase.from("homepage_content").update({ [`editorial_${position}_path`]: path, [`editorial_${position}_alt`]: remove ? "" : alt.data }).eq("id", 1);
  if (error) { return failure(error); }
  refresh(); return { success: true, message: remove ? "Editorial image removed. Its placeholder is visible." : "Editorial image saved." };
}

export async function saveEditorialAlt(position: "one" | "two", _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!["one","two"].includes(position)) return { message: "Invalid image position." };
  const alt = z.string().trim().min(1).max(160).safeParse(form.get("alt_text"));
  if (!alt.success) return { message: "Add alt text between 1 and 160 characters." };
  const result = await supabase.from("homepage_content").update({ [`editorial_${position}_alt`]: alt.data }).eq("id",1);
  if(result.error) return failure(result.error);
  refresh(); return { success: true, message: "Editorial image alt text saved." };
}
