import Image from "next/image";
import type { Project, ProjectMedia } from "@api/contracts/cms";
import { externalUrl } from "@api/validation/cms";
import { VisualBoard } from "./visual-board";
import { Reveal } from "@frontend/components/motion/archive-motion";
export function ProjectDetail({ project: p, media }: { project: Project; media: ProjectMedia[] }) {
  const links = [{ label: "Live Website", url: p.live_url }, { label: "GitHub", url: p.repository_url }, { label: "Figma", url: p.figma_url }].filter(l => l.url && externalUrl.safeParse(l.url).success);
  return <main id="main-content" className="case-page" data-page-ready={`/work/${p.slug}`}><header className="case-heading wrap"><Reveal><h1>{p.title}</h1><p className="case-subtitle">{p.short_description}</p></Reveal><dl className="case-metadata"><div><dt>ROLE</dt><dd>{p.role}</dd></div><div><dt>YEAR</dt><dd>{p.year}</dd></div><div><dt>STACK</dt><dd>{p.tools.join(", ") || "—"}</dd></div><div><dt>STATUS</dt><dd>{p.status}</dd></div>{links.length > 0 && <div><dt>LINKS</dt><dd>{links.map(l => <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer">{l.label} ↗</a>)}</dd></div>}</dl><div className="case-cover">{p.cover_image_url && <Image src={p.cover_image_url} alt={p.cover_alt} fill sizes="83vw" priority />}</div></header><section className="case-story gradient-panel"><div className="wrap two-columns"><Reveal><h2>{p.section_one_heading}</h2><p>{p.section_one_body}</p></Reveal><Reveal><h2>{p.section_two_heading}</h2><p>{p.section_two_body}</p></Reveal></div></section><section className="visual-section wrap" aria-labelledby="visual-title"><Reveal><h2 id="visual-title">VISUAL BOARD</h2></Reveal><VisualBoard media={media} layout={p.gallery_layout} /></section></main>;
}
