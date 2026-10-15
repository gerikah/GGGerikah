"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import personalMark from "@frontend/public/images/logo-white.png";

export function HeroMark() {
  const visualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const visual = visualRef.current;
    if (!visual) return;

    const desktopPointer = window.matchMedia("(min-width: 721px) and (hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame: number | null = null;
    let pointerX = 0;
    let pointerY = 0;
    let removePointerListeners = () => {};

    const writePosition = (x: number, y: number) => {
      visual.style.setProperty("--hero-mark-x", `${x * 4}px`);
      visual.style.setProperty("--hero-mark-y", `${y * 4}px`);
      visual.style.setProperty("--hero-cursor-x", `${x * 8}px`);
      visual.style.setProperty("--hero-cursor-y", `${y * 8}px`);
      visual.style.setProperty("--hero-window-x", `${x * -6}px`);
      visual.style.setProperty("--hero-window-y", `${y * -6}px`);
    };

    const reset = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      writePosition(0, 0);
    };

    const updatePosition = () => {
      frame = null;
      const bounds = visual.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = Math.max(-1, Math.min(1, (pointerX - bounds.left) / bounds.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (pointerY - bounds.top) / bounds.height * 2 - 1));
      // Cap diagonal travel too, so the cursor never moves beyond eight pixels.
      const distance = Math.max(1, Math.hypot(x, y));
      writePosition(x / distance, y / distance);
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame === null) frame = window.requestAnimationFrame(updatePosition);
    };

    const syncAvailability = () => {
      removePointerListeners();
      reset();
      const enabled = desktopPointer.matches && !reducedMotion.matches;
      visual.dataset.pointerMotion = enabled ? "enabled" : "disabled";
      if (!enabled) return;

      visual.addEventListener("pointermove", move, { passive: true });
      visual.addEventListener("pointerleave", reset);
      visual.addEventListener("pointercancel", reset);
      removePointerListeners = () => {
        visual.removeEventListener("pointermove", move);
        visual.removeEventListener("pointerleave", reset);
        visual.removeEventListener("pointercancel", reset);
      };
    };

    syncAvailability();
    desktopPointer.addEventListener("change", syncAvailability);
    reducedMotion.addEventListener("change", syncAvailability);
    return () => {
      removePointerListeners();
      desktopPointer.removeEventListener("change", syncAvailability);
      reducedMotion.removeEventListener("change", syncAvailability);
      reset();
    };
  }, []);

  return <div ref={visualRef} className="hero-mark" aria-hidden="true">
    <div className="hero-mark__frame hero-mark__frame--wide">
      <span className="hero-mark__line" />
      {/* Complementary clips separate the original artwork without redrawing the mark. */}
      <Image src={personalMark} alt="" className="hero-mark__logo" sizes="(max-width: 720px) 132px, 280px" preload />
      <Image src={personalMark} alt="" className="hero-mark__cursor" sizes="(max-width: 720px) 132px, 280px" />
    </div>
    <div className="hero-mark__frame hero-mark__frame--narrow">
      <span className="hero-mark__line" />
      <span className="hero-mark__column" />
      <span className="hero-mark__column" />
    </div>
  </div>;
}
