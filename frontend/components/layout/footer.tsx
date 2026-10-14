import Link from "next/link";
import { ArrowUpIcon as ArrowUp } from "@phosphor-icons/react/dist/ssr/ArrowUp";
import { ArrowUpRightIcon as ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { EnvelopeIcon as Envelope } from "@phosphor-icons/react/dist/ssr/Envelope";
import { GithubLogoIcon as GithubLogo } from "@phosphor-icons/react/dist/ssr/GithubLogo";
import { LinkedinLogoIcon as LinkedinLogo } from "@phosphor-icons/react/dist/ssr/LinkedinLogo";
import type { SiteSettings } from "@api/contracts/cms";

function publicLinks(settings: SiteSettings) {
  return [{ label: "LinkedIn", url: settings.linkedin_url, icon: LinkedinLogo }, { label: "GitHub", url: settings.github_url, icon: GithubLogo }, { label: "Résumé", url: settings.resume_url, icon: ArrowUpRight }].filter((item) => {
    if (!item.url) return false;
    try { const url = new URL(item.url); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password; }
    catch { return false; }
  });
}

export function Contact({ settings }: { settings: SiteSettings }) {
  const socials = publicLinks(settings);
  return <section className="section contact" id="contact" aria-labelledby="contact-title"><div className="wrap">
    <p className="contact__intro">Have an idea in mind? Let’s make it work.</p>
    <h2 className="contact__head" id="contact-title">{settings.email ? <a className="contact__action" href={`mailto:${settings.email}`}><span>Start a conversation</span><Envelope className="ui-icon contact__action-icon" size={20} weight="regular" aria-hidden="true" focusable="false" /></a> : "Start a conversation"}</h2>
    <div className="contact__links">
      {socials.map((item) => <a className="clink" href={item.url} key={item.label} target="_blank" rel="noopener noreferrer"><item.icon className="ui-icon" size={20} weight="regular" aria-hidden="true" focusable="false" />{item.label}</a>)}
    </div>
    {!settings.email && !socials.length && <p className="contact__availability">Contact details coming soon.</p>}
    {settings.availability_text && <p className="contact__availability">{settings.availability_text}</p>}
  </div>
  </section>;
}

export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Manila" }).format(new Date());
  const socials = publicLinks(settings);
  return <footer className="footer brand-footer"><div className="wrap">
    <p className="footer__brand brand-footer__name">Gerikah</p>
    <div className="brand-footer__details"><div><p className="footer__role">{settings.role}</p>{settings.footer_copy && <p className="footer__note">{settings.footer_copy}</p>}</div>
      <div className="brand-footer__links"><nav aria-label="Footer navigation"><Link href="/work">Work</Link><Link href="/#about" data-nav-target="about">About</Link><Link href="/#process" data-nav-target="process">Process</Link><Link href="/#contact" data-nav-target="contact">Contact</Link></nav>{socials.length > 0 && <nav aria-label="Social profiles">{socials.map((item) => <a href={item.url} key={item.label} target="_blank" rel="noopener noreferrer"><item.icon className="ui-icon" size={20} weight="regular" aria-hidden="true" focusable="false" />{item.label}</a>)}</nav>}</div>
    </div>
    <div className="footer__base"><span>© {year} Gerikah</span><span>Manila, Philippines</span><Link className="brand-footer__top" href="/#top" data-nav-target="top">Back to top<ArrowUp className="ui-icon" size={20} weight="regular" aria-hidden="true" focusable="false" /></Link></div>
  </div></footer>;
}
