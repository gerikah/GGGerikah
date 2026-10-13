"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function Header({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggle = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  const links = [{ label: "Home", href: "/" }, { label: "Work", href: pathname === "/" ? "/#work" : "/work" }, { label: "About", href: "/#about" }, { label: "Contact", href: "/#contact" }];
  useEffect(() => {
    if (!open) return;
    nav.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    function escape(event: KeyboardEvent) { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } }
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  return <header className="site-header"><Link href="/" className="wordmark" aria-label={`${name}, home`} onClick={() => setOpen(false)}><span className="monogram">GA<span>↗</span></span><span className="wordmark-caption mono">DESIGNER<br />& DEVELOPER</span></Link>
    <span className="header-index mono" aria-hidden="true">PERSONAL ARCHIVE / VOL. 01</span>
    <button ref={toggle} className="menu-toggle mono" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>{open ? "Close −" : "Menu +"}</button>
    <nav ref={nav} id="main-nav" className={`main-nav ${open ? "is-open" : ""}`} aria-label="Main navigation">{links.map((link, i) => <Link key={link.label} href={link.href} className={pathname === link.href ? "active" : ""} aria-current={pathname === link.href ? "page" : undefined} onClick={() => setOpen(false)}><span className="nav-number mono">0{i + 1}</span>{link.label}</Link>)}</nav>
  </header>;
}
