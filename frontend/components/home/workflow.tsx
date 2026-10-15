import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { Project } from "@api/contracts/cms";
import inquiryWireframe from "@frontend/public/images/off-the-rack/inquiry-wireframe.png";
import administration from "@frontend/public/images/off-the-rack/admin.jpg";
import marciDetail from "@frontend/public/images/marci/homepage-detail.png";
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

export function Workflow({ projects }: { projects: Project[] }) {
  const published = projects.filter(project => project.is_published);
  const offTheRack = published.find(project => project.slug === "off-the-rack");
  const marci = published.find(project => project.slug === "marci-metzger-homes");
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

  if (marci) {
    artifacts.interface = {
      image: marciDetail,
      alt: "Three real estate services arranged with photography and supporting descriptions",
      caption: "Marci concept / Interface",
      project: marci,
    };
  } else if (groundControl) {
    artifacts.interface = {
      image: dashboard,
      alt: "Ground Control Station interface with flight records and connection controls",
      caption: "Ground Control / Interface",
      project: groundControl,
    };
  }

  return <section id="workflow" className="workflow wrap" aria-labelledby="workflow-title">
    <div className="workflow__heading">
      <h2 id="workflow-title">From brief to browser</h2>
      <p>A connected process. Foundation and interface work can overlap.</p>
    </div>
    <ol className="workflow__route">
      {steps.map((step, index) => {
        const artifact = artifacts[step.id];
        const isBuild = step.id === "foundation" || step.id === "interface";
        return <li key={step.id} className={`workflow__step workflow__step--${step.id}`} aria-describedby={isBuild ? "workflow-build-note" : undefined}>
          {step.id === "foundation" && <span id="workflow-build-note" className="workflow__build-connection">Build / parallel work</span>}
          {/* taste-skill-ignore: the requested ordered workflow uses visible step numbers. */}
          <span className="workflow__number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <div className="workflow__step-copy">
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
          {artifact && <figure className="workflow__artifact">
            <Link className="workflow__artifact-link image-link" href={`/work/${artifact.project.slug}`} aria-label={`View ${artifact.project.title} case study`}>
              <Image src={artifact.image} alt={artifact.alt} sizes="(max-width: 720px) 132px, 168px" placeholder="blur" />
            </Link>
            <figcaption>{artifact.caption}</figcaption>
          </figure>}
        </li>;
      })}
    </ol>
  </section>;
}
