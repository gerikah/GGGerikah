import Link from "next/link";
export function EditorSteps({ id, step }: { id?: string; step: string }) {
  return <nav className="admin-steps" aria-label="Project steps">{[["details", "Project details"], ["images", "Images"], ["review", "Review & publish"]].map(([key, title], i) => step === "details" && key !== "details" ? <button key={key} type="submit" form="project-details" name="next_step" value={key}><span>{i + 1}</span>{title}</button> : <Link key={key} href={id ? `/admin/projects/${id}?step=${key}` : "#project-details"} aria-current={key === step ? "step" : undefined}><span>{i + 1}</span>{title}</Link>)}</nav>;
}
