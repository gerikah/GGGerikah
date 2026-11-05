import Image from 'next/image';
import { portfolio } from '@frontend/content/portfolio';
import '@frontend/styles/landing-hero.css';

/** The opening composition follows the supplied flow landing reference. */
export function LandingHero() {
  return (
    <section className="landing-hero" aria-labelledby="landing-title">
      <svg className="landing-hero__lanyard landing-hero__lanyard--back" viewBox="0 0 420 1000" preserveAspectRatio="none" aria-hidden="true">
        <path d="M112 -10 C90 180 86 390 105 600 L151 600 C132 370 141 170 151 -10 Z" />
      </svg>
      <h1 id="landing-title" className="landing-hero__name">{portfolio.landing.title}</h1>
      <svg className="landing-hero__lanyard landing-hero__lanyard--front" viewBox="0 0 420 1000" preserveAspectRatio="none" aria-hidden="true">
        <path d="M179 -10 C210 220 167 365 135 588 L177 588 C214 370 245 210 220 -10 Z" />
      </svg>
      <figure className="landing-hero__portrait">
        <Image src={portfolio.about.photo.src} alt={portfolio.about.photo.alt} fill loading="eager" fetchPriority="high" sizes="(max-width: 600px) 43vw, (max-width: 1099px) 28vw, 18vw" />
      </figure>
      <a className="landing-hero__scroll" href="#flow-journey" aria-label={portfolio.landing.scroll}>
        <svg viewBox="0 0 24 50" fill="none" aria-hidden="true"><path d="M12 3v40l8-13" /></svg>
      </a>
    </section>
  );
}
