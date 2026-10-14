"use client";

import { MotionConfig } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

export function ArchiveMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = root.current;
    const background = container?.querySelector<HTMLElement>("[data-site-content]");
    if (!container || !background) return;

    function syncModalBackground() {
      const modalOpen = Array.from(container!.querySelectorAll<HTMLElement>("[role='dialog'][aria-modal='true']"))
        .some(dialog => dialog.getClientRects().length > 0);
      // Keep the background out of the tab order until a dialog's exit completes.
      if (background!.inert !== modalOpen) background!.inert = modalOpen;
    }

    const observer = new MutationObserver(syncModalBackground);
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "aria-modal", "inert"],
    });
    syncModalBackground();
    return () => observer.disconnect();
  }, []);

  return <MotionConfig reducedMotion="user">
    <div className="od-public" ref={root} data-loading="false">
      <div data-site-content>{children}</div>
    </div>
  </MotionConfig>;
}

export function ProjectLink({ href, children, className, label, cursor, onNavigate }: {
  href: string;
  children: ReactNode;
  className?: string;
  label?: string;
  cursor?: string;
  onNavigate?: () => void;
}) {
  return <Link href={href} className={className} aria-label={label} data-cursor={cursor} data-project-link onNavigate={onNavigate}>{children}</Link>;
}

export function Reveal({ children, className = "", paper = false }: {
  children: ReactNode;
  className?: string;
  delay?: number;
  paper?: boolean;
}) {
  // Case-study wrappers keep their layout, with content visible in the initial HTML.
  return <div data-reveal className={className}>
    {paper ? <div data-paper-reveal className="paper-reveal-content">{children}</div> : children}
  </div>;
}

export function HeroName({ first }: { first: string }) {
  return <h1 className="hero__name" id="hero-name"><span className="mask"><span>{first}</span></span></h1>;
}
