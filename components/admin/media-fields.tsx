import type { ProjectMedia } from "@/lib/cms/types";
import { Field } from "./action-form";

export function MediaFields({ media, order = 0 }: { media?: ProjectMedia; order?: number }) {
  return <><Field label="Image description / alt text" name="alt_text" value={media?.alt_text} required hint="Describe what the image shows. Meaningful images need useful alt text." />
    <Field label="Caption" name="caption" value={media?.caption} multiline rows={2} />
    <div className="admin-grid"><Field label="Display order" name="sort_order" value={media?.sort_order ?? order} type="number" min={0} />
      <label className="admin-field"><span>Gallery layout</span><select name="layout" defaultValue={media?.layout ?? "full"}><option value="full">Full width</option><option value="half">Half width</option><option value="portrait">Portrait</option></select></label></div></>;
}
