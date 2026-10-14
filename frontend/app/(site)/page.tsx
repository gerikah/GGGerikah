import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { getCapabilities, getProjects, getSiteSettings } from "@backend/cms/data";
import { HeroName, Reveal } from "@frontend/components/motion/archive-motion";
import { ProjectCard } from "@frontend/components/work/project-card";
import { Contact } from "@frontend/components/layout/footer";
import { TechStack } from "@frontend/components/home/tech-stack";
import { DesignProof } from "@frontend/components/home/design-proof";
import MosaicLens from "@frontend/components/home/mosaic-lens";

export default async function HomePage() {
  const [settings, projects, capabilities] = await Promise.all([getSiteSettings(), getProjects(), getCapabilities()]);
  const skills = capabilities.filter(item => item.kind === "capability");
  const process = capabilities.filter(item => item.kind === "process");
  const posters = await Promise.all(projects.map((project, i) => ProjectCard({ project, compact: i > 1 })));
  return <main id="main-content" data-page-ready="/">
    <section className="hero" aria-labelledby="hero-name">
      <MosaicLens className="hero__mosaic" />
      <div className="hero__inner">
        <HeroName first="Gerikah" />
        <div className="hero__copy">
          <Reveal delay={0.08}><p className="hero__roles">{settings.role}<br />Manila, Philippines</p></Reveal>
          <Reveal delay={0.16}><p className="hero__tagline">{settings.tagline.split(/(?<=\.)\s+(?=Then\b)/i).map((line, i) => <span key={i}>{i > 0 ? " " : ""}{line}</span>)}</p></Reveal>
          <Reveal delay={0.24}><p className="hero__lead">{settings.hero_supporting_copy}</p><Link className="btn" href="#work">View the work <ArrowUpRightIcon className="ui-icon" aria-hidden="true" focusable="false" /></Link></Reveal>
        </div>
      </div>
    </section>
    {projects.some(project => project.slug === "off-the-rack") && <DesignProof />}
    <section className="section work-section" id="work" aria-labelledby="work-title">
      <div className="wrap section__head"><Reveal><h2 className="section__title" id="work-title">The work</h2></Reveal><p>Interfaces, systems, and the thinking behind them.</p></div>
      <div className="work-posters">{posters.length ? posters.map((poster, i) => <Fragment key={projects[i].id}>{poster}</Fragment>) : <p className="wrap empty-note">The archive is being prepared.</p>}</div>
      <div className="wrap work__archive-link"><Link href="/work">Explore the full archive <ArrowUpRightIcon className="ui-icon" aria-hidden="true" focusable="false" /></Link></div>
    </section>
    <section className="section about-section" id="about" aria-labelledby="about-title">
      <div className="wrap about__grid">
        <div className="about__facts"><Reveal><h2 id="about-title">About me</h2></Reveal><p>Computer Engineer<br />Manila, Philippines</p>{settings.availability_text && <p>{settings.availability_text}</p>}</div>
        <div><Reveal><p className="about__statement"><Image src="/images/portrait.png" alt="Gerikah in a blazer and tie" width={491} height={508} sizes="(max-width: 720px) 110px, 150px" className="about__portrait-image" />{settings.bio}</p></Reveal>
          <ul className="about__skills">{skills.map((skill, i) => <li key={skill.id}><Reveal delay={i * 0.06}><p>{skill.title}</p><p className="about__skill-description">{skill.description}</p></Reveal></li>)}</ul>
        </div>
      </div>
    </section>
    <TechStack projects={projects} />
    <section className="section process-section" id="process" aria-labelledby="process-title">
      <div className="wrap process__layout">
        <div className="process__heading"><Reveal><h2 className="section__title" id="process-title">From idea<br />to interface</h2></Reveal><p>Design decisions carried through to the browser.</p><Reveal paper className="process__visual"><Image src="/images/off-the-rack/inquiry-wireframe.png" alt="Off The Rack inquiry form wireframe" width={1440} height={1613} sizes="(max-width: 720px) 92vw, 44vw" /></Reveal></div>
        <div className="process__grid">{process.map((item, i) => <article className="step" key={item.id}><Reveal delay={0.06}><h3 className="step__title">{item.title}</h3></Reveal><Reveal delay={0.13}><p className="step__body">{item.description}</p></Reveal>{i === 2 && <Reveal paper><Image src="/images/off-the-rack/inquiry.jpg" alt="Off The Rack finished inquiry interface" width={1348} height={1848} sizes="(max-width: 720px) 92vw, 44vw" className="process__built-image" /></Reveal>}</article>)}</div>
      </div>
    </section>
    <Contact settings={settings} />
  </main>;
}
