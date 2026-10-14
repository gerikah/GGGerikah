import Link from "next/link";
import type { Project } from "@api/contracts/cms";

export function TechStack({ projects }: { projects: Project[] }) {
  const published = projects.filter(project => project.is_published);
  const tools = Array.from(new Set(published.flatMap(project => project.tools).map(tool => tool.trim()).filter(Boolean)));
  if (!tools.length) return null;

  return <section id="stack" className="toolbox wrap" aria-labelledby="stack-title">
    <div className="toolbox__heading">
      <h2 id="stack-title">Toolbox</h2>
      <p>Tools used in the work. Each one leads to a project.</p>
    </div>
    <ul className="toolbox__list">
      {tools.map(tool => {
        const associated = published.filter(project => project.tools.some(item => item.trim() === tool));
        return <li key={tool}>
          <Link href={`/work/${associated[0].slug}`} title={`Used in ${associated.map(project => project.title).join(", ")}`}>{tool}</Link>
        </li>;
      })}
    </ul>
  </section>;
}
