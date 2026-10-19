"use client";
import { useEffect, useRef, useState } from "react";
import type { ProjectMedia } from "@api/contracts/cms";
import { MediaFrame, OriginalMedia } from "@frontend/components/media/media-frame";
import { galleryVariant, MEDIA_SIZES } from "@frontend/components/media/media-spec";

export function VisualBoard({ media, layout }: { media: ProjectMedia[]; layout: "landscape" | "mixed" }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const isOpen = active !== null;
  const images = media.filter(m => m.storage_path && m.slot !== null).sort((a, b) => a.slot! - b.slot!);
  const groups: { variant: "portrait" | "landscape"; items: { media: ProjectMedia; index: number }[] }[] = [];
  images.forEach((item, index) => {
    const variant = galleryVariant(layout, item.slot!);
    if (groups.at(-1)?.variant !== variant) groups.push({ variant, items: [] });
    groups.at(-1)!.items.push({ media: item, index });
  });
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => { document.documentElement.style.overflow = previousOverflow; };
  }, [isOpen]);

  function close() { dialog.current?.close(); setActive(null); trigger.current?.focus(); }
  function move(direction: number) { setActive(value => value === null ? null : (value + direction + images.length) % images.length); }

  return <><div className={`visual-board visual-board--${layout}`}>
    {groups.map((group, groupIndex) => <div key={groupIndex} className={`visual-group visual-group--${group.variant}`}>
      {group.items.map(({ media: item, index }) => <figure key={item.id} className={`is-${group.variant}`}>
        <button className="visual-image" aria-label={`Open fullscreen: ${item.alt_text}`} disabled={!item.url} onClick={event => { trigger.current = event.currentTarget; setActive(index); }}>
          <MediaFrame src={item.url} alt={item.alt_text} variant={group.variant} sizes={group.variant === "portrait" ? MEDIA_SIZES.portrait : group.items.length === 1 ? MEDIA_SIZES.full : MEDIA_SIZES.half}>
            <span>Image unavailable</span><small>Reload to try again.</small>
          </MediaFrame>
        </button>
        {item.caption && <figcaption>{item.caption}</figcaption>}
      </figure>)}
    </div>)}
  </div>
  <dialog ref={dialog} className="image-dialog" aria-label="Fullscreen image preview" onCancel={event => { event.preventDefault(); close(); }} onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); } }}>
    <div className="image-dialog-toolbar"><span aria-live="polite">{active === null ? 0 : active + 1} / {images.length}</span><button onClick={close} autoFocus>Close ×</button></div>
    <div className="image-dialog-image">{active !== null && images[active]?.url && <OriginalMedia src={images[active].url!} alt={images[active].alt_text} />}</div>
    <div className="image-dialog-toolbar"><button onClick={() => move(-1)} disabled={images.length < 2}>← Previous</button><p aria-live="polite">{active !== null && images[active]?.caption}</p><button onClick={() => move(1)} disabled={images.length < 2}>Next →</button></div>
  </dialog></>;
}
