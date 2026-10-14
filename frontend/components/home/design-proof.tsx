"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon as ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { useEffect, useState } from "react";
import { Reveal } from "@frontend/components/motion/archive-motion";

export function DesignProof() {
  const [view, setView] = useState<"design" | "build">("build");
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => { const frame = requestAnimationFrame(() => setEnhanced(true)); return () => cancelAnimationFrame(frame); }, []);
  return <section className="design-proof" aria-labelledby="proof-title">
    <div className="design-proof__copy"><Reveal><h2 id="proof-title">Same idea.<br />Made real.</h2></Reveal><Reveal delay={0.08}><p>Off The Rack, from the first homepage wireframe to the finished storefront.</p></Reveal><Link href="/work/off-the-rack">See the project<ArrowUpRight className="ui-icon" size={20} weight="regular" aria-hidden="true" focusable="false" /></Link></div>
    <div className="design-proof__stage">
      <div className="design-proof__controls" role="group" aria-label="Off The Rack design and build comparison"><button type="button" aria-pressed={view === "design"} onClick={() => setView("design")}>The design</button><button type="button" aria-pressed={view === "build"} onClick={() => setView("build")}>The build</button></div>
      <div className="design-proof__images" data-view={view}>
        <figure className="design-proof__image design-proof__image--design" aria-hidden={enhanced && view !== "design"} tabIndex={enhanced && view === "design" ? 0 : undefined}><Image src="/images/off-the-rack/wireframe.png" alt="Original Off The Rack homepage wireframe" width={1440} height={3822} sizes="(max-width: 720px) 92vw, 56vw" /><figcaption>Homepage wireframe</figcaption></figure>
        <figure className="design-proof__image design-proof__image--build" aria-hidden={enhanced && view !== "build"} tabIndex={enhanced && view === "build" ? 0 : undefined}><Image src="/images/off-the-rack/home.jpg" alt="Finished Off The Rack storefront homepage" width={1348} height={4351} sizes="(max-width: 720px) 92vw, 56vw" /><figcaption>Finished storefront</figcaption></figure>
      </div>
      <p className="design-proof__caption" aria-live="polite">{view === "design" ? "The original homepage wireframe" : "The finished storefront interface"}</p>
      <noscript><style>{".design-proof__controls,.design-proof__caption{display:none!important}.design-proof__image{position:relative!important;opacity:1!important;overflow:visible!important}.design-proof__images{height:auto!important;overflow:visible!important}.design-proof__image img{max-height:440px;object-fit:cover;object-position:top}"}</style></noscript>
    </div>
  </section>;
}
