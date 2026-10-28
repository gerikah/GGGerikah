import { FlowJourney } from "@frontend/components/home/flow-journey";
import "@frontend/styles/flow-journey.css";
import { externalUrl } from "@api/validation/cms";
import { getHomepage, getProjects, getSiteSettings } from "@backend/cms/data";
export default async function HomePage() {
  const [settings, projects, homepage] = await Promise.all([getSiteSettings(), getProjects(), getHomepage()]);
  const slots = [homepage.featured_project_id, homepage.secondary_one_id, homepage.secondary_two_id];
  const ordered = [...slots.map(id => projects.find(project => project.id === id)).filter((project): project is NonNullable<typeof project> => Boolean(project)), ...projects.filter(project => !slots.includes(project.id))];
  return <main id="main-content" className="portfolio-home" data-page-ready="/">
    <FlowJourney bio={settings.bio} projects={ordered} role={settings.role} resumeUrl={externalUrl.safeParse(settings.resume_url).success ? settings.resume_url : ""} />
  </main>;
}
