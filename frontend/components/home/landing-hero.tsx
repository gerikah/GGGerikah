import Image from 'next/image';
import { portfolio } from '@frontend/content/portfolio';
import '@frontend/styles/landing-hero.css';

/** The opening composition follows the supplied flow landing reference. */
export function LandingHero() {
  const [firstName, ...surname] = portfolio.name.split(' ');
  return (
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-hero__meta" aria-label="Profile summary">
        <p><span>Based in</span>{portfolio.about.based}</p>
        <p><span>Discipline</span>Computer Engineering</p>
        <p><span>Focus</span>{portfolio.about.role}</p>
        <p><span>Availability</span>Freelance projects</p>
      </div>
      <div className="landing-hero__main">
        <div className="landing-hero__identity">
          <h1 id="landing-title" className="landing-hero__name"><span>{firstName}</span><span>{surname.join(' ')}</span></h1>
          <p className="landing-hero__statement">{portfolio.hero.subhead}</p>
          <a className="landing-hero__action" href="#selected-work">View selected work <span aria-hidden="true">↘</span></a>
        </div>
        <aside className="landing-hero__profile" aria-label="Portfolio profile">
          <figure className="landing-hero__portrait">
            <Image src={portfolio.about.photo.src} alt={portfolio.about.photo.alt} fill loading="eager" fetchPriority="high" sizes="(max-width: 700px) 44vw, 24vw" />
          </figure>
          <div className="landing-hero__profile-copy">
            <p>UI/UX + frontend</p>
            <p>Manila, Philippines</p>
            <a href="#about">Read profile <span aria-hidden="true">↘</span></a>
          </div>
        </aside>
      </div>
      <div className="landing-hero__foot">
        <span>{portfolio.hero.status}</span>
        <a href="#flow-journey">Follow the flow <span aria-hidden="true">↓</span></a>
        <span>Portfolio · 2026</span>
      </div>
    </section>
  );
}
