"use client";

import Image from "next/image";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
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
  const mounted = useRef(false);
  const cancelFocusRestore = useRef<(() => void) | null>(null);
  const restoreFocus = useRef(true);
  const reduced = useReducedMotion();
  const titleId = useId();

  useEffect(() => {
    mounted.current = true;
    const frame = requestAnimationFrame(() => setPortalTarget(document.querySelector<HTMLElement>(".od-public")));
    return () => {
      mounted.current = false;
      cancelAnimationFrame(frame);
      cancelFocusRestore.current?.();
    };
  }, []);

  useEffect(() => {
    function cancelScreen() {
      restoreFocus.current = false;
      cancelFocusRestore.current?.();
      setOpen(false);
    }
    window.addEventListener("ga:screen-cancel", cancelScreen);
    return () => window.removeEventListener("ga:screen-cancel", cancelScreen);
  }, []);

  useEffect(() => {
    if (!open) return;
    cancelFocusRestore.current?.();
    const siteRoot = document.querySelector<HTMLElement>(".od-public");
    const background = document.querySelector<HTMLElement>("[data-site-content]");
    const opener = trigger.current;
    const closingPanel = panel.current;
    const openedUrl = window.location.href;
    const previousOverflow = document.documentElement.style.overflow;
    const wasInert = background?.inert;
    if (background) background.inert = true;
    document.documentElement.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => {
      closeButton.current?.focus();
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
      if (background) background.inert = Boolean(wasInert);
      if (!mounted.current || !restoreFocus.current || !opener || !siteRoot || !background) return;

      // Keep focus inside the dialog until its exit animation releases the background.
      const observer = new MutationObserver(attemptRestore);
      let cancelled = false;
      function cancel() {
        if (cancelled) return;
        cancelled = true;
        observer.disconnect();
        window.removeEventListener("popstate", cancel);
        window.removeEventListener("hashchange", cancel);
        if (cancelFocusRestore.current === cancel) cancelFocusRestore.current = null;
      }
      function attemptRestore() {
        if (cancelled) return;
        if (!mounted.current || !opener!.isConnected || !siteRoot!.isConnected || window.location.href !== openedUrl) {
          cancel();
          return;
        }
        const dialogs = Array.from(siteRoot!.querySelectorAll<HTMLElement>("[aria-modal='true']"))
          .filter(dialog => dialog.getClientRects().length > 0);
        if (dialogs.some(dialog => dialog !== closingPanel)) {
          cancel();
          return;
        }
        if (dialogs.length || background!.inert || opener!.closest("[inert]")) return;
        if (opener!.disabled || !opener!.getClientRects().length || opener!.closest("[hidden]")) {
          cancel();
          return;
        }
        opener!.focus({ preventScroll: true });
        if (document.activeElement === opener) cancel();
      }
      cancelFocusRestore.current = cancel;
      observer.observe(siteRoot, { childList: true, subtree: true, attributes: true, attributeFilter: ["inert", "hidden", "aria-modal"] });
      window.addEventListener("popstate", cancel);
      window.addEventListener("hashchange", cancel);
      attemptRestore();
    };
  }, [open]);

  const content = <AnimatePresence>{open && <div className="case is-open"><motion.div className="case__scrim" aria-hidden="true" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.24 }} />
    <motion.div className="case__panel" ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ duration: reduced ? 0 : 0.38, ease: [0.16, 1, 0.3, 1] }}>
      <div className="case__bar"><button className="case__close" ref={closeButton} onClick={() => setOpen(false)} aria-label="Close case study">Close<XIcon className="ui-icon" size={20} weight="regular" aria-hidden="true" focusable="false" /></button></div>
      <div className="case__scroll"><h2 className={"case__title" + (project.title.length > 18 ? " case-title--long" : "")} id={titleId}>{project.title}</h2><p className="case__cat">{project.category}</p><p className="case__lede">{project.overview}</p>{/independent/i.test(project.project_type) && <p className="concept-label">Independent redesign concept. Not an official client engagement.</p>}<div className="case__grid"><div className="case__block">{sections.filter(section => ["text", "reflection"].includes(section.section_type)).slice(0, 3).map(section => <div key={section.id}>{section.heading && <h3>{section.heading}</h3>}<p>{section.body}</p></div>)}</div><div className="case__block"><h3>Details</h3><dl className="case__facts">{project.role && <div><dt className="k">Role</dt><dd>{project.role}</dd></div>}{project.tools.length > 0 && <div><dt className="k">Build</dt><dd>{project.tools.join(" · ")}</dd></div>}{project.year && <div><dt className="k">Year</dt><dd>{project.year}</dd></div>}{project.status && <div><dt className="k">Status</dt><dd>{project.status}</dd></div>}<div><dt className="k">Type</dt><dd>{project.project_type}</dd></div></dl></div></div>{project.cover_image_url && <div className="case__visual"><Image src={project.cover_image_url} alt={project.cover_alt} width={width} height={height} sizes="90vw" /></div>}<ProjectLink href={`/work/${project.slug}`} className="btn case__full-link" onNavigate={() => { restoreFocus.current = false; setOpen(false); }}><span>View full case study</span><ArrowUpRightIcon className="ui-icon" size={20} weight="regular" aria-hidden="true" focusable="false" /></ProjectLink></div>
    </motion.div>
  </div>}</AnimatePresence>;

  return <><button className="btn project__cta" ref={trigger} data-cursor="OPEN" onClick={() => { restoreFocus.current = true; cancelFocusRestore.current?.(); setOpen(true); }} aria-haspopup="dialog"><span>View case study</span><ArrowUpRightIcon className="ui-icon" size={20} weight="regular" aria-hidden="true" focusable="false" /></button><noscript><style>{"button.project__cta{display:none!important}"}</style><a className="btn project__cta" href={`/work/${project.slug}`}>View case study<ArrowUpRightIcon className="ui-icon" size={20} weight="regular" aria-hidden="true" focusable="false" /></a></noscript>{portalTarget ? createPortal(content, portalTarget) : null}</>;
}
