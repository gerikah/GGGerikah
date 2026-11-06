"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { portfolio as c } from '@frontend/content/portfolio';
export function Header() {
    const pathname = usePathname();
    const home = pathname === "/";
    const sentinel = useRef<HTMLDivElement>(null);
    const [scrolled, setScrolled] = useState(false);
    const [active, setActive] = useState('');
    useEffect(() => {
        if (!home)
            return;
        let frame = 0;
        const update = () => {
            frame = 0;
            let next = '';
            for (const [id, key] of [['about', 'about'], ['development', 'about'], ['selected-work', ''], ['process', '']]) {
                const rect = document.getElementById(id)?.getBoundingClientRect();
                if (rect && rect.top < innerHeight * .4)
                    next = key;
            }
            const contact = document.getElementById('contact')?.getBoundingClientRect();
            if (contact && contact.top < innerHeight * .7)
                next = 'contact';
            setActive(next);
        };
        const queue = () => { if (!frame)
            frame = requestAnimationFrame(update); };
        queue();
        window.addEventListener('scroll', queue, { passive: true });
        window.addEventListener('resize', queue);
        return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', queue); window.removeEventListener('resize', queue); };
    }, [home]);
    useEffect(() => {
        const target = sentinel.current;
        if (!target)
            return;
        const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
        observer.observe(target);
        return () => observer.disconnect();
    }, []);
    const links = [
        { label: c.nav.about, href: home ? "#about" : "/#about", target: "about" },
        { label: c.nav.work, href: "/work", target: "work" },
        { label: c.nav.contact, href: home ? "#contact" : "/#contact", target: "contact" },
    ];
    return <><div className="nav-trigger" ref={sentinel} aria-hidden="true"/><div className="nav-shell" data-home={home ? "true" : undefined} data-scrolled={scrolled}><header className="nav" data-scrolled={scrolled}>
    <Link className="nav__brand" href="/" aria-label={c.nav.home} data-nav-target="top"><Image src="/images/brand/logo.svg" alt="Gerikah Alday logo" width={40} height={40} sizes="40px" className="nav__logo"/></Link>
    <nav className="nav__links" aria-label={c.nav.label}>{links.map((link) => <Link key={link.label} href={link.href} className={"nav__link" + (link.target === "contact" ? " nav__link--contact" : "")} aria-label={link.label} data-label={link.label} data-nav-target={link.target} aria-current={!home && link.target === "work" && (pathname.startsWith("/work") || pathname.startsWith("/case-studies")) ? "page" : home && active === link.target ? "location" : undefined}><span>{link.label}</span></Link>)}</nav>
  </header></div><noscript><style>{".nav-shell .nav{background:var(--bg)}"}</style></noscript></>;
}
