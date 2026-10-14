import type { Metadata } from "next";
import { Fragment } from "react";
import { getProjects, getSiteSettings } from "@backend/cms/data";
import { ProjectCard } from "@frontend/components/work/project-card";
import { Contact } from "@frontend/components/layout/footer";

export const metadata: Metadata = { title: "Project archive" };
export default async function WorkPage() {
  const [projects, settings] = await Promise.all([getProjects(), getSiteSettings()]);
  const posters = await Promise.all(projects.map(project => ProjectCard({ project })));
  return <main id="main-content" data-page-ready="/work">
    <section className="archive-heading section-wrap"><h1>The work</h1><p>Interfaces, game screens, and user flows from design through development.</p></section>
    <section className="archive-projects section-wrap" aria-label="Projects">{posters.length ? posters.map((poster, i) => <Fragment key={projects[i].id}>{poster}</Fragment>) : <p className="empty-note">No published projects yet.</p>}</section>
    <Contact settings={settings} />
  </main>;
}
