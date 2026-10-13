import type { Project } from "@/lib/cms/types";
import { ActionForm, Field, type FormAction } from "./action-form";

export function ProjectForm({ project, action }: { project?: Project; action: FormAction }) {
  return <ActionForm action={action} submitLabel={project ? "Save project details" : "Create draft"}>
    <div className="admin-grid">
      <Field label="Project title" name="title" value={project?.title} required />
      <Field label="URL slug" name="slug" value={project?.slug} required hint="Lowercase letters, numbers, and hyphens. Changing a published slug changes its address." placeholder="project-name" />
      <Field label="Project number" name="project_number" value={project?.project_number ?? 1} type="number" min={1} max={9999} required />
      <Field label="Display order" name="sort_order" value={project?.sort_order ?? 0} type="number" min={0} hint="Lower numbers appear first." />
      <Field label="Category" name="category" value={project?.category} required placeholder="E-commerce / Full-stack website" />
      <Field label="Project type" name="project_type" value={project?.project_type} required placeholder="Personal project / Independent redesign concept" />
      <Field label="Year" name="year" value={project?.year} type="number" min={1900} max={2100} hint="Leave blank when the year is not confirmed." />
      <Field label="Status" name="status" value={project?.status} placeholder="Live / Redesign concept" hint="Leave blank when the current status is not confirmed." />
    </div>
    <Field label="One-sentence story" name="short_description" value={project?.short_description} multiline rows={2} required />
    <Field label="Project overview" name="overview" value={project?.overview} multiline rows={5} hint="Use only verified context. Add detailed story sections below after creating a draft." />
    <Field label="Your role" name="role" value={project?.role} required />
    <Field label="Tools" name="tools" value={project?.tools.join(", ")} hint="Separate tools with commas or new lines." />
    <div className="admin-grid"><Field label="Live website URL" name="live_url" value={project?.live_url} type="url" /><Field label="Repository URL" name="repository_url" value={project?.repository_url} type="url" /></div>
  </ActionForm>;
}
