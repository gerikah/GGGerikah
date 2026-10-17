import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { Project } from "@api/contracts/cms";
import { WorkflowRoute } from "./workflow-route";
import inquiryWireframe from "@frontend/public/images/off-the-rack/inquiry-wireframe.png";
import administration from "@frontend/public/images/off-the-rack/admin.jpg";
import dashboard from "@frontend/public/images/ground-control-station/dashboard.png";

const steps = [
  { id: "discover", title: "Discover", description: "Requirements, users, context, constraints, and the problem to solve." },
  { id: "define", title: "Define", description: "Goals, scope, priorities, features, and user flows." },
  { id: "structure", title: "Structure", description: "Information architecture, technical architecture, data model, and API/system decisions." },
  { id: "design", title: "Design", description: "Wireframes, UI direction, responsive layouts, prototypes, and interaction details." },
  { id: "foundation", title: "Build the foundation", description: "Database, backend logic, authentication, APIs, and content/data handling." },
  { id: "interface", title: "Build the interface", description: "Frontend development, responsive behaviour, component work, and backend integration." },
  { id: "test", title: "Test and refine", description: "Functional testing, responsive testing, accessibility checks, bug fixing, and performance review." },
  { id: "release", title: "Release and iterate", description: "Preview/staging deployment, production deployment, monitoring, feedback, and continued improvements." },
] as const;

type Artifact = {
  image: StaticImageData;
  alt: string;
  caption: string;
  project: Project;
};

function Connection({ kind }: { kind: "fork" | "foundation" | "interface" | "join" }) {
  const paths = {
    fork: "M500 0V20H250V60M500 20H750V60",
    foundation: "M300 0V24H16V1000",
    interface: "M300 0V24H584V1000",
    join: "M13.333 0V20H500V60M986.667 0V20H500",
  };
  const branch = kind === "foundation" || kind === "interface";
  return <svg className={`workflow__connection workflow__connection--${kind}`} viewBox={branch ? "0 0 600 1000" : "0 0 1000 60"} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d={paths[kind]} className="workflow__connection-base" vectorEffect="non-scaling-stroke" />
    <path d={paths[kind]} className="workflow__connection-active" vectorEffect="non-scaling-stroke" />
  </svg>;
}

export function Workflow({ projects }: { projects: Project[] }) {
  const published = projects.filter(project => project.is_published);
  const offTheRack = published.find(project => project.slug === "off-the-rack");
  const groundControl = published.find(project => project.slug === "ground-control-station");
  const artifacts: Partial<Record<(typeof steps)[number]["id"], Artifact>> = {};

  if (offTheRack) {
    artifacts.design = {
      image: inquiryWireframe,
      alt: "Inquiry wireframe with planned contact, product, and message fields",
      caption: "Off The Rack / Wireframe",
      project: offTheRack,
    };
    artifacts.foundation = {
      image: administration,
      alt: "Product administration dashboard with inventory summaries and recent inquiries",
      caption: "Off The Rack / Admin",
      project: offTheRack,
    };
  }

  if (groundControl) {
    artifacts.interface = {
      image: dashboard,
      alt: "Ground Control Station interface with flight records and connection controls",
      caption: "Ground Control / Interface",
      project: groundControl,
    };
  }

  return <section id="workflow" className="workflow wrap" aria-labelledby="workflow-title">
    <div className="workflow__heading">
      <h2 id="workflow-title">From brief<br />to browser</h2>
      <p>A connected process. Foundation and interface work can overlap.</p>
    </div>
    <WorkflowRoute>
      {steps.map((step, index) => {
        const artifact = artifacts[step.id];
        const isBuild = step.id === "foundation" || step.id === "interface";
        return <li key={step.id} className={`workflow__step workflow__step--${step.id}`} aria-describedby={isBuild ? "workflow-build-note" : undefined}>
          {step.id === "design" && <><Connection kind="fork" /><span id="workflow-build-note" className="workflow__build-connection">Build / parallel work</span></>}
          {isBuild && <Connection kind={step.id === "foundation" ? "foundation" : "interface"} />}
          {step.id === "test" && <Connection kind="join" />}
          <span className="workflow__dot" aria-hidden="true" />
          <div className="workflow__node" tabIndex={0} role="group" aria-labelledby={`workflow-${step.id}-title`} aria-describedby={`workflow-${step.id}-description`}>
          {/* taste-skill-ignore: the requested ordered workflow uses visible step numbers. */}
          <span className="workflow__number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <div className="workflow__step-copy">
            <h3 id={`workflow-${step.id}-title`}>{step.title}</h3>
            <p id={`workflow-${step.id}-description`}>{step.description}</p>
          </div>
          {artifact && <figure className="workflow__artifact">
            <Link className="workflow__artifact-link image-link" href={`/work/${artifact.project.slug}`} aria-label={`View ${artifact.project.title} case study`}>
              <Image src={artifact.image} alt={artifact.alt} sizes="(max-width: 720px) 132px, 168px" placeholder="blur" />
            </Link>
            <figcaption>{artifact.caption}<span className="workflow__artifact-detail">Open the case study</span></figcaption>
          </figure>}
          </div>
        </li>;
      })}
    </WorkflowRoute>
  </section>;
}
