import Image from "next/image";
import Link from "next/link";
import { getCapabilities, getHomepage, getProjects, getSiteSettings } from "@backend/cms/data";
import { Workflow } from "@frontend/components/home/workflow";
import { Reveal } from "@frontend/components/motion/archive-motion";
import { SelectedProject } from "@frontend/components/work/selected-project";
export default async function HomePage() {
  const [settings, projects, homepage, capabilities] = await Promise.all([getSiteSettings(), getProjects(), getHomepage(), getCapabilities()]);
  const slots = [homepage.featured_project_id, homepage.secondary_one_id, homepage.secondary_two_id];
  return <main id="main-content" className="portfolio-home" data-page-ready="/">
    <section className="sketch-hero wrap" aria-labelledby="hero-title"><Image src="/images/brand/hero.svg" alt="" fill priority className="sketch-hero__graphic" aria-hidden="true" /><h1 id="hero-title"><span className="hero-opening">SOMEWHERE BETWEEN</span><span className="hero-article">A</span><strong className="hero-sketch">SKETCH</strong><span className="hero-conjunction">AND A</span><span className="hero-syntax">SYNTAX</span><span className="hero-error">ERROR</span></h1><span className="sr-only">Gerikah Alday — interface design and development.</span></section>
    <section className="editorial-pair wrap" aria-label="Design, interface, working product">{[{ url: homepage.editorial_one_url, alt: homepage.editorial_one_alt }, { url: homepage.editorial_two_url, alt: homepage.editorial_two_alt }].map((item, i) => <Reveal key={i} className="editorial-portrait">{item.url && <Image src={item.url} alt={item.alt} fill sizes="(max-width: 600px) 44vw, 29vw" />}</Reveal>)}<Reveal className="editorial-pair__copy"><p>Design<br />Interface<br />Working Product</p><Link href="#selected-work">Explore projects <span aria-hidden="true">↗</span></Link></Reveal></section>
    <section className="selected-work wrap" id="selected-work" aria-labelledby="selected-title"><Reveal><h2 id="selected-title">SELECTED WORK</h2></Reveal><div className="selected-grid">{slots.map((id, i) => <Reveal key={i} className={i === 0 ? "selected-featured" : ""}><SelectedProject project={projects.find(p => p.id === id)} slot={i + 1} /></Reveal>)}</div></section>
    <section className="design-build gradient-panel"><div className="wrap two-columns"><Reveal><h2>DESIGN</h2><p>Wireframes and user flows<br />UI direction and visual systems<br />Responsive layouts<br />Prototypes and interaction</p></Reveal><Reveal><h2>BUILD</h2><p>Next.js and TypeScript frontends<br />Supabase data and authentication<br />Admin interfaces<br />Deployment on Vercel</p></Reveal></div></section>
    <Workflow />
    <section id="about" className="about-editorial wrap" aria-labelledby="about-title"><Reveal><h2 id="about-title">I CARE<br />ABOUT HOW<br />IT LOOKS.<br />AND WHAT<br />HAPPENS<br />WHEN YOU<br />CLICK.</h2></Reveal><div className="about-divider" aria-hidden="true" /><Reveal className="about-editorial__copy"><p>{settings.bio}</p><ul>{capabilities.filter(c => c.kind === "capability").map(c => <li key={c.id}>{c.title}</li>)}</ul></Reveal></section>
    <section className="stack-editorial wrap" aria-labelledby="stack-title"><Reveal><Image src="/images/brand/logo.svg" alt="Gerikah's G and cursor mark" width={360} height={360} /></Reveal><Reveal><h2 id="stack-title">THE STACK</h2><p>The things I rely on to make things work.</p><ul>{["Next.js", "TypeScript", "React", "Supabase", "PostgreSQL", "Node.js", "HTML5", "CSS3", "JavaScript", "Figma", "Git", "Vercel"].map(t => <li key={t}>{t}</li>)}</ul></Reveal></section>
  </main>;
}
