import { portfolio } from '@frontend/content/portfolio';
import { NoirHeroAnimation } from '@frontend/components/home/noir-hero-animation';
import '@frontend/styles/landing-hero.css';

/** Noir-inspired technical introduction, using the portfolio's own identity and content. */
export function LandingHero() {
  const [firstName, ...surname] = portfolio.name.split(' ');
  return (
    <section className="landing-hero" aria-labelledby="landing-title">
      <NoirHeroAnimation />
      <div className="landing-hero__meta" aria-label="Profile summary">
        <p><span>Based in</span>{portfolio.about.based}</p>
        <p><span>Discipline</span>Computer Engineering</p>
        <p><span>Focus</span>{portfolio.about.role}</p>
        <p><span>Availability</span>Freelance projects</p>
      </div>
      <div className="landing-hero__main">
        <div className="landing-hero__identity">
          <h1 id="landing-title" className="landing-hero__name" aria-label={portfolio.name}><span aria-hidden="true" data-noir-scramble>{firstName}</span><span aria-hidden="true"><span data-noir-scramble>{surname.join(' ')}</span><em>.</em></span></h1>
          <p className="landing-hero__statement">{portfolio.hero.subhead}</p>
          <a className="landing-hero__action" href="#selected-work">View selected work <span aria-hidden="true">↘</span></a>
        </div>
        <aside className="landing-hero__terminal" aria-label="Portfolio status">
          <div className="terminal-bar"><span aria-hidden="true"><i/><i/><i/></span><span>gerikah@portfolio:~</span><span>TTY / 01</span></div>
          <div className="terminal-body" aria-live="off">
            <p className="terminal-line"><b>[ ok ]</b> mounting /portfolio</p>
            <p className="terminal-line"><b>[ ok ]</b> loading selected work</p>
            <p className="terminal-line"><b>[ ok ]</b> establishing secure line</p>
            <p className="terminal-line terminal-line--ready">Gerikah Alday — UI/UX + frontend<span className="terminal-caret" aria-hidden="true"/></p>
            <a href="#about">Read profile <span aria-hidden="true">↘</span></a>
          </div>
        </aside>
      </div>
      <div className="landing-hero__foot">
        <span>{portfolio.hero.status}</span>
        <a href="#flow-journey">Open the flow <span aria-hidden="true">↓</span></a>
        <span>Portfolio · 2026</span>
      </div>
    </section>
  );
}
