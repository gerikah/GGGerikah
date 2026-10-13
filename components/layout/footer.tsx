import type { SiteSettings } from "@/lib/cms/types";

export function Contact({ settings }: { settings: SiteSettings }) {
  const socials = [{ label: "LinkedIn", url: settings.linkedin_url }, { label: "GitHub", url: settings.github_url }, { label: "Résumé", url: settings.resume_url }].filter(item => item.url);
  return <section id="contact" className="contact-section section-wrap"><div className="section-kicker"><span className="mono">04 / THE NEXT GOOD THING</span><span className="mono">LET’S TALK ↙</span></div>
    <p className="contact-question">Have an idea, a problem, or a screen<br className="desktop-break" /> that needs better thinking?</p>
    <h2 className="contact-title">Let’s make<br /><span>it happen.</span><span className="contact-arrow" aria-hidden="true">↗</span></h2>
    <div className="contact-bottom">{settings.email ? <a className="email-link" href={`mailto:${settings.email}`}>{settings.email}<span aria-hidden="true">↗</span></a> : <p className="mono">Contact details coming soon.</p>}<div className="social-links">{socials.map(item => <a href={item.url} key={item.label} target="_blank" rel="noopener noreferrer">{item.label} ↗</a>)}</div></div>
    {settings.availability_text && <p className="availability mono"><span className="status-dot" />{settings.availability_text}</p>}
  </section>;
}

export function Footer({ settings }: { settings: SiteSettings }) {
  return <footer className="site-footer section-wrap"><div><span className="footer-name">{settings.name}</span><p className="mono">{settings.role}</p></div><p className="footer-copy mono">© {new Date().getFullYear()} {settings.footer_copy}</p><a className="back-top mono" href="#top">BACK TO TOP ↑</a></footer>;
}
