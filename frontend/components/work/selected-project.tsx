import Link from "next/link";
import type { Project } from "@api/contracts/cms";
import { MediaFrame } from "@frontend/components/media/media-frame";
import { MEDIA_SIZES } from "@frontend/components/media/media-spec";

export function SelectedProject({ project, slot }: { project?: Project; slot?: number }) {
  const sizes = slot === 1 ? MEDIA_SIZES.full : MEDIA_SIZES.half;
  if (!project) return <div className="selected-placeholder"><MediaFrame className="project-image" alt={`Selected work slot ${slot}, awaiting a project`} sizes={sizes} /></div>;
  return <Link className="selected-project" href={`/work/${project.slug}`}>
    <MediaFrame className="project-image" src={project.cover_image_url} alt={project.cover_alt} sizes={sizes} />
    <div className="project-caption"><h3>{project.title}</h3><span>Explore ↗</span></div>
  </Link>;
}
