import type { SiteSettings } from "@api/contracts/cms";
import { externalUrl } from "@api/validation/cms";
import Link from "next/link";
import { Reveal } from "@frontend/components/motion/archive-motion";
export function Contact({ settings }: { settings: SiteSettings }) {
  const links = [{ title: "LinkedIn", url: settings.linkedin_url }, { title: "GitHub", url: settings.github_url }].filter(l => l.url && externalUrl.safeParse(l.url).success);
  const resume = externalUrl.safeParse(settings.resume_url);
  return <section className="contact" id="contact" aria-labelledby="contact-title">
    <div className="wrap">
      <div className="contact-layout">
        <Reveal className="contact-intro"><h2 id="contact-title">Let’s make<br /><span>it work.</span></h2><p>Whether it’s a rough idea or a half-built product,<br className="desktop-break" /> I’d like to hear about it.</p>{settings.footer_copy && <p className="contact-summary">{settings.footer_copy}</p>}</Reveal>
        <Reveal className="contact-details" delay={80}>
          {settings.availability_text && <p className="contact-availability"><span className="contact-status" aria-hidden="true" />{settings.availability_text}</p>}
          <div className="contact-actions">{settings.email && <a className="contact-primary" href={`mailto:${settings.email}`}>Start a conversation <span aria-hidden="true">↗</span></a>}
            <div className="contact-links">{links.map(l => <a key={l.title} href={l.url} target="_blank" rel="noopener noreferrer">{l.title}<span className="sr-only"> (opens in a new tab)</span></a>)}{resume.success && resume.data && <a className="contact-resume" href={resume.data} target="_blank" rel="noopener noreferrer">View résumé <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>}</div>
          </div>
        </Reveal>
      </div>
      <div className="footer-bottom">
        <p className="footer-signoff">© {new Date().getFullYear()} {settings.name || "Gerikah Alday"}<span aria-hidden="true"> · </span>Designed in Figma, built in code.</p>
        <nav aria-label="Footer navigation"><Link href="/work">Work</Link><Link href="/#about">About</Link><a href="#top">Back to top <span aria-hidden="true">↑</span></a></nav>
      </div>
    </div>
  </section>;
}
export function Footer({ settings }: { settings: SiteSettings }) {
  return <footer className="editorial-footer"><div className="footer-wordmark" role="img" aria-label="Gerikah" /><Contact settings={settings} /></footer>;
}
