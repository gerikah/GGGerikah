import type { SiteSettings } from "@api/contracts/cms";
import { externalUrl } from "@api/validation/cms";
export function Contact({ settings }: { settings: SiteSettings }) {
  const links = [{ title: "LinkedIn", url: settings.linkedin_url }, { title: "GitHub", url: settings.github_url }].filter(l => l.url && externalUrl.safeParse(l.url).success);
  return <section className="contact gradient-panel" id="contact" aria-labelledby="contact-title"><div className="wrap contact-layout"><div><h2 id="contact-title">Let’s make<br /><span>it work.</span></h2><p>Have an interface to figure out, or an<br />idea ready to build?</p></div><div className="contact-actions">{settings.email && <a className="contact-primary" href={`mailto:${settings.email}`}>Start a conversation</a>}{links.map(l => <a key={l.title} href={l.url} target="_blank" rel="noopener noreferrer">{l.title}</a>)}</div></div></section>;
}
export function Footer({ settings }: { settings: SiteSettings }) {
  return <footer className="editorial-footer"><div className="wrap footer-wordmark" aria-hidden="true">GERIKAH</div><Contact settings={settings} /></footer>;
}
