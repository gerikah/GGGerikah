"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@backend/supabase/auth";
import { uploadImage } from "@backend/cms/upload";
import type { ActionState } from "@api/contracts/action-state";
function refresh() { revalidatePath("/", "layout"); }
export async function uploadLibraryImage(_state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const upload = await uploadImage(supabase, form.get("file"), "library");
  if (upload.error) return { message: upload.error };
  refresh(); return { success: true, message: "Image saved to the library. Identical files reuse the existing asset. Select its tile to assign it." };
}
export async function assignLibraryImage(_state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = z.object({ asset_id: z.uuid(), target: z.enum(["cover", "gallery", "homepage-one", "homepage-two"]), project_id: z.union([z.uuid(), z.literal("")]), slot: z.coerce.number().int().min(0).max(5), alt_text: z.string().trim().min(1).max(160), caption: z.string().trim().max(90) }).safeParse(Object.fromEntries(["asset_id","target","project_id","slot","alt_text","caption"].map(k => [k, form.get(k) ?? ""])));
  if (!parsed.success) return { message: "Choose an image, a destination and alt text.", errors: parsed.error.flatten().fieldErrors };
  const v = parsed.data;
  if ((v.target === "cover" || v.target === "gallery") && !v.project_id) return { message: "Select a project first." };
  const { error } = await supabase.rpc("assign_library_image", { p_asset_id: v.asset_id, p_target: v.target, p_project_id: v.project_id || null, p_slot: v.target === "gallery" ? v.slot : null, p_alt: v.alt_text, p_caption: v.caption });
  if (error) return { message: `Could not assign image: ${error.message}. Your previous image is unchanged.` };
  refresh(); return { success: true, message: "Image assigned. The previous file remains in the library." };
}
export async function deleteLibraryImage(id: string, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!z.uuid().safeParse(id).success || form.get("confirm") !== "yes") return { message: "Confirm image deletion first." };
  const reserved = await supabase.rpc("begin_media_delete", { p_id: id });
  if (reserved.error) return { message: reserved.error.message };
  const removed = await supabase.storage.from("portfolio-media").remove([reserved.data]);
  if (removed.error) { await supabase.from("media_assets").update({ deleting: false }).eq("id",id); return { message: "The file could not be removed. It remains in the library. Please retry." }; }
  const indexed = await supabase.from("media_assets").delete().eq("id", id).eq("deleting", true);
  refresh();
  return indexed.error ? { message: "File removed, but its library entry still needs cleanup. Retry deletion to finish." } : { success: true, message: "Image deleted from storage and the library." };
}
export async function replaceLibraryImage(id: string, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!z.uuid().safeParse(id).success || form.get("confirm") !== "yes") return { message: "Confirm replacement first." };
  const upload = await uploadImage(supabase, form.get("file"), "library");
  if (upload.error) return { message: upload.error };
  const asset = await supabase.from("media_assets").select("id").eq("storage_path",upload.path).single();
  if (!asset.data) return { message: "Replacement uploaded but could not be located. Refresh the library." };
  const result = await supabase.rpc("replace_library_image", { p_old: id, p_new: asset.data.id });
  refresh();
  return result.error ? { message: `Replacement retained in library; assignments unchanged: ${result.error.message}` } : { success: true, message: "Replacement saved everywhere this image was used. Original file retained in the library." };
}

export async function releaseRetainedImage(id: string, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!z.uuid().safeParse(id).success || form.get("confirm") !== "yes") return { message: "Confirm removal of the retained links." };
  const asset = await supabase.from("media_assets").select("storage_path").eq("id",id).single();
  if(!asset.data) return { message: "Image not found." };
  const result = await supabase.from("project_media").delete().eq("storage_path",asset.data.storage_path).is("slot",null);
  if(result.error) return { message: "Could not remove retained links. Please retry." };
  refresh(); return { success: true, message: "Retained links removed. Assigned gallery slots and the stored image are unchanged." };
}
