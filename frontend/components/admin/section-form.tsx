import type { ProjectSection } from "@api/contracts/cms";
import { ActionForm, Field } from "./action-form";
import type { FormAction } from "@api/contracts/action-state";

const sectionTypes = [
  ["text", "Heading + text"], ["image", "Large image"], ["image_pair", "Image pair"], ["gallery", "Image gallery"],
  ["quote", "Pull quote"], ["split", "Challenge / solution"], ["tools", "Tool list"], ["full_width", "Full-width visual"],
  ["reflection", "Result / reflection"], ["external_link", "External link"],
] as const;

export function SectionForm({ section, action, order = 0 }: { section?: ProjectSection; action: FormAction; order?: number }) {
  return <ActionForm action={action} submitLabel={section ? "Save section" : "Add section"}>
    <div className="admin-grid"><label className="admin-field"><span>Block type</span><select name="section_type" defaultValue={section?.section_type ?? "text"}>{sectionTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <Field label="Display order" name="sort_order" value={section?.sort_order ?? order} type="number" min={0} hint="Lower numbers appear first; change these values to reorder blocks." /></div>
    <Field label="Heading" name="heading" value={section?.heading} />
    <Field label="Content" name="body" value={section?.body} multiline rows={5} hint="Text blocks accept paragraphs. Tools: separate with commas. Challenge / solution: separate the two parts with a blank line. External link: paste one complete http(s) URL. Image blocks: enter gallery image IDs, separated by commas; leave blank to use the gallery in display order." />
  </ActionForm>;
}
