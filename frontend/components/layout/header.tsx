"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function Header() {
  const pathname = usePathname();
  const home = pathname === "/";
  const sentinel = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const target = sentinel.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  const links = [
    { label: "Work", href: home ? "#selected-work" : "/work", target: "work" },
    { label: "About", href: home ? "#about" : "/#about", target: "about" },
    { label: "Contact", href: home ? "#contact" : "/#contact", target: "contact" },
  ];
  return <><div className="nav-trigger" ref={sentinel} aria-hidden="true" /><div className="nav-shell" data-scrolled={scrolled}><header className="nav" data-scrolled={scrolled}>
    <Link className="nav__brand" href="/" aria-label="Gerikah Alday, return home" data-nav-target="top"><Image src="/images/brand/logo.svg" alt="Gerikah Alday logo" width={40} height={40} sizes="40px" className="nav__logo" /></Link>
    <nav className="nav__links" aria-label="Primary navigation">{links.map((link) => <Link key={link.label} href={link.href} className="nav__link" aria-label={link.label} data-label={link.label} data-nav-target={link.target} aria-current={link.label === "Work" && pathname.startsWith("/work") ? "page" : undefined}><span>{link.label}</span></Link>)}</nav>
  </header></div><noscript><style>{".nav-shell .nav{background:var(--bg)}"}</style></noscript></>;
}
