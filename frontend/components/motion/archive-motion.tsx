"use client";

import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";
import { LogoLoader } from "./logo-loader";

const TransitionContext = createContext<(href: string) => void>(() => {});
const ReadyContext = createContext(false);
const easeOut = [0.16, 1, 0.3, 1] as const;
type GateKind = "initial" | "route" | "anchor" | "pop" | "visible" | "screen";
type PendingGate = { controller: AbortController; check: () => void; dispose: () => void; url: URL; kind: GateKind };

function locationKey(url: URL) {
  const query = url.searchParams.toString();
  return url.pathname + (query ? `?${query}` : "");
}

// Search-only navigations do not change usePathname. Observe the committed URL
// under its own Suspense boundary, so static pages retain their server-rendered UI.
function NavigationCommit({ onCommit }: { onCommit: (key: string) => void }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const query = search.toString();
  useEffect(() => { onCommit(pathname + (query ? `?${query}` : "")); }, [pathname, query, onCommit]);
  return null;
}

function nextFrame(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const frame = requestAnimationFrame(() => { signal.removeEventListener("abort", abort); resolve(); });
    function abort() { cancelAnimationFrame(frame); reject(new DOMException("Cancelled", "AbortError")); }
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
}

function imageReady(image: HTMLImageElement, signal: AbortSignal, container: HTMLElement) {
  return new Promise<void>((resolve, reject) => {
    let settled = false, decoding = false;
    const observer = new MutationObserver(() => {
      // A dismissed screen's image is no longer needed, even if its request hangs.
      if (!image.isConnected || !image.getClientRects().length) settle();
    });
    function cleanup() { observer.disconnect(); image.removeEventListener("load", finish); image.removeEventListener("error", finish); signal.removeEventListener("abort", abort); }
    function settle() { if (settled) return; settled = true; cleanup(); resolve(); }
    async function finish() {
      if (settled || decoding) return;
      decoding = true;
      // A broken image is a settled error, not a reason to hide the whole page.
      if (image.naturalWidth && image.decode) await image.decode().catch(() => {});
      settle();
    }
    function abort() { if (settled) return; settled = true; cleanup(); reject(new DOMException("Cancelled", "AbortError")); }
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) { abort(); return; }
    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "hidden"] });
    if (image.complete) { void finish(); return; }
    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
    // Only images needed for this screen are promoted; offscreen lazy images stay lazy.
    if (image.loading === "lazy") image.dataset.loaderPromoted = "true";
    image.loading = "eager";
  });
}

function screenImages(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLImageElement>("img")).filter(image => {
    if (image.closest("[data-logo-loader]") || !image.getAttribute("src")) return false;
    const rect = image.getBoundingClientRect();
    // Cached Next route trees may remain mounted but hidden. They are not this screen.
    if (rect.width <= 0 || rect.height <= 0) return false;
    if (image.loading === "eager" && image.dataset.loaderPromoted !== "true") return true;
    return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
  });
}

