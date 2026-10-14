import type { Metadata } from "next";
import { getProjects, getSiteSettings } from "@backend/cms/data";
import { ProjectCard } from "@frontend/components/work/project-card";
import { Contact } from "@frontend/components/layout/footer";

export const metadata: Metadata = { title: "Project archive" };
export default async function WorkPage() {
  const [projects, settings] = await Promise.all([getProjects(), getSiteSettings()]);
  return <main id="main-content" data-page-ready="/work"><section className="archive-heading section-wrap"><div className="section-kicker mono"><span>INDEX / ALL PROJECTS</span><span>{String(projects.length).padStart(2, "0")} ENTRIES</span></div><h1>The work<span className="outline-text">.</span></h1><p>A collection of interfaces, systems, wireframes, and the thinking behind them.</p></section><section className="archive-projects section-wrap" aria-label="Projects">{projects.length ? projects.map((project) => <ProjectCard key={project.id} project={project} />) : <p className="empty-note">No published projects yet.</p>}</section><Contact settings={settings} /></main>;
}
