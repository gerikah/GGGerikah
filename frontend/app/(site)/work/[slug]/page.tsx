import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { getProject, getProjects } from "@backend/cms/data";
import { CaseSection, Gallery } from "@frontend/components/case-study/sections";
import { ProjectLink, Reveal } from "@frontend/components/motion/archive-motion";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = await getProject((await params).slug);
  return study ? { title: study.project.title, description: study.project.short_description } : { title: "Project not found" };
}

export default async function CaseStudyPage({ params }: Props) {
  const [study, projects] = await Promise.all([getProject((await params).slug), getProjects()]);
  if (!study) notFound();
  const { project, sections, media } = study;
  const current = projects.findIndex(item => item.id === project.id);
  const next = projects.length > 1 ? projects[(current + 1) % projects.length] : null;
  const hasGalleryBlock = sections.some(item => ["image", "image_pair", "gallery", "full_width"].includes(item.section_type));
  // Auto-gallery goes before the first reflection without changing CMS section order.
  const firstReflection = sections.findIndex(item => item.section_type === "reflection");
  const galleryAt = firstReflection < 0 ? sections.length : firstReflection;
  return <main id="main-content" className="case-page" data-page-ready={`/work/${project.slug}`}>
    <header className="case-heading section-wrap">
      <nav aria-label="Case-study navigation"><Link href="/work" className="case-back"><ArrowLeftIcon className="ui-icon" aria-hidden="true" focusable="false" />Back to work</Link></nav>
      <Reveal><h1 className={project.title.length > 18 ? "case-title--long" : undefined}>{project.title}</h1></Reveal>
      <p className="project__cat">{project.category}</p>
      <Reveal delay={0.08}><p className="case-summary">{project.overview}</p></Reveal>
      {/independent/i.test(project.project_type) && <p className="concept-label">Independent redesign concept. Not an official client engagement.</p>}
      <dl className="case-metadata">
        {project.role && <div><dt>Role</dt><dd>{project.role}</dd></div>}
        {project.tools.length > 0 && <div><dt>Tools</dt><dd>{project.tools.join(" / ")}</dd></div>}
        {project.year && <div><dt>Year</dt><dd>{project.year}</dd></div>}
        {project.status && <div><dt>Status</dt><dd>{project.status}</dd></div>}
        {(project.live_url || project.repository_url) && <div><dt>Explore</dt><dd className="case-links">{project.live_url && <a href={project.live_url} target="_blank" rel="noopener noreferrer">Live website<ArrowUpRightIcon className="ui-icon" aria-hidden="true" focusable="false" /></a>}{project.repository_url && <a href={project.repository_url} target="_blank" rel="noopener noreferrer">Repository<ArrowUpRightIcon className="ui-icon" aria-hidden="true" focusable="false" /></a>}</dd></div>}
      </dl>
    </header>
    <div className="section-wrap"><Reveal paper className="case-hero">{project.cover_image_url ? <Image src={project.cover_image_url} alt={project.cover_alt} fill sizes="90vw" preload className="case-hero-image" /> : <div className="missing-cover"><span>Visual in progress</span><span>{project.title}</span></div>}</Reveal></div>
    <div className="case-body section-wrap">
      {sections.map((section, index) => <div key={section.id}>
        {!hasGalleryBlock && index === galleryAt && media.length > 0 && <section className="case-image-section"><h2>The visual record</h2><Gallery media={media} /></section>}
        <CaseSection section={section} media={media} />
      </div>)}
      {!hasGalleryBlock && galleryAt === sections.length && media.length > 0 && <section className="case-image-section"><h2>The visual record</h2><Gallery media={media} /></section>}
    </div>
    <section className="next-project section-wrap">{next ? <ProjectLink href={`/work/${next.slug}`} label={`Next project: ${next.title}`}><h2>{next.title}</h2><p>Next project · {next.category}</p></ProjectLink> : <Link href="/work"><h2>Back to work</h2></Link>}</section>
  </main>;
}
