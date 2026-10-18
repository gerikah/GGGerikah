import Image from "next/image";
import Link from "next/link";
import type { Project } from "@api/contracts/cms";
export function SelectedProject({ project, slot }: { project?: Project; slot?: number }) {
  if (!project) return <div className="selected-placeholder" role="img" aria-label={`Selected work slot ${slot}, awaiting a project`}><div className="project-image" /></div>;
  return <Link className="selected-project" href={`/work/${project.slug}`}><div className="project-image">{project.cover_image_url && <Image src={project.cover_image_url} alt={project.cover_alt} fill sizes={slot === 1 ? "83vw" : "(max-width: 600px) 88vw, 40vw"} />}</div><div className="project-caption"><h3>{project.title}</h3><span>Explore ↗</span></div></Link>;
}
