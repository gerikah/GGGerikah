import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { getProjects, getSiteSettings } from "@backend/cms/data";
import { imageDimensions } from "@frontend/lib/image-dimensions";

export const metadata: Metadata = { title: "Project archive" };

export default async function WorkPage() {
  const [projects, settings] = await Promise.all([getProjects(), getSiteSettings()]);

  return <main id="main-content" className="archive-page" data-page-ready="/work">
    <header className="archive-heading section-wrap">
      <p className="meta">Complete archive</p>
      <h1>Work, collected.</h1>
      <p>Interfaces, game screens, wireframes, and the systems behind them.</p>
      <p className="archive-heading__count">{String(projects.length).padStart(2, "0")} {projects.length === 1 ? "project" : "projects"}</p>
    </header>

    <section className="section-wrap" aria-label="Project index">
      {projects.length ? <ol className="archive-index">
        {projects.map(project => {
          const dimensions = imageDimensions(project.cover_image_url);
          const independent = /independent/i.test(project.project_type);

          return <li key={project.id}>
            <Link className="archive-index__row" href={`/work/${project.slug}`}>
              <span className="archive-index__number">{String(project.project_number).padStart(2, "0")}</span>
              <span className="archive-index__image">
                {project.cover_image_url && <Image src={project.cover_image_url} alt={project.cover_alt} width={dimensions.width} height={dimensions.height} sizes="160px" />}
              </span>
              <div className="archive-index__copy">
                <h2 className="archive-index__title">{project.title}</h2>
                <p className="archive-index__category">{project.category}</p>
                <p className="archive-index__description">{project.short_description}</p>
                {independent && <p className="concept-label">Independent redesign concept. Not an official client engagement.</p>}
              </div>
              <span className="archive-index__type">{project.project_type}</span>
              <ArrowUpRightIcon className="ui-icon archive-index__arrow" aria-hidden="true" focusable="false" />
            </Link>
          </li>;
        })}
      </ol> : <p className="empty-note">No published projects yet.</p>}
    </section>

    <div className="archive-close section-wrap">
      <p>{settings.footer_copy || settings.role}</p>
      <Link href="/#contact">Start a conversation<ArrowUpRightIcon className="ui-icon" aria-hidden="true" focusable="false" /></Link>
    </div>
  </main>;
}
