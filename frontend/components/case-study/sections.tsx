import Image from "next/image";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut";
import type { ProjectMedia, ProjectSection } from "@api/contracts/cms";
import { imageDimensions } from "@frontend/lib/image-dimensions";
import { Reveal } from "@frontend/components/motion/archive-motion";

function Paragraphs({ body }: { body: string }) {
  return <>{body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</>;
}

export function Gallery({ media, paired = false }: { media: ProjectMedia[]; paired?: boolean }) {
  return <div className={`case-gallery ${paired ? "gallery-paired" : ""}`}>{media.map((item) => {
    const url = item.url || item.storage_path;
    const dimensions = imageDimensions(item.storage_path);
    const tall = dimensions.height / dimensions.width > 1.4;
    return <figure key={item.id} className={`gallery-item media-${item.layout} ${tall ? "media-tall" : ""}`}><Reveal paper className="gallery-image-wrap"><a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open full image: ${item.alt_text}`}><Image src={url} alt={item.alt_text} width={dimensions.width} height={dimensions.height} sizes="(max-width: 760px) 92vw, 80vw" className="gallery-image" /><span className="gallery-open" aria-hidden="true">Open full image<ArrowSquareOutIcon className="ui-icon" aria-hidden="true" focusable="false" /></span></a></Reveal>{item.caption && <figcaption>{item.caption}</figcaption>}</figure>;
  })}</div>;
}

export function CaseSection({ section, media }: { section: ProjectSection; media: ProjectMedia[] }) {
  const imageTypes = ["image", "image_pair", "gallery", "full_width"];
  if (imageTypes.includes(section.section_type)) {
    const ids = section.body.split(",").map(id => id.trim()).filter(Boolean);
    const chosen = ids.length ? ids.flatMap(id => media.filter(item => item.id === id)) : media;
    const selected = section.section_type === "image" ? chosen.slice(0, 1) : section.section_type === "image_pair" ? chosen.slice(0, 2) : chosen;
    return <section className="case-image-section">{section.heading && <h2>{section.heading}</h2>}<Gallery media={selected} paired={section.section_type === "image_pair"} /></section>;
  }
  if (section.section_type === "quote") return <Reveal className="case-quote"><blockquote><p>{section.body}</p>{section.heading && <footer>{section.heading}</footer>}</blockquote></Reveal>;
  if (section.section_type === "external_link") {
    const safeUrl = /^https?:\/\//i.test(section.body.trim()) ? section.body.trim() : null;
    return safeUrl ? <a className="case-external-link" href={safeUrl} target="_blank" rel="noopener noreferrer">{section.heading || "Explore the project"}<ArrowSquareOutIcon className="ui-icon" aria-hidden="true" focusable="false" /></a> : null;
  }
  if (section.section_type === "tools") return <section className="case-tools">{section.heading && <h2>{section.heading}</h2>}<ul>{section.body.split(/[,\n]/).map(tool => tool.trim()).filter(Boolean).map((tool, i) => <li key={i}>{tool}</li>)}</ul></section>;
  if (section.section_type === "split") {
    const [challenge, ...solution] = section.body.split(/\n\s*\n/);
    return <section className="case-split"><div><h2>{section.heading || "The challenge"}</h2><p>{challenge}</p></div><div><h2>The response</h2><Paragraphs body={solution.join("\n\n")} /></div></section>;
  }
  return <Reveal className={`case-text-section ${section.section_type === "reflection" ? "case-reflection" : ""}`}><div>{section.heading && <h2>{section.heading}</h2>}<Paragraphs body={section.body} /></div></Reveal>;
}
