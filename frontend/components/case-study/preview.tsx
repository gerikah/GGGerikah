"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import type { CaseStudy } from "@api/contracts/cms";
import { ProjectLink } from "@frontend/components/motion/archive-motion";

export function CasePreview({ study, width, height }: { study: Pick<CaseStudy, "project" | "sections">; width: number; height: number }) {
  const { project, sections } = study;
  const [open, setOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const titleId = useId();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPortalTarget(document.querySelector<HTMLElement>(".od-public")));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    function cancelScreen() { setOpen(false); }
    window.addEventListener("ga:screen-cancel", cancelScreen);
    return () => window.removeEventListener("ga:screen-cancel", cancelScreen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const background = document.querySelector<HTMLElement>("[data-site-content]");
    const opener = trigger.current;
    const previousOverflow = document.documentElement.style.overflow;
    const wasInert = background?.inert;
    if (background) background.inert = true;
    document.documentElement.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => {
      closeButton.current?.focus();
      window.dispatchEvent(new Event("ga:screen-navigation"));
    });
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
      if (event.key !== "Tab") return;
      const controls = panel.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),[tabindex='0']");
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(frame); document.removeEventListener("keydown", key);
      document.documentElement.style.overflow = previousOverflow;
      if (background) background.inert = Boolean(wasInert) || document.querySelector(".od-public")?.getAttribute("data-loading") === "true";
      opener?.focus({ preventScroll: true });
    };
  }, [open]);

  const content = <AnimatePresence>{open && <div className="case is-open"><motion.div className="case__scrim" aria-hidden="true" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.24 }} />
    <motion.div className="case__panel" ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ duration: reduced ? 0 : 0.38, ease: [0.16, 1, 0.3, 1] }}>
      <div className="case__bar"><span className="eyebrow">{project.category}</span><button className="case__close" ref={closeButton} onClick={() => setOpen(false)} aria-label="Close case study">Close ✕</button></div>
      <div className="case__scroll"><h2 className="case__title" id={titleId}>{project.title}</h2><p className="case__lede">{project.overview}</p><div className="case__grid"><div className="case__block">{sections.filter(section => ["text", "reflection"].includes(section.section_type)).slice(0, 3).map(section => <div key={section.id}>{section.heading && <h3>{section.heading}</h3>}<p>{section.body}</p></div>)}</div><div className="case__block"><h3>Details</h3><dl className="case__facts">{project.role && <div><dt className="k">Role</dt><dd>{project.role}</dd></div>}{project.tools.length > 0 && <div><dt className="k">Build</dt><dd>{project.tools.join(" · ")}</dd></div>}{project.year && <div><dt className="k">Year</dt><dd>{project.year}</dd></div>}{project.status && <div><dt className="k">Status</dt><dd>{project.status}</dd></div>}<div><dt className="k">Type</dt><dd>{project.project_type}</dd></div></dl></div></div>{project.cover_image_url && <div className="case__visual"><Image src={project.cover_image_url} alt={project.cover_alt} width={width} height={height} sizes="90vw" /></div>}<ProjectLink href={`/work/${project.slug}`} className="btn case__full-link" onNavigate={() => setOpen(false)}><span>View full case study</span><span className="arrow" aria-hidden="true">↗</span></ProjectLink></div>
    </motion.div>
  </div>}</AnimatePresence>;

  return <><button className="btn project__cta" ref={trigger} data-cursor="OPEN" onClick={() => setOpen(true)} aria-haspopup="dialog"><span>View case study</span><span className="arrow" aria-hidden="true">↗</span></button>{portalTarget ? createPortal(content, portalTarget) : null}</>;
}
