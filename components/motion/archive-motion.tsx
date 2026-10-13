"use client";

import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";

const TransitionContext = createContext<(href: string) => void>(() => {});

export function ArchiveMotion({ children }: { children: ReactNode }) {
  const [intro, setIntro] = useState(false);
  const [shutter, setShutter] = useState(false);
  const reduced = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        if (!sessionStorage.getItem("ga-intro-seen")) {
          sessionStorage.setItem("ga-intro-seen", "1");
          setIntro(true);
          timer.current = setTimeout(() => setIntro(false), reduced ? 400 : 1200);
        }
      } catch { /* Storage may be unavailable; never block the page. */ }
    });
    return () => { cancelAnimationFrame(frame); if (timer.current) clearTimeout(timer.current); };
  }, [reduced]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShutter(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  function go(href: string) {
    if (reduced) { router.push(href); return; }
    setShutter(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      router.push(href);
      // A failed navigation must never trap a visitor behind the shutter.
      timer.current = setTimeout(() => setShutter(false), 3000);
    }, 230);
  }

  return <MotionConfig reducedMotion="user"><TransitionContext.Provider value={go}>
    {children}
    <AnimatePresence>{intro && <motion.div className="intro-screen" key="intro" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0.15 : 0.35 }}>
      <div className="intro-mark" aria-hidden="true">GA<span>DESIGN / DEVELOPMENT</span></div>
      <button className="intro-skip mono" onClick={() => setIntro(false)}>Skip intro ↗</button>
    </motion.div>}</AnimatePresence>
    <motion.div className="route-shutter" aria-hidden="true" initial={false} animate={{ scaleY: shutter ? 1 : 0 }} transition={{ duration: 0.23, ease: [0.76, 0, 0.24, 1] }} />
  </TransitionContext.Provider></MotionConfig>;
}

export function ProjectLink({ href, children, className, label }: { href: string; children: ReactNode; className?: string; label?: string }) {
  const go = useContext(TransitionContext);
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); go(href);
  }
  return <Link href={href} className={className} aria-label={label} onClick={handleClick}>{children}</Link>;
}

export function Reveal({ children, className = "", delay = 0, paper = false }: { children: ReactNode; className?: string; delay?: number; paper?: boolean }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : paper ? { clipPath: "inset(0 0 100% 0)" } : { opacity: 0, y: 24 }} whileInView={paper ? { clipPath: "inset(0 0 0% 0)" } : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: paper ? 0.9 : 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

export function HeroName({ first, last }: { first: string; last: string }) {
  const reduced = useReducedMotion();
  return <h1 className="hero-name"><span className="name-mask"><motion.span initial={reduced ? false : { y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.95, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>{first}</motion.span></span><span className="name-mask"><motion.span initial={reduced ? false : { y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.95, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}>{last}<span className="name-period">.</span></motion.span></span></h1>;
}

export function PaperLabel({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return <motion.div className="hero-paper" initial={reduced ? false : { rotate: 8, opacity: 0, y: 20 }} animate={{ rotate: -3, opacity: 1, y: 0 }} transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.55 }}>{children}</motion.div>;
}
