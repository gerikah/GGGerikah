import Link from "next/link";
import type { Project, ProjectMedia } from "@api/contracts/cms";
import { externalUrl } from "@api/validation/cms";
import { VisualBoard } from "./visual-board";
import { Reveal } from "@frontend/components/motion/archive-motion";
import { MediaFrame } from "@frontend/components/media/media-frame";
import { MEDIA_SIZES } from "@frontend/components/media/media-spec";

export function ProjectDetail({ project: p, media, nextProject }: { project: Project; media: ProjectMedia[]; nextProject?: Pick<Project, "title" | "slug"> }) {
  const links = [{ label: "Live website", url: p.live_url }, { label: "GitHub", url: p.repository_url }, { label: "Figma", url: p.figma_url }].filter(l => l.url && externalUrl.safeParse(l.url).success);
  const metadata = [{ label: "Role", value: p.role }, { label: "Year", value: p.year }, { label: "Stack", value: p.tools.join(", ") }, { label: "Status", value: p.status }].filter(item => item.value);
  const sections = [{ heading: p.section_one_heading, body: p.section_one_body }, { heading: p.section_two_heading, body: p.section_two_body }].filter(section => section.body?.trim());
  const hasGallery = media.some(item => item.slot !== null && item.storage_path);

  return <main id="main-content" className="case-page" data-page-ready={`/work/${p.slug}`}>
    <header className="case-heading wrap">
      <Link href="/work" className="case-back">← All work</Link>
      <Reveal className="case-intro"><h1>{p.title}</h1>{p.short_description && <p className="case-subtitle">{p.short_description}</p>}</Reveal>
      {(metadata.length > 0 || links.length > 0) && <dl className="case-metadata">
        {metadata.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
        {links.length > 0 && <div><dt>Links</dt><dd className="case-links">{links.map(l => <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer">{l.label} ↗</a>)}</dd></div>}
      </dl>}
      {p.cover_image_url && <MediaFrame className="case-cover" src={p.cover_image_url} alt={p.cover_alt} sizes={MEDIA_SIZES.full} eager />}
    </header>
    {sections.length > 0 && <section className="case-story wrap" aria-label="Project background"><div className="case-story-grid">{sections.map((section, i) => <Reveal key={i}>{section.heading && <h2>{section.heading}</h2>}<p>{section.body}</p></Reveal>)}</div></section>}
    {hasGallery && <section className="visual-section wrap" aria-labelledby="visual-title"><Reveal><h2 id="visual-title">Visual board</h2></Reveal><VisualBoard media={media} layout={p.gallery_layout} /></section>}
    <nav className="case-pagination wrap" aria-label="Project navigation"><Link className="case-back" href="/work">← All work</Link>{nextProject && <Link className="case-next" href={`/work/${nextProject.slug}`}><span>Next project ↗</span><strong>{nextProject.title}</strong></Link>}</nav>
  </main>;
}
