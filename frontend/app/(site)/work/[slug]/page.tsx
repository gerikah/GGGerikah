import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  return <main id="main-content" className="case-page" data-page-ready={`/work/${project.slug}`}><header className="case-heading section-wrap"><Link href="/work" className="mono case-back">↖ BACK TO THE ARCHIVE</Link><div className="section-kicker mono"><span>PROJECT {String(project.project_number).padStart(2, "0")}</span><span>{project.category}</span></div><h1>{project.title}</h1><p className="case-summary">{project.overview}</p>{/independent/i.test(project.project_type) && <span className="concept-label mono">INDEPENDENT REDESIGN CONCEPT · NOT AN OFFICIAL CLIENT ENGAGEMENT</span>}<dl className="case-metadata">{project.role && <div><dt className="mono">MY ROLE</dt><dd>{project.role}</dd></div>}{project.tools.length > 0 && <div><dt className="mono">TOOLKIT</dt><dd>{project.tools.join(" / ")}</dd></div>}{project.year && <div><dt className="mono">YEAR</dt><dd>{project.year}</dd></div>}{project.status && <div><dt className="mono">STATUS</dt><dd>{project.status}</dd></div>}{(project.live_url || project.repository_url) && <div><dt className="mono">EXPLORE</dt><dd className="case-links">{project.live_url && <a href={project.live_url} target="_blank" rel="noopener noreferrer">Live website ↗</a>}{project.repository_url && <a href={project.repository_url} target="_blank" rel="noopener noreferrer">Repository ↗</a>}</dd></div>}</dl></header>
    <div className="section-wrap"><Reveal paper className="case-hero">{project.cover_image_url ? <Image src={project.cover_image_url} alt={project.cover_alt} fill sizes="90vw" priority className="case-hero-image" /> : <div className="missing-cover"><span className="mono">VISUAL IN PROGRESS</span><span>{project.title}</span></div>}</Reveal></div>
    <div className="case-body section-wrap">{sections.map((section, index) => <div key={section.id}>{!hasGalleryBlock && index === galleryAt && media.length > 0 && <section className="case-image-section"><div className="section-kicker mono"><span>THE VISUAL RECORD</span><span>{media.length} FRAMES</span></div><Gallery media={media} /></section>}<CaseSection section={section} media={media} index={index} /></div>)}{!hasGalleryBlock && galleryAt === sections.length && media.length > 0 && <section className="case-image-section"><div className="section-kicker mono"><span>THE VISUAL RECORD</span><span>{media.length} FRAMES</span></div><Gallery media={media} /></section>}</div>
    <section className="next-project section-wrap"><span className="mono">{next ? "NEXT IN THE ARCHIVE" : "CONTINUE EXPLORING"}</span>{next ? <ProjectLink href={`/work/${next.slug}`}><h2>{next.title}<span aria-hidden="true">↗</span></h2><span className="mono">PROJECT {String(next.project_number).padStart(2, "0")} / {next.category}</span></ProjectLink> : <Link href="/work"><h2>Back to the archive ↗</h2></Link>}</section>
  </main>;
}
