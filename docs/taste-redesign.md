# Portfolio taste redesign

## Latest charcoal reference update

The latest supplied references replace the navy palette with **Royal Charcoal**: `#1e2023`, `#47484c`, `#4c4e51`, and `#1e1f22`. Public fields use soft diagonal graphite gradients based on those stops, with light ink `#f1f2f4` and readable secondary ink `#c6c8cd`. Comparison, About, process, and contact have distinct tonal treatments; project images sit on charcoal frames. The Mosaic Lens hero uses charcoal/silver uniforms while preserving the original shader programs, pause control, reduced-motion behavior, and GPU limits. Loading and 404 share the charcoal theme.

Wide, light [Michroma](https://fonts.google.com/specimen/Michroma) 400 replaces the condensed public display face; [Manrope](https://fonts.google.com/specimen/Manrope) 400/500 handles body text, project names, and controls. Minimal Latin font files are served locally through Fontsource. Both fonts use the SIL Open Font License 1.1 included in their packages. The previous Barlow packages were removed; CMS typography remains separate. The hero now gives the complete wordmark the page width, and heading sizes/line heights are recalculated for the wider letterforms. Phosphor UI icons and all ten real technology logos from the preceding update remain.

The attached images are visual references for palette, gradients, and typography. Their dummy statistics, chrome object, and reference text are not portfolio content or assets. All real project imagery and the About portrait remain. No new direction was drawn: the existing Pinned poster composition is adapted to the supplied type/palette. The user explicitly requested gradients, so only the skill's `gradient` rule is allowed for these background fields; there are no gradients on text or controls. This supersedes the earlier navy exception.

Validation: lint, TypeScript, all 11 Node validation/privacy checks, and the production build pass. All 35 production browser scenarios pass, including all nine widths and text-range checks that detect clipped hero/footer lettering. All six additional case scenarios were rechecked with a new two-line heading assertion after compacting long names on phones. Contact and preview spacing also receive a phone-specific scale for the wider type. Public contrast/semantics, normal/reduced motion, SVG logo decoding, image reveals, comparison/preview/navigation, tab gates, 404 recovery, and no-JavaScript content are covered. Local credentials remain ignored and the staged privacy check passes; no authenticated CMS changes were made or tested.

The final production inspection at 1440/768/390px reports zero failures and only the existing defended no-footage note. The supplied shader provides motion; there is no relevant video asset. It uses the same skill probe/rules through the documented Edge transport adapter. Screenshots are in `.taste-skill/charcoal-final/`, with settled additional reviews under `.local/charcoal-reference-qa/`. The original project image assets and SVG geometry remain intact. Only background gradients are allowed; the source gate has zero failures/warnings.

The final mobile contact bounds, homepage accessibility, and longest case-page/preview scenario all pass again after the responsive fixes. Manual 360/390/768/1440 reviews confirm the archive, contact, 404, and longest title fit; contact and long project headings stay within two lines. `npm run dev -- --webpack --hostname 127.0.0.1` is left running at `http://127.0.0.1:3000`.

Files for this reference/icon update: public home/case routes; root font imports; home tech-stack/Mosaic/comparison, project-card, case preview/gallery, footer and 404 components; `frontend/styles/taste.css`, `brand.css`, `loading-screen.css`; Fontsource/Phosphor dependencies; the ten `frontend/public/images/tech/*.svg` marks; browser geometry/logo/title checks; README and this report. Logo sources and the retained MIT license are in `docs/technology-logo-attribution.md` and `docs/licenses/devicon.txt`. No required portfolio or tool logo asset is missing.

```
CHARCOAL REFERENCE ROUND
Seen in one second: GERIKAH, wide and light against a graphite motion field.
Idea: The original Off The Rack wireframe and finished interface prove the design/build claim in one switchable frame.
Live thing: The design / The build comparison, using real scrollable screens.
Layouts: hero=wide wordmark / proof=pinned comparison / work=plates / about=portrait drop cap / stack=logo list / process=pinned interface / contact=statement / footer=wordmark
Scores: design 8 · usability 8.5 · creativity 7 · content 8.5 → overall 8.0
Caps: none after the responsive title correction; creativity stays at 7 because comparison is a known approach made specific through real work.
Three fixes: condensed heavy type became Michroma 400; the widened hero received the full page measure; long case names and the contact icon received mobile scales to avoid excess lines and clipping.
Limits: dense diagrams need their full-image links; eight projects make a long archive; the supplied shader carries movement in place of a video clip.
```

## Earlier navy palette and icon update

The supplied five-swatch navy/slate palette now replaces public monochrome grounds while keeping the Pinned poster composition, Barlow typography, real project imagery, and Mosaic Lens hero. Interpreted swatch values: slate `#3b3f66`, light slate `#5d5f8a`, midnight `#141735`, blue navy `#22274c`, and near-black navy `#111224`. Near-black is the main canvas; blue navy holds the comparison/About and image frames; midnight supports stack/process; light slate fills contact; the darker slate supplies hover feedback. Light ink `#f2f1f8` and secondary ink `#c3c6db` preserve readable contrast. Loader, case preview, and 404 use the same theme. Mosaic Lens keeps its original equations and motion behavior, with navy/slate color uniforms.

[Phosphor React](https://github.com/phosphor-icons/react) supplies regular SVG action/social icons via individual SSR or CSR imports: arrows, envelope, GitHub, LinkedIn, close, play, and pause. These imports avoid loading the package's complete icon catalog. Icons are decorative, unfocusable, and accompanied by the existing visible text. The package is MIT licensed.

Ten locally hosted genuine [Devicon brand marks](technology-logo-attribution.md) identify the nine existing CMS tool labels, including separate Node.js/npm logos. Brand geometry is unchanged and displayed in light monochrome through CSS. Unknown CMS tools retain a text-only fallback. Full source links and the upstream license are included in the attribution document. Project tools, association counts, and portfolio content are unchanged.

No new direction was drawn for this palette/component update. The user-selected indigo palette is an explicit brand exception to the skill's palette restriction, so only `palette-purple` is allowed in the visual inspector. The existing supplied shader remains an explicit effect exception. No external stock photographs, invented tool claims, placeholder logos, or missing image assets were added. The records below describe the earlier monochrome/hero redesign and its checks.

Palette validation: lint and TypeScript pass; all 11 Node checks pass. All 35 browser scenarios are verified: the full run passed 34, and the updated toolkit scenario then passed after its test was corrected to scroll lazy-loaded logos into view. This covers nine responsive widths, actual logo decoding, WCAG contrast/semantics, navigation/preview/404 behavior, no-JavaScript content, and native GPU pause/reduced-motion/failure behavior. All three original shader source blocks still match the supplied component. The local environment remains Git-ignored, and the staged privacy check passes.

Latest hero update: the supplied **Mosaic Lens — Originkit** shader replaces the hero portrait. The About portrait remains. The three shader programs retain their original equations; the wrapper now fits the hero at every width, uses monochrome colors, caps pixels/DPR and rendering at 30fps, and pauses offscreen or in a hidden tab. A visible control pauses/resumes motion. Reduced motion paints a static frame. Unsupported or lost WebGL leaves a clean black fallback. The logo gate waits for the shader's first frame or settled fallback before exposing the page. The original taste audit below records the preceding portrait-led version.

Mosaic validation: all **35 browser checks pass**, including native GPU draw/RAF measurements for pause, hidden/offscreen behavior, live reduced-motion changes and forced WebGL failure. The nine viewport checks confirm no hero image and retain the real About portrait. Lint, TypeScript, production build and all 11 Node checks pass. The updated hero passes the taste inspector at 1440/768/390px with no failures; the no-footage note remains because the supplied shader provides motion. Screenshots in `.taste-skill/mosaic-final/` were visually reviewed: the whole GERIKAH wordmark and primary action remain clear, with the shader filling the former empty field. No new direction was drawn for this single-section update, and the supplied effect is an explicit user-requested exception to the skill's usual decorative-effect rule.

Direction: **Pinned poster**, seed **611217968**. The public site keeps the black monochrome identity, real GERIKAH wordmark, actual G logo in navigation/loading/404, eight projects, and the existing CMS. Barlow Condensed handles display type; Barlow handles narrative and controls. Fontsource packages serve both locally. CMS forms retain their independent typography and styles.

On this page, Gerikah’s “I design it. Then I build it.” becomes a held project frame that can move from her original wireframe to the finished interface. The live interaction switches Off The Rack’s original homepage wireframe and finished storefront. The image pane scrolls, with keyboard access, and a normal link opens the full case study. Without JavaScript, both images and their captions appear.

The original design export was read at `frontend/design/opendesign/`: `DESIGN-HANDOFF.md`, `DESIGN-MANIFEST.json`, and the self-contained `index.html` including its inline styles, scripts and SVG. It is preserved as the preceding design reference. The latest request explicitly authorizes a new taste direction, so its tape, grid, numbered labels and ticker are replaced with the new composition.

## Composition decisions

The hero keeps the single GERIKAH identity whole instead of splitting the first name. A portrait occupies the opposite field. The first dealt split-name composition was adapted for this identity constraint; a random room-card redraw required a nonexistent room photograph and was rejected. The multi-person About blueprint was redrawn to a portrait drop cap because this portfolio represents one person. Photographic production stages were redrawn to a pinned interface fragment because the actual evidence is screen design. Contact uses the requested clickable phrase instead of the email address. The work plates show two featured projects at full width, then a compact paired archive containing the other six. Phones receive a single column and rebalanced hero.

Homepage order: introduction, design/build comparison, work, About, tech stack, process, contact, footer. The tech stack remains immediately after About and derives each tool and associated project count from published CMS records. Unknown dates, roles, tools, résumé, availability and project links remain blank. Marci retains the independent-concept disclosure. No proof, client names, stock pictures, sample copy or new images were invented.

## Asset mapping

| Section | Real repository assets, served under `/images/` |
| --- | --- |
| Hero | Supplied Mosaic Lens shader in `frontend/components/home/mosaic-lens.tsx` |
| About | `portrait.png` |
| Navigation, loader, 404 | `logo-white.png`; footer has no G image, as requested |
| Design/build comparison | `off-the-rack/wireframe.png`, `off-the-rack/home.jpg` |
| Work | `off-the-rack/hero.png`, `marci/hero.png`, `ground-control-station/hero.png`, `riftbound/hero.png`, `task-mate/wireframe.jpg`, `study-buddies/flowchart.jpg`, `dropsafe/flowchart.jpg`, `e-registered-messaging-system/use-cases.jpg` |
| Process | `off-the-rack/inquiry-wireframe.png`, `off-the-rack/inquiry.jpg` |
| Case studies | Existing project hero/gallery files; all 30 served images remain mapped to their original supplied files |

Originals remain under `frontend/design/assets/`; image hashes were checked against them. Dense diagrams use containment and full-image links, rather than aggressive crops. No required image is missing. No actual video clip was supplied, so the motion layer uses the real portrait and interface reveals instead of unrelated footage. This is the remaining defended taste-inspector warning.

## Behavior and files

The existing logo gate still covers initial loads, route/anchor changes, previews, history changes and visible-tab returns. It waits for committed route/query state, fonts and required image decoding; cancellation, error recovery and reduced motion remain. The custom cursor is removed. Preview close now waits for the gate to release inert and for its exit animation before returning focus. Full-case navigation cancels restoration.

Public `loading.tsx` was removed because its automatic Suspense fallback stranded streamed content when JavaScript was disabled. The existing `ArchiveMotion` gate supplies loading behavior. Home/archive resolve their posters before returning the page, so their content and links also render without JavaScript.

Changed areas: public homepage/layout/error/404/archive/case routes; root font imports; public project, comparison, toolkit, footer, 404 and motion components; new `frontend/styles/taste.css`; slimmed shared reset; independent 404/loading styles; font dependencies; browser checks and documentation. Backend/API/database/CMS forms and local credentials were not edited.

## Verification and visual critique

The source gate and desktop/tablet/mobile inspection run through the skill’s unchanged probe/rules. Its bundled CDP transport timed out at `Page.enable`, so the same inspector uses a local Edge Playwright transport adapter. It records actual motion and screenshots, rather than bypassing measurements. Generated directions, screenshots and local reports are ignored by Git in `.taste-skill/` and `.local/`.

Source gate: **0 failures, 0 warnings**. Rendered home, archive and Off The Rack case each pass at **1440, 768 and 390px**, with **0 failures** and only the defended no-footage warning. Headings fit within two lines; the case intro is an ordinary three-line paragraph. The homepage has 15 real images and 51–54 distinct moving elements in the final measured pass. The archive has 18; the case has 16. No external photographs, clips or code-drawn substitute images were used, so there are no new licence/credit lines or sample assets to replace.

Lint, TypeScript, production build, all 11 Node validation/privacy checks, and staged-file privacy checks pass. All 32 browser checks have been verified: the final suite passed 31, with 404-to-home navigation exceeding its five-second assertion; the isolated 404 rerun then passed in 3.2 seconds. Browser validation covers nine widths (360, 390, 430, 600, 820, 1024, 1366, 1440, 1920), normal/reduced motion, actual image loading, design/build switching, preview focus and full-case navigation, query/history/tab gates, six additional case routes, 404 recovery, and Axe WCAG checks on the visible homepage. The no-JavaScript checks pass at 360/1440. Login fields and unauthenticated `/admin` redirect also pass at both widths. Live authenticated CMS mutations were not exercised during this UI redesign.

The original dev-server run stalled while validation and production compilation ran together; reliable final browser checks use the production build. The implementation does not suppress live database failures or substitute seed content for a configured CMS.

```
ROUND 3
Seen in one second: GERIKAH, with a real portrait and a clear design/build role.
Idea (one sentence): Her original Off The Rack wireframe and finished interface share a held project frame, making the design/build claim inspectable.
Live thing: The design / The build switch, with real scrollable screenshots and a normal case link.
Layout words by section: hero=split / proof=pinned frame / work=plates / about=drop cap / stack=list / process=pinned story / contact=statement / footer=wordmark
Scores: design 8 · usability 8.3 · creativity 7 · content 8.5 → overall 7.9
Caps applied: none; creativity stays at 7 because comparison is a known approach, made specific through this person's real work.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. Round-2 phone type had too many sizes (mobile-page-02); unified it to five roles.
2. Round-2 tablet comparison paragraph wrapped to four large lines (tablet-page-01); moved it to body type.
3. Round-1 title/tagline competed and the tagline wrapped to three lines (desktop-fold); restored name dominance and authored the two tagline lines.
```

Remaining limits: dense diagram covers are previews; full sheets open from the case galleries. The page contains eight projects and therefore has a substantial scroll length. No genuine motion clip was available, so the real portrait drift and interface reveals carry the motion. The visual score is an internal design critique, not an external award or certification.

## Changed files

- `frontend/app/(site)/page.tsx`, `layout.tsx`, `error.tsx`, `work/page.tsx`, `work/[slug]/page.tsx`; removed `(site)/loading.tsx`.
- `frontend/app/layout.tsx`, `frontend/app/not-found.tsx`.
- `frontend/components/home/design-proof.tsx`, `frontend/components/home/tech-stack.tsx`.
- `frontend/components/home/mosaic-lens.tsx` and `tests/browser/mosaic-lens.spec.ts` for the subsequent hero update.
- `frontend/components/work/project-card.tsx`.
- `frontend/components/case-study/preview.tsx`, `frontend/components/case-study/sections.tsx`.
- `frontend/components/layout/footer.tsx`, `frontend/components/layout/not-found-view.tsx`.
- `frontend/components/motion/archive-motion.tsx`.
- `frontend/styles/taste.css`, `frontend/styles/globals.css`, `frontend/styles/brand.css`, `frontend/styles/loading-screen.css`.
- `tests/browser/opendesign.spec.ts`, `tests/browser/assets.spec.ts`, `tests/browser/readiness.spec.ts`.
- `.gitignore`, `package.json`, `package-lock.json`, `README.md`, `docs/project-structure.md`, `docs/opendesign-adaptation.md`, and this report.
