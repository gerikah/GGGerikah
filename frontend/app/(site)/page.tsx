import Image from "next/image";
import Link from "next/link";
import { MediaFrame } from "@frontend/components/media/media-frame";
import { MEDIA_SIZES } from "@frontend/components/media/media-spec";
import { getCapabilities, getHomepage, getProjects, getSiteSettings } from "@backend/cms/data";
import { Workflow } from "@frontend/components/home/workflow";
import { Reveal } from "@frontend/components/motion/archive-motion";
import { SelectedProject } from "@frontend/components/work/selected-project";
import { TechStack } from "@frontend/components/home/tech-stack";
export default async function HomePage() {
  const [settings, projects, homepage, capabilities] = await Promise.all([getSiteSettings(), getProjects(), getHomepage(), getCapabilities()]);
  const slots = [homepage.featured_project_id, homepage.secondary_one_id, homepage.secondary_two_id];
  return <main id="main-content" className="portfolio-home" data-page-ready="/">
    <section className="sketch-hero wrap" aria-labelledby="hero-title"><h1 id="hero-title"><span className="sr-only">Somewhere between a sketch and a syntax error.</span><Image src="/images/brand/hero-tagline.png" alt="" aria-hidden="true" width={1430} height={646} preload unoptimized className="hero-tagline-artwork" /></h1><span className="sr-only">Gerikah Alday — interface design and development.</span></section>
    <section className="editorial-pair wrap" aria-label="Design, interface, working product"><div className="editorial-pair__images">{[{ url: homepage.editorial_one_url, alt: homepage.editorial_one_alt }, { url: homepage.editorial_two_url, alt: homepage.editorial_two_alt }].map((item, i) => <Reveal key={i}><MediaFrame className="editorial-portrait" src={item.url} alt={item.alt} variant="portrait" sizes={MEDIA_SIZES.editorial} /></Reveal>)}</div><Reveal className="editorial-pair__copy"><p>Design<br />Interface<br />Working Product</p><Link href="#selected-work">Explore projects <span aria-hidden="true">↗</span></Link></Reveal></section>
    <section className="selected-work wrap" id="selected-work" aria-labelledby="selected-title"><Reveal><h2 id="selected-title">SELECTED WORK</h2></Reveal><div className="selected-grid">{slots.map((id, i) => <Reveal key={i} className={i === 0 ? "selected-featured" : ""}><SelectedProject project={projects.find(p => p.id === id)} slot={i + 1} /></Reveal>)}</div></section>
    <section className="design-build gradient-panel" aria-label="Design and development services"><div className="wrap two-columns"><Reveal><h2>DESIGN</h2><ul><li>Wireframes and user flows</li><li>UI direction and visual systems</li><li>Responsive layouts</li><li>Prototypes and interaction</li></ul></Reveal><Reveal delay={80}><h2>BUILD</h2><ul><li>Next.js and TypeScript frontends</li><li>Supabase data and authentication</li><li>Admin interfaces</li><li>Deployment on Vercel</li></ul></Reveal></div></section>
    <Workflow />
    <section id="about" className="about-editorial wrap" aria-labelledby="about-title"><Reveal><h2 id="about-title">I CARE<br />ABOUT HOW<br />IT LOOKS.<br />AND WHAT<br />HAPPENS<br />WHEN YOU<br />CLICK.</h2></Reveal><div className="about-divider" aria-hidden="true" /><Reveal className="about-editorial__copy"><p>{settings.bio}</p><ul>{capabilities.filter(c => c.kind === "capability").map(c => <li key={c.id}>{c.title}</li>)}</ul></Reveal></section>
    <TechStack />
  </main>;
}
