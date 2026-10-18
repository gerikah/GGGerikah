"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ProjectMedia } from "@api/contracts/cms";
export function VisualBoard({ media, layout }: { media: ProjectMedia[]; layout: "landscape" | "mixed" }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const opened = useRef(false);
  const previousOverflow = useRef("");
  const [active, setActive] = useState(0);
  const images = media.filter(m => m.url && m.slot !== null).sort((a,b) => a.slot! - b.slot!);
  useEffect(() => () => { if (opened.current) document.documentElement.style.overflow = previousOverflow.current; }, []);
  function close() { dialog.current?.close(); document.documentElement.style.overflow = previousOverflow.current; opened.current = false; trigger.current?.focus(); }
  return <><div className={`visual-board visual-board--${layout}`}>{images.map((m, i) => <figure key={m.id} className={layout === "mixed" && m.slot! < 3 ? "is-portrait" : "is-landscape"}><button className="visual-image" aria-label={`Open fullscreen: ${m.alt_text}`} onClick={e => { trigger.current = e.currentTarget; setActive(i); previousOverflow.current = document.documentElement.style.overflow; opened.current = true; dialog.current?.showModal(); document.documentElement.style.overflow = "hidden"; }}><Image src={m.url!} alt={m.alt_text} fill sizes={layout === "mixed" && m.slot! < 3 ? "(max-width: 600px) 88vw, 27vw" : "(max-width: 600px) 88vw, 40vw"} /></button>{m.caption && <figcaption>{m.caption}</figcaption>}</figure>)}</div><dialog ref={dialog} className="image-dialog" aria-label="Fullscreen image preview" onCancel={e => { e.preventDefault(); close(); }} onKeyDown={e => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); setActive((active + (e.key === "ArrowRight" ? 1 : -1) + images.length) % images.length); } }}><div className="image-dialog-toolbar"><span aria-live="polite">{active + 1} / {images.length}</span><button onClick={close} autoFocus>Close ×</button></div>{images[active] && <div className="image-dialog-image"><Image src={images[active].url!} alt={images[active].alt_text} fill sizes="95vw" unoptimized /></div>}<div className="image-dialog-toolbar"><button onClick={() => setActive((active - 1 + images.length) % images.length)}>← Previous</button><p>{images[active]?.caption}</p><button onClick={() => setActive((active + 1) % images.length)}>Next →</button></div></dialog></>;
}
