import Image from "next/image";
import Link from "next/link";
import type { Project } from "@api/contracts/cms";

const technologyLabels: Record<string, string[]> = {
  "next.js": ["Next.js"],
  typescript: ["TypeScript"],
  supabase: ["Supabase"],
  vercel: ["Vercel"],
  html: ["HTML5"],
  html5: ["HTML5"],
  css: ["CSS3"],
  css3: ["CSS3"],
  javascript: ["JavaScript"],
  "node/npm": ["Node.js", "npm"],
  "node.js": ["Node.js"],
  npm: ["npm"],
  playwright: ["Playwright"],
};

const technologyLogos: Record<string, string> = {
  "Next.js": "nextjs",
  TypeScript: "typescript",
  Supabase: "supabase",
  Vercel: "vercel",
  HTML5: "html5",
  CSS3: "css3",
  JavaScript: "javascript",
  "Node.js": "nodejs",
  npm: "npm",
  Playwright: "playwright",
};

export function TechStack({ projects }: { projects: Project[] }) {
  const published = projects.filter(project => project.is_published);
  const tools = new Map<string, { label: string; projects: Project[] }>();

  for (const project of published) {
    for (const tool of project.tools) {
      const name = tool.trim();
      if (!name) continue;
      const normalizedName = name.toLowerCase();
      const labels = Object.hasOwn(technologyLabels, normalizedName) ? technologyLabels[normalizedName] : [name];

      for (const label of labels) {
        const key = label.toLowerCase();
        const existing = tools.get(key);
        if (!existing) tools.set(key, { label, projects: [project] });
        else if (!existing.projects.some(item => item.slug === project.slug)) existing.projects.push(project);
      }
    }
  }

  if (!tools.size) return null;

  return <section id="stack" className="toolbox wrap" aria-labelledby="stack-title">
    <div className="toolbox__heading">
      <h2 id="stack-title">Toolbox</h2>
      <p>Tools used in the work. Each one leads to a project.</p>
    </div>
    <ul className="toolbox__list">
      {Array.from(tools.values()).map(tool => {
        const logo = Object.hasOwn(technologyLogos, tool.label) ? technologyLogos[tool.label] : undefined;
        const firstProject = tool.projects[0];
        return <li key={tool.label.toLowerCase()} className="toolbox__item">
          <Link
            href={`/work/${firstProject.slug}`}
            className={`toolbox__entry${logo ? "" : " toolbox__entry--text"}`}
            title={`Used in ${tool.projects.map(project => project.title).join(", ")}`}
          >
            {logo && <Image
              className="toolbox__logo"
              src={`/images/tech/${logo}.svg`}
              alt=""
              aria-hidden="true"
              width={36}
              height={36}
              unoptimized
            />}
            <span className="toolbox__label">{tool.label}</span>
            <small className="toolbox__project">Used in {firstProject.title}</small>
          </Link>
        </li>;
      })}
    </ul>
  </section>;
}
