import type { SiteSettings } from '@api/contracts/cms';
import { externalUrl } from '@api/validation/cms';
import Link from 'next/link';
import { portfolio as c } from '@frontend/content/portfolio';
import '@frontend/styles/footer-polish.css';

export function Footer({ settings }: { settings: SiteSettings }) {
    const links = [
        { title: c.contact.linkedin, url: c.contact.overrides.linkedin || settings.linkedin_url },
        { title: c.contact.github, url: c.contact.overrides.github || settings.github_url },
    ].filter(link => link.url && externalUrl.safeParse(link.url).success);
    const resume = externalUrl.safeParse(c.contact.overrides.resume || settings.resume_url);
    const email = c.contact.overrides.email || settings.email;

    return (
        <footer className="editorial-footer">
            <section className="site-footer" id="contact" aria-labelledby="contact-title">
                <div className="site-footer__inner">
                    <div className="site-footer__main">
                        <div className="site-footer__copy">
                            <p className="site-footer__eyebrow">
                                <span aria-hidden="true" />
                                {c.contact.availability}
                            </p>
                            <h2 id="contact-title">{c.process.cta}</h2>
                            <p className="site-footer__intro">{c.contact.intro}</p>
                        </div>
                        <div className="site-footer__actions">
                            {email && (
                                <a className="site-footer__email" href={'mailto:' + email}>
                                    {c.contact.emailLabel}<span aria-hidden="true">↗</span>
                                </a>
                            )}
                            <nav className="site-footer__socials" aria-label="Social and professional links">
                                {links.map(link => (
                                    <a key={link.title} href={link.url} target="_blank" rel="noopener noreferrer">
                                        {link.title}<span aria-hidden="true">↗</span>
                                    </a>
                                ))}
                                {resume.success && resume.data && (
                                    <a href={resume.data} target="_blank" rel="noopener noreferrer">
                                        {c.contact.resume}<span aria-hidden="true">↗</span>
                                    </a>
                                )}
                            </nav>
                        </div>
                    </div>
                    <div className="site-footer__bottom">
                        <p>© {new Date().getFullYear()} {c.name}<span>{c.contact.built}</span></p>
                        <nav aria-label="Footer navigation">
                            <Link href="/work">{c.nav.work}</Link>
                            <Link href="/#about">{c.nav.about}</Link>
                            <a href="#top">{c.contact.back} ↑</a>
                        </nav>
                    </div>
                </div>
            </section>
        </footer>
    );
}
