import Image from "next/image";
import Link from "next/link";
import { getCapabilities, getProjects, getSiteSettings } from "@backend/cms/data";
import { HeroName, Reveal, HeroLabels } from "@frontend/components/motion/archive-motion";
import { ProjectCard } from "@frontend/components/work/project-card";
import { WorkRail } from "@frontend/components/work/work-rail";
import { Contact } from "@frontend/components/layout/footer";
import { TechStack } from "@frontend/components/home/tech-stack";

export default async function HomePage() {
  const [settings, projects, capabilities] = await Promise.all([getSiteSettings(), getProjects(), getCapabilities()]);
  const skills = capabilities.filter(item => item.kind === "capability");
  const process = capabilities.filter(item => item.kind === "process");
  return <main id="main-content" data-page-ready="/">
    <section className="hero" aria-labelledby="hero-name">
      <HeroLabels availability={settings.availability_text} />
      <div className="hero__inner is-in">
        <p className="eyebrow hero__meta">my name is</p>
        <HeroName first="Gerikah" />
        <div className="hero__row">
          <div className="hero__roles" aria-label="Roles and location">
            {settings.role.split(/\s+(?:and|&)\s+/i).map(role => <span className="hero__role" key={role}>{role}</span>)}
            <span className="hero__role">Manila, Philippines</span>
          </div>
          <div className="hero__cta-col">
            <p className="hero__tagline">{settings.tagline}</p>
            <p className="hero__lead">{settings.hero_supporting_copy}</p>
            <Link className="btn" href="#work" data-cursor="VIEW"><span>View the work</span><span className="arrow" aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </div>
    </section>
    <div className="ticker" aria-hidden="true"><div className="ticker__track">{Array.from({ length: 4 }, (_, i) => <span key={i}>{settings.tagline} —</span>)}</div></div>
    <section className="section" id="about" aria-labelledby="about-title">
      <div className="wrap">
        <div className="section__head"><p className="eyebrow">01 / About</p><h2 className="section__title" id="about-title">Notes on <em>me</em></h2></div>
        <div className="about__grid">
          <Reveal>
            <p className="about__statement">{settings.bio}</p>
            <div className="about__labels">{skills.map(skill => <span className="chip" key={skill.id} title={skill.description}>{skill.title}</span>)}</div>
            <div className="about__frag"><span className="mono">Design to development ↗</span><span className="mono">Wireframe to build</span><span className="mono">Computer Engineer</span></div>
          </Reveal>
          <div className="about__visual">
            <span className="tape tape--tl" aria-hidden="true" /><span className="tape tape--br" aria-hidden="true" />
            <span className="annot annot--tr">Fig. 01 — Gerikah</span><span className="annot annot--bl">Manila, Philippines</span>
            <Reveal paper className="frame"><div className="about__portrait"><Image src="/images/portrait.png" alt="Gerikah" fill sizes="(max-width: 1080px) 80vw, 45vw" className="about__portrait-image" /><span className="portrait-grid" aria-hidden="true" /></div></Reveal>
          </div>
        </div>
      </div>
    </section>
    <TechStack projects={projects} />
    <section className="section" id="work" aria-labelledby="work-title">
      <div className="wrap"><div className="section__head"><p className="eyebrow">03 / Project archive</p><h2 className="section__title" id="work-title">The <em>work</em></h2></div></div>
      {projects.length ? <WorkRail count={projects.length}>{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</WorkRail> : <p className="wrap empty-note">The archive is being prepared.</p>}
      <div className="wrap work__archive-link"><Link className="eyebrow" href="/work">Explore the full archive ↗</Link></div>
    </section>
    <section className="section" id="process" aria-labelledby="process-title">
      <div className="wrap">
        <div className="section__head"><p className="eyebrow">04 / Process</p><h2 className="section__title" id="process-title">How I <em>work</em></h2></div>
        <Reveal className="process__grid">{process.map((item, i) => <article className="step" key={item.id}><p className="step__num">Step {String(i + 1).padStart(2, "0")}</p><h3 className="step__title">{item.title}</h3><p className="step__body">{item.description}</p></article>)}</Reveal>
        <div className="process__foot">{skills.map(skill => <span className="mono" key={skill.id}>{skill.title}</span>)}</div>
      </div>
    </section>
    <Contact settings={settings} />
  </main>;
}
