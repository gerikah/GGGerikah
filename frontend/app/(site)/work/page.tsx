import { getProjects } from "@backend/cms/data";
import { SelectedProject } from "@frontend/components/work/selected-project";
export const metadata = { title: "Work" };
export default async function WorkPage() {
  const projects = await getProjects();
  return <main id="main-content" className="work-archive work-archive--ledger wrap" data-page-ready="/work"><header className="work-archive__header"><p className="work-archive__intro">A working archive of interfaces, systems, and ideas brought into focus.</p><h1>Works</h1></header>{projects.length ? <div className="archive-grid">{projects.map((project, index) => <SelectedProject key={project.id} project={project} slot={index + 1} />)}</div> : <p className="archive-empty">New work is taking shape.<br />Projects will appear here when they’re ready.</p>}</main>;
}
