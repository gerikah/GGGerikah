"use client";

import Image from "next/image";
import { useState } from "react";
import wireframe from "@frontend/public/images/off-the-rack/wireframe.png";
import storefront from "@frontend/public/images/off-the-rack/home.jpg";

export function DesignProof() {
  const [view, setView] = useState<"design" | "build">("build");
  return <div className="project-switch">
    <div className="project-switch__bar"><p className="meta">Same structure. Made real.</p><div className="project-switch__controls" role="group" aria-label="Off The Rack wireframe and built interface"><button type="button" aria-pressed={view === "design"} aria-controls="otr-comparison" onClick={() => setView("design")}>Wireframe</button><button type="button" aria-pressed={view === "build"} aria-controls="otr-comparison" onClick={() => setView("build")}>Built interface</button></div></div>
    <div id="otr-comparison" className="project-switch__stage" data-view={view}>
      <figure className="project-switch__image project-switch__image--design" aria-hidden={view !== "design"}><Image src={wireframe} alt="Original Off The Rack homepage wireframe showing the hero and collection structure" sizes="90vw" placeholder="blur" /></figure>
      <figure className="project-switch__image project-switch__image--build" aria-hidden={view !== "build"}><Image src={storefront} alt="Built Off The Rack storefront showing the hero and clothing collection" sizes="90vw" preload placeholder="blur" /></figure>
    </div>
    <p className="project-switch__caption meta" aria-live="polite">{view === "design" ? "01a / The original homepage wireframe" : "01b / The finished storefront interface"}</p>
    <noscript><style>{".project-switch__controls{display:none}.project-switch__image--design{display:none}.project-switch__image--build{opacity:1}"}</style></noscript>
  </div>;
}
