import Image from "next/image";
import { ProjectLink, Reveal } from "@frontend/components/motion/archive-motion";
import { imageDimensions } from "@frontend/lib/image-dimensions";
import type { Project } from "@api/contracts/cms";
import { getProject } from "@backend/cms/data";
import { CasePreview } from "@frontend/components/case-study/preview";

export async function ProjectCard({ project }: { project: Project }) {
  const number = String(project.project_number).padStart(2, "0");
  const dimensions = imageDimensions(project.cover_image_url);
  const study = await getProject(project.slug);
  return <article className="project" data-name={project.title}>
    <div className="project__info">
      <p className="project__num">PROJECT {number} — CASE STUDY</p>
      <h3 className="project__title">{project.title}</h3>
      <p className="project__cat">{project.category}</p>
      <p className="project__story">{project.short_description}</p>
      {/independent/i.test(project.project_type) && <p className="concept-label mono">INDEPENDENT REDESIGN CONCEPT</p>}
      <dl className="project__meta">
        {project.role && <div><dt>Role</dt><dd className="v">{project.role}</dd></div>}
        {project.tools.length > 0 && <div><dt>Build</dt><dd className="v">{project.tools.join(" · ")}</dd></div>}
        {project.year && <div><dt>Year</dt><dd className="v">{project.year}</dd></div>}
        {!project.role && !project.tools.length && <div><dt>Focus</dt><dd className="v">{project.project_type}</dd></div>}
      </dl>
      {study ? <CasePreview study={{ project: study.project, sections: study.sections }} width={dimensions.width} height={dimensions.height} /> : <ProjectLink href={`/work/${project.slug}`} className="btn project__cta" cursor="OPEN"><span>View case study</span><span className="arrow" aria-hidden="true">↗</span></ProjectLink>}
    </div>
    <ProjectLink href={`/work/${project.slug}`} className="project__visual" label={`View ${project.title} case study`} cursor="VIEW PROJECT">
      <span className="project__badge">Cover / {number}</span>
      <Reveal paper className="project__frame">
        {project.cover_image_url ? <Image src={project.cover_image_url} alt={project.cover_alt} width={dimensions.width} height={dimensions.height} sizes="(max-width: 900px) 90vw, (max-width: 1080px) 720px, 650px" className="project__cover" /> : <div className="project__fallback"><span className="eyebrow">Visual in progress</span><span>{project.title}</span></div>}
        <span className="sweep" aria-hidden="true" />
      </Reveal>
    </ProjectLink>
  </article>;
}
