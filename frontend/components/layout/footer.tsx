import type { SiteSettings } from "@api/contracts/cms";
import { externalUrl } from "@api/validation/cms";
import Link from "next/link";
import { Reveal } from "@frontend/components/motion/archive-motion";
export function Contact({ settings }: { settings: SiteSettings }) {
  const links = [{ title: "LinkedIn", url: settings.linkedin_url }, { title: "GitHub", url: settings.github_url }].filter(l => l.url && externalUrl.safeParse(l.url).success);
  return <section className="contact" id="contact" aria-labelledby="contact-title">
    <div className="wrap">
      <div className="contact-layout">
        <Reveal><h2 id="contact-title">Let’s make<br /><span>it work.</span></h2><p>Have an interface to figure out,<br />or an idea ready to build?</p></Reveal>
        <Reveal className="contact-details" delay={80}>
          {settings.availability_text && <p className="contact-availability">{settings.availability_text}</p>}
          <div className="contact-actions">{settings.email && <a className="contact-primary" href={`mailto:${settings.email}`}>Start a conversation <span aria-hidden="true">↗</span></a>}{links.map(l => <a key={l.title} href={l.url} target="_blank" rel="noopener noreferrer">{l.title}<span className="sr-only"> (opens in a new tab)</span></a>)}</div>
        </Reveal>
      </div>
      <div className="footer-bottom">
        <div className="footer-signoff"><p>{settings.name || "Gerikah Alday"}</p>{settings.footer_copy && <p>{settings.footer_copy}</p>}</div>
        <nav aria-label="Footer navigation"><Link href="/work">Work</Link><Link href="/#about">About</Link><a href="#top">Back to top <span aria-hidden="true">↑</span></a></nav>
      </div>
    </div>
  </section>;
}
export function Footer({ settings }: { settings: SiteSettings }) {
  return <footer className="editorial-footer"><div className="footer-wordmark" role="img" aria-label="Gerikah" /><Contact settings={settings} /></footer>;
}
