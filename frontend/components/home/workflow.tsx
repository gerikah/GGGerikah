import { WorkflowRoute } from "./workflow-route";
import { Reveal } from "@frontend/components/motion/archive-motion";
const steps = [
  ["Discover", "Requirements, users, context, constraints, and the problem to solve."],
  ["Define", "Goals, scope, priorities, features, and user flows."],
  ["Structure", "Information architecture, technical architecture, data model, and API/system decisions."],
  ["Design", "Wireframes, UI direction, responsive layouts, prototypes, and interaction details."],
  ["Build the foundation", "Database, backend logic, authentication, APIs, and content/data handling."],
  ["Build the interface", "Frontend development, responsive behaviour, component work, and backend integration."],
  ["Test and refine", "Functional testing, responsive testing, accessibility checks, bug fixing, and performance review."],
  ["Release and iterate", "Preview/staging deployment, production deployment, monitoring, feedback, and continued improvements."],
];
export function Workflow() {
  return <section className="method wrap" id="workflow" aria-labelledby="method-title"><Reveal><h2 id="method-title">THE METHOD BEHIND<br /><span>THE MADNESS.</span></h2><p className="method-intro">Good work doesn’t happen by accident. Here’s how I turn messy ideas<br className="desktop-break" /> into something people can actually use.</p></Reveal><WorkflowRoute>{steps.map(([title, description], i) => <li className="workflow__step" key={title}><span className="workflow__number" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{description}</p></li>)}</WorkflowRoute></section>;
}
