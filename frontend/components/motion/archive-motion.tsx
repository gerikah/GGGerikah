"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ArchiveMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!reduced.matches) (entry.target as HTMLElement).dataset.entering = "true";
        observer.unobserve(entry.target);
      });
    }, { threshold: .1 });
    container.querySelectorAll("[data-reveal]").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return <div className="od-public" ref={root}>{children}</div>;
}

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div data-reveal className={className}>{children}</div>;
}
