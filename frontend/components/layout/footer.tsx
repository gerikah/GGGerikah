import Link from "next/link";
import type { SiteSettings } from "@api/contracts/cms";

function publicLinks(settings: SiteSettings) {
  return [{ label: "LinkedIn", url: settings.linkedin_url, detail: "Connect on LinkedIn" }, { label: "GitHub", url: settings.github_url, detail: "Explore the code" }, { label: "Résumé", url: settings.resume_url, detail: "View the résumé" }].filter((item) => {
    if (!item.url) return false;
    try { const url = new URL(item.url); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password; }
    catch { return false; }
  });
}

export function Contact({ settings }: { settings: SiteSettings }) {
  const socials = publicLinks(settings);
  return <section className="section contact" id="contact" aria-labelledby="contact-title"><div className="wrap">
    <p className="eyebrow contact__eyebrow">05 / Contact</p>
    <h2 className="contact__head" id="contact-title">Have an idea, a problem, or a screen that needs <em>better thinking?</em></h2>
    <div className="contact__links">
      {settings.email && <a className="clink clink--conversation" href={`mailto:${settings.email}`}><span>Start a conversation<small>Let’s talk about your next idea</small></span><span className="arrow" aria-hidden="true">↗</span></a>}
      {socials.map((item) => <a className="clink" href={item.url} key={item.label} target="_blank" rel="noopener noreferrer"><span>{item.label}<small>{item.detail}</small></span><span className="arrow" aria-hidden="true">↗</span></a>)}
    </div>
    {!settings.email && !socials.length && <p className="contact__availability eyebrow">Contact details coming soon.</p>}
    {settings.availability_text && <p className="contact__availability eyebrow">{settings.availability_text}</p>}
  </div>
  </section>;
}

export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Manila" }).format(new Date());
  const socials = publicLinks(settings);
  return <footer className="footer brand-footer"><div className="wrap">
    <div className="brand-footer__masthead"><p className="eyebrow">Design / Development</p></div>
    <p className="footer__brand brand-footer__name">Gerikah</p>
    <div className="brand-footer__details"><div><p className="footer__role">{settings.role}</p>{settings.footer_copy && <p className="footer__note">{settings.footer_copy}</p>}</div>
      <a className="brand-footer__cta" href={settings.email ? `mailto:${settings.email}` : "/#contact"}><span>Have something in mind?<strong>Start a conversation.</strong></span><span aria-hidden="true">↗</span></a>
    </div>
    <div className="brand-footer__links"><nav aria-label="Footer navigation"><Link href="/work">Work</Link><Link href="/#about" data-nav-target="about">About</Link><Link href="/#process" data-nav-target="process">Process</Link><Link href="/#contact" data-nav-target="contact">Contact</Link></nav><nav aria-label="Social profiles">{socials.map((item) => <a href={item.url} key={item.label} target="_blank" rel="noopener noreferrer">{item.label} <span aria-hidden="true">↗</span></a>)}</nav></div>
    <div className="footer__base"><span className="mono">© {year} Gerikah</span><span className="mono">Manila, Philippines</span><Link className="brand-footer__top mono" href="/#top" data-nav-target="top">Back to top <span aria-hidden="true">↑</span></Link></div>
  </div></footer>;
}
