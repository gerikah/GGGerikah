import type { Metadata } from "next";
import { getProjects, getSiteSettings } from "@/lib/cms/data";
import { ProjectCard } from "@/components/work/project-card";
import { Contact } from "@/components/layout/footer";

export const metadata: Metadata = { title: "Project archive" };
export default async function WorkPage() {
  const [projects, settings] = await Promise.all([getProjects(), getSiteSettings()]);
  return <main id="main-content"><section className="archive-heading section-wrap"><div className="section-kicker mono"><span>INDEX / SELECTED PROJECTS</span><span>{String(projects.length).padStart(2, "0")} ENTRIES</span></div><h1>The work<span className="outline-text">.</span></h1><p>A collection of interfaces, decisions, and the code that brings them to life.</p></section><section className="archive-projects section-wrap" aria-label="Projects">{projects.length ? projects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />) : <p className="empty-note">No published projects yet.</p>}</section><Contact settings={settings} /></main>;
}
