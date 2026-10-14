import Image from "next/image";
import { ProjectLink, Reveal } from "@frontend/components/motion/archive-motion";
import type { Project } from "@api/contracts/cms";

const technologyLogos = new Map<string, readonly string[]>([
  ["next.js", ["nextjs"]],
  ["typescript", ["typescript"]],
  ["supabase", ["supabase"]],
  ["vercel", ["vercel"]],
  ["html", ["html5"]],
  ["css", ["css3"]],
  ["javascript", ["javascript"]],
  ["node/npm", ["nodejs", "npm"]],
  ["playwright", ["playwright"]],
]);

export function TechStack({ projects }: { projects: Project[] }) {
  const published = projects.filter(project => project.is_published);
  const tools = Array.from(new Set(published.flatMap(project => project.tools).filter(tool => tool.trim())));
  if (!tools.length) return null;
  return <section className="section tech-stack" id="stack" aria-labelledby="stack-title">
    <div className="wrap">
      <div className="section__head">
        <h2 className="section__title" id="stack-title">Tech stack</h2>
        <p className="tech-stack__intro">The tools behind the work.</p>
      </div>
      <ul className="tech-stack__list">{tools.map((tool, index) => {
        const associated = published.filter(project => project.tools.includes(tool));
        const logos = technologyLogos.get(tool.trim().toLowerCase()) ?? [];
        return <li key={tool}><Reveal className="tech-stack__row" delay={index * 0.035}>
          <h3 className="tech-stack__tool">
            {logos.length > 0 && <span className="tech-stack__logos" aria-hidden="true">{logos.map(logo => <Image key={logo} src={`/images/tech/${logo}.svg`} width={32} height={32} alt="" className="tech-stack__logo" unoptimized />)}</span>}
            <span className="tech-stack__label">{tool}</span>
          </h3>
          <div className="tech-stack__projects">{associated.map((project, projectIndex) => <span key={project.id}>
            {projectIndex > 0 && <span aria-hidden="true">, </span>}
            <ProjectLink href={`/work/${project.slug}`}>{project.title}</ProjectLink>
          </span>)}</div>
          <p className="tech-stack__count">{associated.length} {associated.length === 1 ? "project" : "projects"}</p>
        </Reveal></li>;
      })}</ul>
    </div>
  </section>;
}