export function ArchiveMotion({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const [kind, setKind] = useState<GateKind>("initial");
  const reduced = useReducedMotion();
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const pending = useRef<PendingGate | null>(null);
  const committedLocation = useRef<string | null>(null);
  const generation = useRef(0);
  const lastReady = useRef("");
  const failedUrl = useRef("");

  const begin = useCallback((url: URL, gateKind: GateKind) => {
    const container = root.current;
    if (!container) return;
    pending.current?.dispose();
    const ticket = ++generation.current;
    const controller = new AbortController();
    const { signal } = controller;
    let checking = false, finished = false;
    setKind(gateKind); setError(false); setLoading(true);
    const timeout = window.setTimeout(() => {
      if (finished || signal.aborted || generation.current !== ticket) return;
      failedUrl.current = url.pathname + url.search + url.hash;
      dispose(); pending.current = null;
      setLoading(false); setError(true);
    }, 15000);
    const observer = new MutationObserver(() => { void check(); });
    function dispose() { controller.abort(); observer.disconnect(); window.clearTimeout(timeout); }
    function markerReady() {
      if (committedLocation.current !== locationKey(url) || locationKey(new URL(window.location.href)) !== locationKey(url)) return null;
      if (Array.from(container!.querySelectorAll<HTMLElement>("[data-page-loading]")).some(node => node.getClientRects().length > 0)) return null;
      if (Array.from(container!.querySelectorAll<HTMLElement>("[data-visual-ready='false']")).some(node => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight;
      })) return null;
      const marker = Array.from(container!.querySelectorAll<HTMLElement>("[data-page-ready]")).find(node => {
        const value = node.dataset.pageReady;
        if (!node.getClientRects().length) return false;
        if (value === url.pathname) return true;
        if (value === "error" || value === "not-found") return true;
        return value === "";
      });
      return marker ?? null;
    }
    async function check() {
      if (checking || finished || signal.aborted || !markerReady()) return;
      checking = true;
      try {
        if (gateKind === "initial" && document.readyState !== "complete") {
          await new Promise<void>((resolve, reject) => {
            const done = () => { signal.removeEventListener("abort", cancelled); resolve(); };
            const cancelled = () => { window.removeEventListener("load", done); reject(new DOMException("Cancelled", "AbortError")); };
            window.addEventListener("load", done, { once: true });
            signal.addEventListener("abort", cancelled, { once: true });
          });
        }
        await document.fonts.ready;
        if (signal.aborted || generation.current !== ticket) return;
        let target: HTMLElement | null = null;
        if (url.hash && ["initial", "route", "anchor", "pop"].includes(gateKind)) {
          try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { /* Invalid fragments leave the readable page in place. */ }
          target?.scrollIntoView({ behavior: "instant", block: "start" });
        }
        if (gateKind === "anchor" && !url.hash) window.scrollTo({ top: 0, behavior: "instant" });
        await nextFrame(signal);
        await Promise.all(screenImages(container!).map(image => imageReady(image, signal, container!)));
        await nextFrame(signal);
        if (!markerReady()) { checking = false; void check(); return; }
        if (signal.aborted) return;
        finished = true; lastReady.current = window.location.pathname + window.location.search + window.location.hash;
        dispose(); pending.current = null; setLoading(false);
        if (["route", "anchor"].includes(gateKind)) requestAnimationFrame(() => {
          if (generation.current !== ticket || !root.current) return;
          const focus = target || container!.querySelector<HTMLElement>("[data-page-ready]");
          if (focus) { if (!focus.hasAttribute("tabindex")) focus.setAttribute("tabindex", "-1"); focus.focus({ preventScroll: true }); }
        });
      } catch (caught) {
        if (generation.current === ticket && !signal.aborted && !(caught instanceof DOMException && caught.name === "AbortError")) {
          dispose(); pending.current = null; setLoading(false); setError(true);
          failedUrl.current = url.pathname + url.search + url.hash;
        }
      }
    }
    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-page-ready", "data-page-loading", "data-visual-ready", "src", "srcset", "style", "hidden"] });
    pending.current = { controller, dispose, check: () => { void check(); }, url, kind: gateKind };
    void check();
  }, []);

  const navigate = useCallback((href: string) => {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin || !["http:", "https:"].includes(url.protocol)) return;
    const samePage = url.pathname === window.location.pathname && url.search === window.location.search;
    begin(url, samePage ? "anchor" : "route");
    if (samePage) { if (url.hash) history.pushState(history.state, "", url.pathname + url.search + url.hash); }
    else router.push(url.pathname + url.search + url.hash);
  }, [begin, router]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setEnhanced(true);
      begin(new URL(window.location.href), "initial");
    });
    return () => { cancelAnimationFrame(frame); pending.current?.dispose(); pending.current = null; };
    // Initial document readiness is separate from subsequent route commits.
  }, [begin]);

  const recordCommit = useCallback((key: string) => {
    committedLocation.current = key;
    if (pending.current) pending.current.check();
    else if (lastReady.current && locationKey(new URL(lastReady.current, window.location.origin)) !== key) begin(new URL(window.location.href), "route");
  }, [begin]);

  useEffect(() => {
    function linkClick(event: globalThis.MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || !root.current?.contains(link) || link.hasAttribute("data-project-link") || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || !["http:", "https:"].includes(url.protocol)) return;
      event.preventDefault(); navigate(url.href);
    }
    const pop = () => begin(new URL(window.location.href), "pop");
    const visible = () => { if (document.visibilityState === "visible") { if (pending.current) pending.current.check(); else begin(new URL(window.location.href), "visible"); } };
    const screen = () => { requestAnimationFrame(() => {
      // A delayed modal-open event must not cancel a newer route/back navigation.
      if (pending.current && ["route", "anchor", "pop"].includes(pending.current.kind)) return;
      begin(new URL(window.location.href), "screen");
    }); };
    document.addEventListener("click", linkClick, true);
    window.addEventListener("popstate", pop); window.addEventListener("pageshow", visible);
    document.addEventListener("visibilitychange", visible); window.addEventListener("ga:screen-navigation", screen);
    return () => {
      document.removeEventListener("click", linkClick, true);
      window.removeEventListener("popstate", pop); window.removeEventListener("pageshow", visible);
      document.removeEventListener("visibilitychange", visible); window.removeEventListener("ga:screen-navigation", screen);
    };
  }, [begin, navigate]);

  useEffect(() => {
    const container = root.current;
    const background = container?.querySelector<HTMLElement>("[data-site-content]");
    if (!container || !background) return;
    function sync() {
      const modalOpen = Array.from(container!.querySelectorAll<HTMLElement>("[role='dialog'][aria-modal='true']")).some(dialog => dialog.getClientRects().length > 0);
      background!.inert = loading || error || modalOpen;
    }
    // A portal can open/close during a gate. Derive inert from both owners rather
    // than restoring a stale snapshot after the loading state has changed.
    const observer = new MutationObserver(sync);
    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "aria-modal"] });
    sync();
    return () => observer.disconnect();
  }, [loading, error]);

  function retry() {
    const url = new URL(failedUrl.current || window.location.href, window.location.origin);
    begin(url, "route");
    if (url.pathname !== window.location.pathname) router.push(url.pathname + url.search + url.hash);
    else router.refresh();
  }
  function returnToReady() {
    window.dispatchEvent(new Event("ga:screen-cancel"));
    const url = new URL(lastReady.current || "/", window.location.origin);
    begin(url, "route"); router.replace(url.pathname + url.search + url.hash);
  }
  const shutter = loading && ["route", "anchor", "pop"].includes(kind);
  return <MotionConfig reducedMotion="user"><TransitionContext.Provider value={navigate}><ReadyContext.Provider value={!loading && !error}>
    <div className={`od-public ${enhanced ? "is-enhanced" : ""}`} ref={root} data-loading={loading || error ? "true" : "false"}>
      <Suspense fallback={null}><NavigationCommit onCommit={recordCommit} /></Suspense>
      <div data-site-content style={{ opacity: loading || error ? 0 : 1 }} inert={enhanced && (loading || error) && kind !== "screen" ? true : undefined}>{children}</div>
      <noscript><style>{"html{overflow:auto!important}[data-logo-loader]{display:none!important}.od-public [data-site-content]{opacity:1!important}.od-public [data-reveal],.od-public [data-paper-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}.od-public .mask>span{transform:none!important}"}</style></noscript>
      <AnimatePresence>{(loading || error) && <LogoLoader key="logo-loader" error={error} onRetry={retry} onReturn={returnToReady} />}</AnimatePresence>
      <div className="shutter" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <motion.span key={index} initial={false} animate={{ y: shutter ? "0%" : "-101%" }} transition={{ duration: reduced ? 0 : 0.38, delay: reduced ? 0 : index * 0.026, ease: [0.7, 0, 0.84, 0] }} />)}</div>
    </div>
  </ReadyContext.Provider></TransitionContext.Provider></MotionConfig>;
}

