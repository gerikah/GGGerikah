# Editorial portfolio redesign

## Result

The homepage now presents Gerikah Alday as a UI/UX Designer and Frontend Developer in Manila through actual work. Black is dominant, with off-white type and grayscale project imagery. Manrope replaces the futuristic display font; IBM Plex Mono is reserved for index information and captions.

The homepage follows the requested order: hero/project index; featured Off The Rack; Marci Metzger Homes and Ground Control Station; actual design/build evidence; short About and capabilities; compact toolbox; contact; complete archive link. The other five projects remain in the compact eight-project `/work` index. All existing case-study routes, CMS records, source artwork, contact destinations, and admin routes remain.

## Audit and argument

The subject inventory came from the repository: Manila; Computer Engineering; the Off The Rack homepage wireframe and built storefront; one-of-one clothing; product browsing and custom inquiries; its Supabase-backed admin dashboard; Marci's independent real-estate concept; Ground Control's desktop/mobile views; Riftbound game UI; Task Mate's wireframes; and the other systems diagrams.

The page's claims and evidence are:

- Gerikah designs and builds: the hero shows the actual Off The Rack collection, with three project entry points.
- Early structure can become an interface: a wireframe/built toggle compares the original Off The Rack homepage artifacts.
- Different problems call for different compositions: Marci uses a large editorial crop; Ground Control pairs desktop and mobile interfaces.
- The build has substance behind the visual: inquiry planning, separate final inquiry paths, and product administration are shown directly.
- A Computer Engineer can work across the interface and its data: the short source biography follows that evidence.
- The toolbox supports the work: actual published project tools link to associated case studies.
- There is a real next step: email/social destinations and the complete project index remain available.

No clients, outcomes, metrics, technologies, years, or testimonials were added. Marci is visibly an independent redesign concept. Ground Control has no invented implementation stack or shipped-product claim.

## Art direction and interaction

The design skill dealt Contact sheet, Pinned poster, and Name as monument. The selected Contact sheet direction (seed 1168135432) was redrawn to Split stage because equal project weight contradicted the brief's clear Off The Rack priority. The brief also overrides permanent full-page pinning, decorative entrances, and the skill's ban on mono/index labels: varied project compositions and readable ordinary scrolling take priority.

On this page, Gerikah's Off The Rack wireframe and storefront become two layers of the same project record.

The live interaction is the Wireframe / Built interface toggle. It uses real images, native buttons, visible focus, `aria-pressed`, and a live caption. The fixed crop has no inner scrolling. JavaScript-disabled visitors see the built interface and the separate inquiry wireframe below.

Motion is limited to image crop/scale feedback, button feedback, and the comparison transition. Smooth anchors use the existing reduced-motion-aware CSS. Initial content is visible; navigation never waits for assets, fonts, or full-screen loading overlays. All movement stops under `prefers-reduced-motion`.

No external photographs, generated artwork, or footage were used. Every image is an existing repository asset. Static image imports supply blur placeholders and dimensions; the first hero image and featured built image are preloaded. The unused futuristic font import and homepage canvas are removed from the rendered page. No dependencies were added.

## Changed files

- `frontend/app/(site)/page.tsx`: curated homepage, real evidence, publication-aware selected projects and anchor fallback.
- `frontend/app/(site)/work/page.tsx`: compact numbered archive with direct case-study links.
- `frontend/components/home/design-proof.tsx`: layered, accessible comparison without a scroll trap.
- `frontend/components/home/tech-stack.tsx`: small project-linked toolbox derived from published CMS tools.
- `frontend/components/layout/header.tsx`, `footer.tsx`: small name/signature, plain navigation, restrained contact and archive close.
- `frontend/components/motion/archive-motion.tsx`, `case-study/preview.tsx`: ordinary navigation and visible content; obsolete loader/focus bookkeeping removed while legacy modal accessibility remains.
- `frontend/styles/taste.css`: new monochrome tokens, restrained type scale, distinct compositions, responsive layouts, preserved case-study styling.
- `frontend/app/layout.tsx`, `frontend/app/(site)/layout.tsx`: typography imports and removal of public loading-screen styling.
- `tests/browser/assets.spec.ts`, `opendesign.spec.ts`, `readiness.spec.ts`: meaningful coverage for the new experience; obsolete `mosaic-lens.spec.ts` removed.
- `README.md`, `docs/project-structure.md`, `docs/technology-logo-attribution.md`, this report: current behavior and retained artwork documented.

Original project assets, seed content, backend/database code, package dependencies, and case-study routes are retained.

## Verification

- Production build: passed using the installed Next.js package and its bundled documentation.
- ESLint and TypeScript/route generation: passed.
- Existing validation/privacy suite: 11 passed.
- Final production browser suite: 30 passed in 39.5 seconds.
- Browser checks cover 1440, 768, and 390px; eight case-study routes; responsive images; keyboard toggle and focus; natural page scrolling; anchor visibility; reduced motion; JavaScript-disabled navigation; and 404 recovery.
- Six axe scans across homepage, archive, and Off The Rack at desktop/mobile widths found zero violations.
- Final hero, homepage, archive, and section screenshots were inspected at desktop/mobile widths and saved under ignored `.local/screenshots/`.

The design skill's native CDP inspector failed with `Page.enable` timeouts. Its actual probe and judging modules were then run through installed Playwright/Edge at all three widths. With the brief's mono/index/label allowances, they reported no failures, two-line hero headings at every width, no text collisions, and no empty desktop screens. The only remaining design warning is no footage: the source provides screenshots and wireframes, and the brief asks to avoid distracting autoplay. Static taste lint also has no failures; its two index-number warnings match the requested archive.

The configured Supabase connection failed locally. Verification used the repository's existing seed fallback by passing empty Supabase variables only to child processes. Environment files and CMS configuration were not changed. No live CMS/database validation or deployment is claimed.

## Screenshot critique

ROUND 1
Seen in one second: the statement and Off The Rack interface.
Idea: the same actual project is both design material and working-product evidence.
Live thing: wireframe-to-interface toggle.
Layouts: hero=split/index; feature=layered crop; Marci=editorial image; Ground Control=system fragments; evidence=artifact run; About=short note; toolbox=small index; contact=two-part close.
Top refinements: replace the repeated hero crop with the collection; reduce small type variations; preserve a Work target when Off The Rack is unpublished.

ROUND 2
Seen in one second: a person who designs and builds, alongside a real clothing storefront.
Scores: design 8.0 · usability 8.5 · creativity 7.5 · content 8.8 → overall 8.1.
The brief supersedes the skill's caps for explicitly requested mono metadata and project numbering. The documented title/caption structure is consistent across widths. The remaining limitation is that hiring managers must open the full case studies for deeper reasoning; the homepage intentionally presents edited evidence rather than the complete studies.
