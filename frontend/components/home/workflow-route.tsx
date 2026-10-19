"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function WorkflowRoute({ children }: { children: ReactNode }) {
  const route = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const element = route.current;
    if (!element) return;
    const stages = Array.from(element.querySelectorAll<HTMLElement>(".workflow__step"));
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const timers = new Map<HTMLElement, number>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const stage = entry.target as HTMLElement;
        if (stage.dataset.seen) continue;
        stage.dataset.seen = "true";
        if (!reduced.matches) {
          stage.dataset.entering = "true";
          timers.set(stage, window.setTimeout(() => {
            delete stage.dataset.entering;
            timers.delete(stage);
          }, 700));
        }
        observer.unobserve(stage);
      }
    }, { threshold: 0.18, rootMargin: "0px 0px -5% 0px" });

    function syncMotion() {
      if (!reduced.matches) return;
      for (const stage of stages) {
        stage.dataset.seen = "true";
        delete stage.dataset.entering;
      }
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    }
    for (const stage of stages) observer.observe(stage);
    syncMotion();
    reduced.addEventListener("change", syncMotion);
    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", syncMotion);
      for (const timer of timers.values()) clearTimeout(timer);
    };
  }, []);

  return <ol className="workflow__route" ref={route}>{children}</ol>;
}
