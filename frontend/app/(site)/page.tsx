import Image from "next/image";
import Link from "next/link";
import { ArrowDownRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowDownRight";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { getCapabilities, getProjects, getSiteSettings } from "@backend/cms/data";
import { Contact } from "@frontend/components/layout/footer";
import { TechStack } from "@frontend/components/home/tech-stack";
import { DesignProof } from "@frontend/components/home/design-proof";
import { Workflow } from "@frontend/components/home/workflow";
import { SelectedIndex } from "@frontend/components/home/selected-index";
import { HeroMark } from "@frontend/components/home/hero-mark";
import taskMateShowcase from "@frontend/public/images/task-mate/showcase.png";
import dashboard from "@frontend/public/images/ground-control-station/dashboard.png";
import mobileDashboard from "@frontend/public/images/ground-control-station/mobile-dashboard.png";
import inquiryWireframe from "@frontend/public/images/off-the-rack/inquiry-wireframe.png";
import inquiry from "@frontend/public/images/off-the-rack/inquiry.jpg";
import administration from "@frontend/public/images/off-the-rack/admin.jpg";

const selection = [
  { slug: "off-the-rack", number: "01", label: "Storefront, from design to build", target: "work" }, // taste-skill-ignore: requested project index.
  { slug: "task-mate", number: "02", label: "Daily planning, designed for mobile", target: "task-mate" }, // taste-skill-ignore: requested project index.
  { slug: "ground-control-station", number: "03", label: "A system across two screens", target: "ground-control" }, // taste-skill-ignore: requested project index.
];

export default async function HomePage() {
  const [settings, projects, capabilities] = await Promise.all([getSiteSettings(), getProjects(), getCapabilities()]);
  const offTheRack = projects.find(project => project.slug === "off-the-rack");
  const taskMate = projects.find(project => project.slug === "task-mate");
  const groundControl = projects.find(project => project.slug === "ground-control-station");
  const selected = selection.flatMap(item => {
    const project = projects.find(project => project.slug === item.slug);
    return project ? [{ ...item, project }] : [];
  });

  return <main id="main-content" className="portfolio-home" data-page-ready="/">
    <section className="editorial-hero wrap" aria-labelledby="hero-title">
      <div className="editorial-hero__meta meta"><span>Gerikah Alday<br />UI/UX Designer + Frontend Developer</span><span>Manila, PH</span></div>
      <div className="editorial-hero__layout">
        <div className="editorial-hero__copy">
          <h1 id="hero-title">I design it.<br />Then I build it.</h1>
          <p>{settings.hero_supporting_copy}</p>
          <Link className="btn" href={selected.length ? "#selected-work" : "/work"}>Browse selected work<ArrowDownRightIcon className="ui-icon" aria-hidden="true" focusable="false" /></Link>
        </div>
        <HeroMark />
      </div>
    </section>
    {selected.length > 0 && <SelectedIndex projects={selected.map(item => ({ slug: item.slug, number: item.number, title: item.project.title, label: item.label, target: item.target }))} />}

    {!offTheRack && <div id="work" />}
    {offTheRack && <section id="work" className="featured-project wrap" aria-labelledby="featured-title">
      <div className="project-heading"><div><p className="meta">01 / Featured project</p><h2 id="featured-title">{offTheRack.title}</h2></div><p className="project-heading__role meta">Interface design<br />Frontend + data integration</p></div>
      <div className="featured-project__intro"><p>A storefront for one-of-one pieces.<br />Built from the first wireframe.</p><div><p>{offTheRack.short_description}</p><Link className="text-link" href="/work/off-the-rack">Read the case study<ArrowUpRightIcon className="ui-icon" aria-hidden="true" focusable="false" /></Link></div></div>
      <DesignProof />
      <div className="featured-project__footnote"><p className="meta">Design → interface → working product</p><p>Product browsing, custom inquiries, and an admin interface connected to Supabase.</p></div>
    </section>}

    {(taskMate || groundControl) && <section id="other-work" className="selected-work wrap" aria-labelledby="selected-title">
      {/* taste-skill-ignore: real project index labels requested in the brief. */}
      <div className="selected-work__heading"><h2 id="selected-title">{taskMate && groundControl ? "Two other ways of thinking." : "Another way of thinking."}</h2><p className="meta">Selected work / {taskMate && groundControl ? "02—03" : taskMate ? "02" : "03"}</p></div>{/* taste-skill-ignore: requested index. */}
      {taskMate && <article id="task-mate" className="taskmate-study" aria-labelledby="taskmate-title">
        <Link className="taskmate-study__thumbnail image-link" href="/work/task-mate" aria-label="Explore Task Mate mobile UI/UX designs">
          <Image src={taskMateShowcase} alt="Task Mate productivity app showcase featuring onboarding, login, daily tasks, calendar, statistics, and profile screens" sizes="(max-width: 720px) 90vw, 60vw" placeholder="blur" />
        </Link>
        <div className="taskmate-study__copy"><p className="meta">02 / Mobile UI/UX design</p><h3 id="taskmate-title">{taskMate.title}</h3><p>A plan for today.<br />A view of your progress.</p><p className="taskmate-study__description">A mobile task-management interface that brings daily tasks, calendar planning, and progress tracking into one connected experience.</p><Link className="text-link" href="/work/task-mate">Explore the designs<ArrowUpRightIcon className="ui-icon" aria-hidden="true" focusable="false" /></Link></div>
      </article>}
      {groundControl && <article id="ground-control" className="gcs-study" aria-labelledby="gcs-title">
        <div className="gcs-study__copy"><p className="meta">03 / Web + mobile interface</p><h3 id="gcs-title">{groundControl.title}</h3><p>Making a complex system readable.</p><p className="gcs-study__description">System status, flight records, and controls share a desktop view. On mobile, summary cards and a flight list take priority.</p><Link className="text-link" href="/work/ground-control-station">Explore the interface<ArrowUpRightIcon className="ui-icon" aria-hidden="true" focusable="false" /></Link><dl className="gcs-study__notes"><div><dt>Desktop</dt><dd>Overview + connection status</dd></div><div><dt>Mobile</dt><dd>Summary + recent flights</dd></div></dl></div>
        <figure className="gcs-study__composition"><div className="gcs-study__desktop"><p className="meta">System overview</p><Link className="image-link" href="/work/ground-control-station" aria-label="View Ground Control Station desktop interface"><Image src={dashboard} alt="Ground Control Station desktop dashboard with flight records and connection controls" sizes="(max-width: 720px) 68vw, 42vw" placeholder="blur" /></Link></div><div className="gcs-study__mobile"><p className="meta">Mobile view</p><Image src={mobileDashboard} alt="Ground Control Station mobile dashboard with summary cards, recent flights, and bottom navigation" sizes="(max-width: 720px) 20vw, 13vw" placeholder="blur" /></div><figcaption className="meta">One system. Two reading distances.</figcaption></figure>
      </article>}
    </section>}

    {offTheRack && <section id="process" className="build-evidence wrap" aria-labelledby="evidence-title">
      <div className="build-evidence__heading"><p className="meta">A closer look / Off The Rack</p><h2 id="evidence-title">The details that work.</h2><p>Structure, interaction, and the data behind the screen.</p></div>
      <div className="build-evidence__artifacts">
        <figure><div className="build-evidence__crop build-evidence__crop--wireframe"><Image src={inquiryWireframe} alt="Early Off The Rack inquiry wireframe showing planned form fields" sizes="(max-width: 720px) 90vw, 30vw" placeholder="blur" /></div><figcaption><span className="meta">Design / Inquiry wireframe</span><p>The inquiry fields take shape before the visual styling.</p></figcaption></figure>
        <figure><div className="build-evidence__crop"><Image src={inquiry} alt="Finished Off The Rack inquiry page with general and custom inquiry paths" sizes="(max-width: 720px) 90vw, 30vw" placeholder="blur" /></div><figcaption><span className="meta">Interface / Built inquiries</span><p>General questions and custom-piece requests have separate paths.</p></figcaption></figure>
        <figure><div className="build-evidence__crop build-evidence__crop--admin"><Image src={administration} alt="Off The Rack product administration dashboard" sizes="(max-width: 720px) 90vw, 30vw" placeholder="blur" /></div><figcaption><span className="meta">Implementation / Product admin</span><p>The storefront connects to product administration, backed by Supabase.</p></figcaption></figure>
      </div>
      <Link className="text-link" href="/work/off-the-rack">See how the pieces connect<ArrowUpRightIcon className="ui-icon" aria-hidden="true" focusable="false" /></Link>
    </section>}

    <Workflow projects={projects} />
    <section id="about" className="about-note wrap" aria-labelledby="about-title">
      <div><p className="meta">A little about me</p><h2 id="about-title">Both sides<br />of the screen.</h2></div>
      <div className="about-note__body"><p className="about-note__bio">{settings.bio}</p><p className="about-note__signature">Gerikah Alday<span className="meta">Computer Engineer · Manila, PH</span></p><ul className="about-note__capabilities" aria-label="Capabilities">{capabilities.filter(item => item.kind === "capability").map(item => <li key={item.id}>{item.title}</li>)}</ul></div>
    </section>
    <TechStack projects={projects} />
    <Contact settings={settings} />
  </main>;
}
