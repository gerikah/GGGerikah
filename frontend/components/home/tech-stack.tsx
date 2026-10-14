import { Reveal } from "@frontend/components/motion/archive-motion";
import type { Project } from "@api/contracts/cms";

export function TechStack({ projects }: { projects: Project[] }) {
  const tools = Array.from(new Set(projects.flatMap(project => project.tools)));
  if (!tools.length) return null;
  return <section className="section tech-stack" id="stack" aria-labelledby="stack-title">
    <div className="wrap">
      <div className="section__head"><p className="eyebrow">02 / Toolkit</p><h2 className="section__title" id="stack-title">Tech <em>stack</em></h2></div>
      <div className="tech-stack__intro"><p>The tools behind the interfaces<br />and the systems that make them work.</p><span className="eyebrow">Design into development ↘</span></div>
      <Reveal><ul className="tech-stack__list">{tools.map((tool, index) => <li key={tool}><span className="tech-stack__index">{String(index + 1).padStart(2, "0")}</span><span className="tech-stack__tool">{tool}</span><span className="tech-stack__plus" aria-hidden="true">+</span></li>)}</ul></Reveal>
      <p className="tech-stack__note eyebrow">In use across the projects in this archive.</p>
    </div>
  </section>;
}
