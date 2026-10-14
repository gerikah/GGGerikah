"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type PointerEvent, type KeyboardEvent } from "react";

export function WorkRail({ children, count }: { children: ReactNode; count: number }) {
  const rail = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const reduced = useReducedMotion();
  const momentum = useRef(0);
  const drag = useRef({ down: false, moved: false, startX: 0, startScroll: 0, lastX: 0, lastTime: 0, velocity: 0 });

  function currentIndex() {
    const element = rail.current;
    if (!element) return 0;
    const middle = element.scrollLeft + element.clientWidth / 2;
    let closest = 0, distance = Infinity;
    Array.from(element.children).forEach((child, i) => {
      const card = child as HTMLElement;
      const center = card.offsetLeft - element.offsetLeft + card.offsetWidth / 2;
      if (Math.abs(center - middle) < distance) { distance = Math.abs(center - middle); closest = i; }
    });
    return closest;
  }

  function goTo(target: number) {
    const element = rail.current;
    const child = element?.children[Math.max(0, Math.min(count - 1, target))] as HTMLElement | undefined;
    if (!element || !child) return;
    element.scrollTo({ left: child.offsetLeft - element.offsetLeft + child.offsetWidth / 2 - element.clientWidth / 2, behavior: reduced ? "instant" : "smooth" });
  }

  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const update = () => setIndex(currentIndex());
    element.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const frame = requestAnimationFrame(update);
    return () => { element.removeEventListener("scroll", update); window.removeEventListener("resize", update); cancelAnimationFrame(frame); cancelAnimationFrame(momentum.current); };
  }, []);

  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0 || matchMedia("(max-width:900px)").matches) return;
    cancelAnimationFrame(momentum.current);
    drag.current = { down: true, moved: false, startX: event.clientX, startScroll: event.currentTarget.scrollLeft, lastX: event.clientX, lastTime: performance.now(), velocity: 0 };
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state.down) return;
    const distance = event.clientX - state.startX;
    if (Math.abs(distance) > 4 && !state.moved) {
      state.moved = true; setDragging(true); event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!state.moved) return;
    event.currentTarget.scrollLeft = state.startScroll - distance;
    const now = performance.now();
    state.velocity = (event.clientX - state.lastX) / Math.max(1, now - state.lastTime);
    state.lastX = event.clientX; state.lastTime = now;
  }

  function end() {
    const state = drag.current;
    if (!state.down) return;
    state.down = false; setDragging(false);
    if (reduced || !state.moved) return;
    let velocity = Math.max(-30, Math.min(30, state.velocity * 15));
    function decay() {
      if (!rail.current || Math.abs(velocity) < 0.4) return;
      rail.current.scrollLeft -= velocity; velocity *= 0.92;
      momentum.current = requestAnimationFrame(decay);
    }
    momentum.current = requestAnimationFrame(decay);
  }

  function key(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || matchMedia("(max-width:900px)").matches) return;
    const targets: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: count - 1 };
    if (event.key in targets) { event.preventDefault(); goTo(targets[event.key]); }
  }

  return <div className="work__rail-wrap"><div className="wrap"><div className="work__controls"><p className="work__count" aria-live="polite"><b>{String(index + 1).padStart(2, "0")}</b> / {String(count).padStart(2, "0")}</p><div className="work__nav"><button className="work__btn" type="button" aria-label="Previous project" disabled={index === 0} onClick={() => goTo(index - 1)}>←</button><button className="work__btn" type="button" aria-label="Next project" disabled={index === count - 1} onClick={() => goTo(index + 1)}>→</button></div></div></div>
    <div className={`rail ${dragging ? "is-dragging" : ""}`} ref={rail} tabIndex={0} role="region" aria-label="Project gallery, scroll or use arrow buttons" data-cursor="DRAG" onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onPointerLeave={end} onKeyDown={key} onClickCapture={event => { if (drag.current.moved) { event.preventDefault(); event.stopPropagation(); drag.current.moved = false; } }} onDragStart={event => event.preventDefault()}>{children}</div>
    <p className="rail__hint" aria-hidden="true"><svg width="30" height="12" viewBox="0 0 30 12"><path d="M2 6h22M20 1l6 5-6 5M28 6H6M10 11l-6-5 6-5" fill="none" stroke="#555" strokeWidth="1.2" /></svg>Drag the archive</p>
  </div>;
}
