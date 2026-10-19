"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { usePathname } from "next/navigation";

export function ArchiveMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const registered = new Set<Element>();
    const moving = new Set<HTMLElement>();
    let frame = 0;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const target = entry.target as HTMLElement;
        if (!reduced.matches && !target.dataset.seen) target.dataset.entering = "true";
        target.dataset.seen = "true";
        observer.unobserve(entry.target);
      });
    }, { threshold: .1 });
    function updateParallax() {
      frame = 0;
      if (reduced.matches) return;
      const height = window.innerHeight;
      const positions = [...moving].map(element => {
        const rect = element.parentElement!.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > height) return null;
        const progress = Math.max(-1, Math.min(1, (height / 2 - rect.top - rect.height / 2) / height));
        const distance = Number(element.dataset.parallax) * (window.innerWidth < 768 ? 0.4 : 1);
        return { element, offset: progress * distance };
      });
      for (const position of positions) {
        if (position) position.element.style.translate = `0 ${position.offset.toFixed(2)}px`;
      }
    }
    function schedule() {
      if (!frame && !reduced.matches) frame = requestAnimationFrame(updateParallax);
    }
    function register() {
      container!.querySelectorAll<HTMLElement>("[data-reveal], [data-parallax]").forEach(element => {
        if (registered.has(element)) return;
        registered.add(element);
        if (element.hasAttribute("data-reveal")) observer.observe(element);
        if (element.hasAttribute("data-parallax")) moving.add(element);
      });
      for (const element of moving) if (!element.isConnected) moving.delete(element);
      schedule();
    }
    function syncPreference() {
      cancelAnimationFrame(frame);
      frame = 0;
      for (const element of moving) element.style.removeProperty("translate");
      schedule();
    }
    register();
    // Streamed route content can arrive after the pathname changes.
    const mutations = new MutationObserver(register);
    mutations.observe(container, { childList: true, subtree: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", syncPreference);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", syncPreference);
      for (const element of moving) element.style.removeProperty("translate");
    };
  }, [pathname]);

  return <div className="od-public" ref={root}>{children}</div>;
}

export function Reveal({ children, className = "", delay = 0, variant = "rise" }: { children: ReactNode; className?: string; delay?: number; variant?: "rise" | "image" }) {
  return <div data-reveal={variant} className={className} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>{children}</div>;
}
