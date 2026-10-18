import { getProjects } from "@backend/cms/data";
import { SelectedProject } from "@frontend/components/work/selected-project";
export const metadata = { title: "Work" };
export default async function WorkPage() {
  const projects = await getProjects();
  return <main id="main-content" className="work-archive wrap" data-page-ready="/work"><h1>WORK</h1>{projects.length ? <div className="archive-grid">{projects.map(project => <SelectedProject key={project.id} project={project} />)}</div> : <p className="archive-empty">New work is taking shape.<br />Projects will appear here when they’re ready.</p>}</main>;
}
