"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

export function LogoLoader({ error = false, onRetry, onReturn }: { error?: boolean; onRetry?: () => void; onReturn?: () => void }) {
  const reduced = useReducedMotion();
  const retry = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!error) return;
    retry.current?.focus();
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); onReturn?.(); return; }
      if (event.key !== "Tab") return;
      const controls = dialog.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])");
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (!dialog.current?.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", key, true);
    return () => document.removeEventListener("keydown", key, true);
  }, [error, onReturn]);
  return <motion.div ref={dialog} className={`logo-loader${error ? " logo-loader--error" : ""}`} data-logo-loader role={error ? "alertdialog" : "status"} aria-modal={error ? true : undefined} aria-live="polite" aria-label={error ? "Screen loading failed" : "Loading screen"} aria-busy={!error} initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0.08 : 0.18 }}>
    <div className="logo-loader__content"><Image src="/images/logo-white.png" alt="" width={401} height={400} sizes="96px" preload unoptimized className="logo-loader__mark" /><span className="logo-loader__rule" aria-hidden="true" />
      <p className="logo-loader__status">{error ? "This screen could not finish loading." : "Opening the archive"}</p>
      {error && <><p className="logo-loader__detail">Check your connection and try again.</p><div className="logo-loader__actions"><button ref={retry} type="button" onClick={onRetry}>Try again ↗</button><button type="button" onClick={onReturn}>Return to the portfolio</button></div></>}
    </div>
  </motion.div>;
}
