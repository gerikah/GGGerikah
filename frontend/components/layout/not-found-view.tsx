import Image from "next/image";
import Link from "next/link";

export function NotFoundView({ standalone = false }: { standalone?: boolean }) {
  return <main id="main-content" data-page-ready="not-found" className={`not-found-view${standalone ? " not-found-standalone" : ""}`}>
    <div className="not-found__inner">
      <div className="not-found__top"><Link className="not-found__brand" href="/" aria-label="GERIKAH, return home"><Image src="/images/logo-white.png" alt="GERIKAH logo" width={40} height={40} /><span>Gerikah</span></Link><span className="not-found__index">404 / OFF THE GRID</span></div>
      <div className="not-found__body"><h1 className="not-found__code"><span className="sr-only">Page not found. Error </span>404<span aria-hidden="true" className="not-found__asterisk">↗</span></h1><div className="not-found__message"><p className="not-found__eyebrow">NOTHING FILED HERE</p><h2>Not in this archive.</h2><p>The page you’re looking for may have moved or hasn’t been published. Let’s get you back to the work.</p><div className="not-found__actions"><Link href="/" className="not-found__button">Return home <span aria-hidden="true">↗</span></Link><Link href="/work" className="not-found__button not-found__button--line">Explore the work <span aria-hidden="true">→</span></Link></div></div></div>
      <div className="not-found__base"><span>GERIKAH / DESIGN & DEVELOPMENT</span><span>MANILA, PHILIPPINES</span></div>
    </div>
  </main>;
}
