import Image from "next/image";
import { ArrowUpRightIcon as ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { ProjectLink, Reveal } from "@frontend/components/motion/archive-motion";
import { imageDimensions } from "@frontend/lib/image-dimensions";
import type { Project } from "@api/contracts/cms";
import { getProject } from "@backend/cms/data";
import { CasePreview } from "@frontend/components/case-study/preview";

export async function ProjectCard({ project, compact = false }: { project: Project; compact?: boolean }) {
  const dimensions = imageDimensions(project.cover_image_url);
  const study = await getProject(project.slug);
  return <article className="project" data-name={project.title} data-project={project.slug}>
    <ProjectLink href={`/work/${project.slug}`} className="project__visual" label={`View ${project.title} case study`} cursor="VIEW PROJECT">
      <Reveal paper className="project__frame">
        {project.cover_image_url ? <Image src={project.cover_image_url} alt={project.cover_alt} width={dimensions.width} height={dimensions.height} sizes={compact ? "(max-width: 720px) 94vw, (max-width: 1920px) 48vw, 900px" : "(max-width: 1920px) 94vw, 1800px"} className="project__cover project-cover" /> : <div className="project__fallback"><p>A visual is being prepared for {project.title}.</p></div>}
      </Reveal>
    </ProjectLink>
    <Reveal className="project__info" delay={0.08}>
      <h3 className="project__title">{project.title}</h3>
      <p className="project__cat">{project.category}</p>
      <p className="project__story">{project.short_description}</p>
      {/independent/i.test(project.project_type) && <p className="concept-label">Independent redesign concept. Not an official client engagement.</p>}
      <dl className="project__meta">
        {project.role && <div><dt>Role</dt><dd className="v">{project.role}</dd></div>}
        {project.tools.length > 0 && <div><dt>Tools</dt><dd className="v">{project.tools.join(", ")}</dd></div>}
        {project.year !== null && <div><dt>Year</dt><dd className="v">{project.year}</dd></div>}
        {!project.role && !project.tools.length && <div><dt>Focus</dt><dd className="v">{project.project_type}</dd></div>}
      </dl>
      {study ? <CasePreview study={{ project: study.project, sections: study.sections }} width={dimensions.width} height={dimensions.height} /> : <ProjectLink href={`/work/${project.slug}`} className="btn project__cta" cursor="OPEN"><span>View case study</span><ArrowUpRight className="ui-icon" size={20} weight="regular" aria-hidden="true" focusable="false" /></ProjectLink>}
    </Reveal>
  </article>;
}
