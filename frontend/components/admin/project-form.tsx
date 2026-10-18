"use client";
import { useState } from "react";
import type { Project } from "@api/contracts/cms";
import { ActionForm, Field } from "./action-form";
import { ImageInput } from "./image-input";
import type { FormAction } from "@api/contracts/action-state";
import { formValues, projectFields, projectSchema } from "@api/validation/cms";
export function ProjectForm({ project, action }: { project?: Project; action: FormAction }) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [editedSlug, setEditedSlug] = useState(Boolean(project));
  const [layout, setLayout] = useState(project?.gallery_layout ?? "landscape");
  const validatedAction: FormAction = async (state, form) => {
    const parsed = projectSchema.safeParse(formValues(form, projectFields));
    if (!parsed.success) return { message: "Check the fields below. Your values have been preserved.", errors: parsed.error.flatten().fieldErrors };
    return action(state, form);
  };
  return <ActionForm action={validatedAction} submitLabel={project ? "Save project details" : "Save draft"}>
    <div className="admin-grid"><label className="admin-field"><span>Title *</span><input name="title" value={title} required onChange={e => { setTitle(e.target.value); if (!editedSlug) setSlug(e.target.value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} /><small>{title.length} / 45</small></label><label className="admin-field"><span>Slug *</span><input name="slug" value={slug} required onChange={e => { setEditedSlug(true); setSlug(e.target.value); }} /><small>{slug.length} / 60 · URL-safe and unique</small></label></div>
    <Field name="short_description" label="Subtitle" value={project?.short_description} limit={100} required />
    <div className="admin-grid"><Field name="role" label="Role" value={project?.role} limit={70} required /><Field name="year" label="Year" value={project?.year ?? new Date().getFullYear()} type="number" min={1900} max={2200} limit={4} required /><label className="admin-field"><span>Status *</span><select name="status" defaultValue={project?.status || "Concept"}>{["Concept", "In Progress", "Completed"].map(s => <option key={s}>{s}</option>)}</select></label><label className="admin-field"><span>Project type *</span><select name="project_type" defaultValue={project?.project_type || "Personal Project"}>{["Personal Project", "Independent Concept", "Academic Project", "Client Work"].map(s => <option key={s}>{s}</option>)}</select></label></div>
    <Field name="tools" label="Stack" value={project?.tools.join(", ")} limit={214} hint="Up to 8 entries, 25 characters each. Separate entries with commas." />
    <div className="admin-grid"><div><Field name="section_one_heading" label="First heading" value={project?.section_one_heading ?? "The Idea"} limit={40} required /><Field name="section_one_body" label="First description" value={project?.section_one_body} limit={400} multiline required /></div><div><Field name="section_two_heading" label="Second heading" value={project?.section_two_heading ?? "The Build"} limit={40} required /><Field name="section_two_body" label="Second description" value={project?.section_two_body} limit={400} multiline required /></div></div>
    <fieldset className="layout-selector"><legend>Visual Board Layout</legend><div className="admin-grid">{(["landscape", "mixed"] as const).map(option => <label key={option} className={`layout-option ${layout === option ? "is-selected" : ""}`}><input type="radio" name="gallery_layout" value={option} checked={layout === option} onChange={() => setLayout(option)} /><strong>{option === "landscape" ? "Option A — All Landscape" : "Option B — Portrait + Landscape"}</strong><span className={`layout-mini layout-mini--${option}`} aria-hidden="true">{Array.from({ length: option === "landscape" ? 6 : 5 }, (_, i) => <i key={i} />)}</span><small>{option === "landscape" ? "6 landscape images · 16:9 · 1280 × 720 px" : "3 portraits · 3:4 · 900 × 1200 px; 2 landscape · 16:9 · 1280 × 720 px"}</small></label>)}</div><p>Save to update gallery slots. Compatible images keep their positions; displaced images remain in Unassigned media. Unpublish before changing a published layout.</p></fieldset>
    <div className="admin-grid"><Field name="live_url" label="Live Website URL" value={project?.live_url} type="url" limit={2048} /><Field name="repository_url" label="GitHub URL" value={project?.repository_url} type="url" limit={2048} /><Field name="figma_url" label="Figma URL" value={project?.figma_url} type="url" limit={2048} /><Field name="sort_order" label="Archive order" value={project?.sort_order ?? 0} type="number" min={0} max={99999} /></div>
    {!project && <fieldset><legend>Cover image</legend><p>Optional for a draft. Required before publishing; separate from the Visual Board.</p><ImageInput name="cover_file" /><Field name="cover_alt" label="Cover alt text" limit={160} /></fieldset>}
  </ActionForm>;
}
