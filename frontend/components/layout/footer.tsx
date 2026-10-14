import Link from "next/link";
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
  return <section className="contact" id="contact" aria-labelledby="contact-title"><div className="wrap contact__layout">
    <div><p className="meta">Get in touch</p><h2 id="contact-title">Let’s make<br />it work.</h2></div>
    <div className="contact__body"><p>Have an interface to figure out,<br />or an idea ready to build?</p>
    {settings.email && <a className="btn contact__action" href={`mailto:${settings.email}`}><span>Start a conversation</span><Envelope className="ui-icon" size={20} weight="regular" aria-hidden="true" focusable="false" /></a>}
    <div className="contact__links">
      {socials.map((item) => <a className="clink" href={item.url} key={item.label} target="_blank" rel="noopener noreferrer"><item.icon className="ui-icon" size={20} weight="regular" aria-hidden="true" focusable="false" />{item.label}</a>)}
    </div>
    {!settings.email && !socials.length && <p className="contact__availability">Contact details coming soon.</p>}
    {settings.availability_text && <p className="contact__availability">{settings.availability_text}</p>}
    </div>
  </div>
  </section>;
}

export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Manila" }).format(new Date());
  return <footer className="footer brand-footer"><div className="wrap">
    <div className="footer-archive"><p>The rest of the collection.</p><Link className="text-link" href="/work">Explore the complete archive<ArrowUpRight className="ui-icon" aria-hidden="true" focusable="false" /></Link></div>
    <div className="footer__base"><div><p className="brand-footer__name">Gerikah Alday</p><p className="footer__role">{settings.role}</p></div><span className="meta">© {year} · Manila, PH</span><Link className="meta" href="/#top" data-nav-target="top">Back to top ↑</Link></div>
  </div></footer>;
}