export function ProjectLink({ href, children, className, label, cursor, onNavigate }: { href: string; children: ReactNode; className?: string; label?: string; cursor?: string; onNavigate?: () => void }) {
  const navigate = useContext(TransitionContext);
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onNavigate?.(); navigate(href);
  }
  return <Link href={href} className={className} aria-label={label} data-cursor={cursor} data-project-link onClick={handleClick}>{children}</Link>;
}

export function Reveal({ children, className = "", delay = 0, paper = false }: { children: ReactNode; className?: string; delay?: number; paper?: boolean }) {
  const reduced = useReducedMotion();
  // Observe an unclipped outer box; clipping that box itself can report zero intersection forever.
  return <motion.div data-reveal className={className} initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.16, margin: "0px 0px -8% 0px" }} variants={paper ? { hidden: {}, shown: {} } : { hidden: { opacity: 0, y: 26 }, shown: { opacity: 1, y: 0 } }} transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : delay, ease: easeOut }}>
    {paper ? <motion.div data-paper-reveal className="paper-reveal-content" variants={{ hidden: { clipPath: "inset(0 0 100% 0)" }, shown: { clipPath: "inset(0 0 0% 0)" } }} transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : delay, ease: easeOut }}>{children}</motion.div> : children}
  </motion.div>;
}

export function HeroName({ first }: { first: string }) {
  const reduced = useReducedMotion();
  const ready = useContext(ReadyContext);
  return <h1 className="hero__name" id="hero-name"><span className="mask"><motion.span initial={{ y: "108%" }} animate={{ y: ready ? 0 : "108%" }} transition={{ duration: reduced ? 0 : 0.9, ease: easeOut }}>{first}</motion.span></span></h1>;
}
