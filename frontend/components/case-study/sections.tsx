import Image from "next/image";
import type { ProjectMedia, ProjectSection } from "@api/contracts/cms";
import { imageDimensions } from "@frontend/lib/image-dimensions";
import { Reveal } from "@frontend/components/motion/archive-motion";

function Paragraphs({ body }: { body: string }) {
  return <>{body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</>;
}

export function Gallery({ media, paired = false }: { media: ProjectMedia[]; paired?: boolean }) {
  return <div className={`case-gallery ${paired ? "gallery-paired" : ""}`}>{media.map((item, index) => {
    const url = item.url || item.storage_path;
    const dimensions = imageDimensions(item.storage_path);
    const tall = dimensions.height / dimensions.width > 1.4;
    return <figure key={item.id} className={`gallery-item media-${item.layout} ${tall ? "media-tall" : ""}`}><Reveal paper className="gallery-image-wrap"><a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open full image: ${item.alt_text}`}><Image src={url} alt={item.alt_text} width={dimensions.width} height={dimensions.height} sizes="(max-width: 760px) 92vw, 80vw" className="gallery-image" /><span className="gallery-open mono" aria-hidden="true">OPEN FULL IMAGE ↗</span></a></Reveal><figcaption><span className="mono">FIG. {String(index + 1).padStart(2, "0")}</span><span>{item.caption}</span></figcaption></figure>;
  })}</div>;
}

export function CaseSection({ section, media, index }: { section: ProjectSection; media: ProjectMedia[]; index: number }) {
  const imageTypes = ["image", "image_pair", "gallery", "full_width"];
  if (imageTypes.includes(section.section_type)) {
    const ids = section.body.split(",").map(id => id.trim()).filter(Boolean);
    const chosen = ids.length ? ids.flatMap(id => media.filter(item => item.id === id)) : media;
    const selected = section.section_type === "image" ? chosen.slice(0, 1) : section.section_type === "image_pair" ? chosen.slice(0, 2) : chosen;
    return <section className="case-image-section">{section.heading && <h2>{section.heading}</h2>}<Gallery media={selected} paired={section.section_type === "image_pair"} /></section>;
  }
  if (section.section_type === "quote") return <Reveal className="case-quote"><blockquote><p>“{section.body}”</p>{section.heading && <footer className="mono">{section.heading}</footer>}</blockquote></Reveal>;
  if (section.section_type === "external_link") {
    const safeUrl = /^https?:\/\//i.test(section.body.trim()) ? section.body.trim() : null;
    return safeUrl ? <a className="case-external-link" href={safeUrl} target="_blank" rel="noopener noreferrer">{section.heading || "Explore the project"}<span aria-hidden="true">↗</span></a> : null;
  }
  if (section.section_type === "tools") return <section className="case-tools">{section.heading && <h2>{section.heading}</h2>}<ul>{section.body.split(/[,\n]/).map(tool => tool.trim()).filter(Boolean).map((tool, i) => <li className="mono" key={i}>{tool}</li>)}</ul></section>;
  if (section.section_type === "split") {
    const [challenge, ...solution] = section.body.split(/\n\s*\n/);
    return <section className="case-split"><div><span className="mono">THE CHALLENGE</span><h2>{section.heading}</h2><p>{challenge}</p></div><div><span className="mono">THE RESPONSE</span><Paragraphs body={solution.join("\n\n")} /></div></section>;
  }
  return <Reveal className={`case-text-section ${section.section_type === "reflection" ? "case-reflection" : ""}`}><span className="case-section-index mono">{String(index + 1).padStart(2, "0")} / {section.section_type === "reflection" ? "REFLECTION" : "PROJECT NOTES"}</span><div>{section.heading && <h2>{section.heading}</h2>}<Paragraphs body={section.body} /></div></Reveal>;
}
