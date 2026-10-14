"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const home = pathname === "/";
  const links = [
    { label: "Work", href: home ? "#work" : "/work", target: "work" },
    { label: "About", href: home ? "#about" : "/#about", target: "about" },
    { label: "Process", href: home ? "#process" : "/#process", target: "process" },
    { label: "Contact", href: home ? "#contact" : "/#contact", target: "contact" },
  ];
  return <header className="nav">
    <Link className="nav__brand" href={home ? "#top" : "/"} aria-label="GERIKAH, return home" data-nav-target="top">
      <Image src="/images/logo-white.png" alt="GERIKAH logo" width={32} height={32} className="nav__mark nav__mark--asset brand-logo" />
    </Link>
    <nav className="nav__links" aria-label="Primary navigation">{links.map((link) => <Link key={link.label} href={link.href} className="nav__link" aria-label={link.label} data-label={link.label} data-nav-target={link.target} aria-current={link.label === "Work" && pathname.startsWith("/work") ? "page" : undefined}><span>{link.label}</span></Link>)}</nav>
  </header>;
}
