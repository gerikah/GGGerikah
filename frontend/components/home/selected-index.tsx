"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowDownRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowDownRight";
import storefront from "@frontend/public/images/off-the-rack/home.jpg";
import taskMate from "@frontend/public/images/task-mate/showcase.png";
import dashboard from "@frontend/public/images/ground-control-station/dashboard.png";

type SelectedProject = {
  slug: string;
  number: string;
  title: string;
  label: string;
  target: string;
};

const previews = {
  "off-the-rack": storefront,
  "task-mate": taskMate,
  "ground-control-station": dashboard,
};

function canPreview() {
  return window.matchMedia("(min-width: 721px) and (hover: hover) and (pointer: fine)").matches;
}

export function SelectedIndex({ projects }: { projects: SelectedProject[] }) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [focusedSlug, setFocusedSlug] = useState<string | null>(null);
  const [previewEligible, setPreviewEligible] = useState(false);
  const activeSlug = hoveredSlug ?? focusedSlug;
  const activeProject = projects.find(project => project.slug === activeSlug);
  const preview = previewEligible && activeSlug && activeSlug in previews
    ? previews[activeSlug as keyof typeof previews]
    : null;

  return <section id="selected-work" className="selected-bridge wrap" aria-labelledby="selected-index-title">
    <nav className="hero-index" aria-label="Selected project index">
      <h2 id="selected-index-title" className="hero-index__label meta">Selected work</h2>
      <div className="hero-index__browser">
        <ol className="hero-index__rows">
          {projects.map(project => <li
            className="hero-index__entry"
            key={project.slug}
            data-active={activeSlug === project.slug ? "true" : undefined}
            onPointerEnter={event => {
              if (event.pointerType === "touch") return;
              setHoveredSlug(project.slug);
              setPreviewEligible(canPreview());
            }}
            onPointerLeave={() => setHoveredSlug(null)}
          >
            <Link
              className="hero-index__link"
              href={`#${project.target}`}
              onFocus={() => {
                setHoveredSlug(null);
                setFocusedSlug(project.slug);
                setPreviewEligible(canPreview());
              }}
              onBlur={() => setFocusedSlug(null)}
            >
              <span className="hero-index__number meta">{project.number}</span>
              <span><strong>{project.title}</strong><small>{project.label}</small></span>
              <ArrowDownRightIcon className="ui-icon" aria-hidden="true" focusable="false" />
            </Link>
          </li>)}
        </ol>
        <div className="hero-index__preview" aria-hidden="true" data-active={preview ? "true" : undefined} data-project={preview ? activeSlug : undefined}>
          {preview && <>
            <div className="hero-index__preview-media"><Image key={activeSlug} src={preview} alt="" className="hero-index__preview-image" fill sizes="320px" loading="lazy" placeholder="blur" /></div>
            <span className="hero-index__preview-caption meta">{activeProject?.title}</span>
          </>}
        </div>
      </div>
    </nav>
  </section>;
}
