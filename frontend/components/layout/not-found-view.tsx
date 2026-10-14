import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon as ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { ArrowUpRightIcon as ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";

export function NotFoundView({ standalone = false }: { standalone?: boolean }) {
  return <main id="main-content" data-page-ready="not-found" className={`not-found-view${standalone ? " not-found-standalone" : ""}`}>
    <div className="not-found__inner">
      <div className="not-found__top"><Link className="not-found__brand" href="/" aria-label="GERIKAH, return home"><Image src="/images/logo-white.png" alt="GERIKAH logo" width={48} height={48} /></Link></div>
      <div className="not-found__body"><h1 className="not-found__code"><span className="sr-only">Page not found. Error </span>404</h1><div className="not-found__message"><h2>Not in this archive.</h2><p>The page you’re looking for may have moved or hasn’t been published. Let’s get you back to the work.</p><div className="not-found__actions"><Link href="/" className="not-found__button"><ArrowLeft className="ui-icon" size={20} weight="regular" aria-hidden="true" focusable="false" />Return home</Link><Link href="/work" className="not-found__button not-found__button--line">Explore the work<ArrowUpRight className="ui-icon" size={20} weight="regular" aria-hidden="true" focusable="false" /></Link></div></div></div>
    </div>
  </main>;
}
