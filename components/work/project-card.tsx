import Image from "next/image";
import { ProjectLink, Reveal } from "@/components/motion/archive-motion";
import type { Project } from "@/lib/cms/types";

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const number = String(project.project_number).padStart(2, "0");
  return <article className="project-card"><div className="project-rail mono"><span>PROJECT {number}</span><span>{project.category}</span><span>{String(index + 1).padStart(2, "0")} / SELECTED WORK</span></div>
    <ProjectLink href={`/work/${project.slug}`} className="project-visual-link" label={`View ${project.title} case study`}><Reveal paper className="project-visual"><span className="image-registration mono" aria-hidden="true">GA / {number}</span>{project.cover_image_url ? <Image src={project.cover_image_url} alt={project.cover_alt} fill sizes="(max-width: 760px) 92vw, 90vw" className="project-cover" /> : <div className="missing-cover"><span className="mono">VISUAL IN PROGRESS</span><span>{project.title}</span></div>}<span className="project-cursor mono" aria-hidden="true">VIEW PROJECT ↗</span><span className="project-image-label mono">DESIGN + BUILD / {number}</span></Reveal></ProjectLink>
    <div className="project-caption"><div><ProjectLink href={`/work/${project.slug}`} className="project-title-link"><h3>{project.title}<span aria-hidden="true">↗</span></h3></ProjectLink><p>{project.short_description}</p>{/independent/i.test(project.project_type) && <span className="concept-label mono">INDEPENDENT REDESIGN CONCEPT</span>}</div><div className="project-details"><span className="mono">{project.tools.join(" / ")}</span><ProjectLink href={`/work/${project.slug}`} className="text-link">View case study <span aria-hidden="true">↗</span></ProjectLink></div></div>
  </article>;
}
