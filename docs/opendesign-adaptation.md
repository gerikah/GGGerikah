# OpenDesign adoption

This report records the original OpenDesign implementation. The later user-requested taste redesign supersedes its public layout and typography; see [taste-redesign.md](taste-redesign.md). The handoff and extracted CSS remain preserved for reference, and the public routes now import `frontend/styles/taste.css`.

Visual source: `frontend/design/opendesign/`.

Read before implementation: `DESIGN-HANDOFF.md`, `DESIGN-MANIFEST.json`, and the complete `index.html`, including both inline scripts, the inline stylesheet, inline SVGs, and responsive/motion rules. The manifest and repository inventory agree: this export has one public screen and no separate CSS, JavaScript, image, or font directories. Its fonts were external Google Fonts links; equivalent Space Grotesk and IBM Plex Mono binaries now load locally through Fontsource.

## Frozen visual system

- Near-black `#080808`, charcoal `#171717`, soft white `#F2F0EA`, white `#FFFFFF`, decorative gray `#555555`; border opacity .14/.34 and muted foreground opacity .66.
- Space Grotesk display, IBM Plex Mono metadata. Hero scale `clamp(3.1rem, .4rem + 14.4vw, 15rem)`, .86 line height, -.045em tracking, weight 600. The export stacked first and last names; the public hero now shows only GERIKAH as requested.
- 1440px maximum content width, `clamp(20px, 5vw, 72px)` gutters; spacing steps 8/16/24/32/48/64/96/128px; 3px small radii, paper-label shadows, transparent outlined type.
- Floating angled labels around the hero, slide-replacing navigation text, animated outlined/filled ticker, taped/grid portrait frame, editorial project metadata beside imagery, two-by-two process grid, outlined contact phrase and bordered contact links. The exported GA mark is replaced by the supplied G logo.
- Duration tokens 160/240/380ms, reveal .7s, image mask .9s, six staggered shutter strips 26ms apart, easing `cubic-bezier(.16,1,.3,1)` and `cubic-bezier(.7,0,.84,0)`.

`scripts/adopt-opendesign.mjs` extracts the actual stylesheet with PostCSS, preserving declarations, tokens, keyframes, selector structures, and media queries. Selectors are scoped under `.od-public` so the CMS keeps its independent styling. Generated output is `frontend/styles/opendesign.css`; deliberate functional/asset/accessibility differences are isolated in `frontend/styles/opendesign-adaptations.css`.

## Structure and content

Homepage order retains the export with the requested toolkit addition: hero, ticker, about, tech stack, work, process, contact, footer. The toolkit derives its unique tools from published CMS projects. The archive now contains eight asset-backed projects. Live content is loaded from the existing CMS; export sample claims, dates, property locations/prices, resale features, example URLs, and invented outcomes are not imported. Marci remains explicitly labeled an independent redesign concept. Missing résumé/availability/project URLs remain absent until edited in the CMS. Navigation uses only the actual G logo; its visible Gerikah text is removed. The footer retains the large GERIKAH wordmark and removes its G logo. Contact and footer links say “Start a conversation” and open the supplied email address without displaying it.

| Export visual | Real repository asset | Application path |
| --- | --- | --- |
| Navigation, loading screen, 404 and favicon | `frontend/design/assets/logo/LOGO W.png` | `/images/logo-white.png`; favicon embeds the same supplied PNG; footer logo removed as requested |
| Abstract portrait SVG | `frontend/design/assets/gerikah picture.png` | `/images/portrait.png` |
| Off The Rack fake storefront SVG | `frontend/design/assets/projects/02.off the rack/OFF THE RACK - hero.png` | `/images/off-the-rack/hero.png` |
| Marci fake property-listing SVG | `frontend/design/assets/projects/04.homepage redesign/REALESTATE - hero.png` | `/images/marci/hero.png` |
| Off The Rack case-study visual record | Existing homepage, shop, product, admin, and initial wireframe captures | `/images/off-the-rack/{home,shop,product,admin}.jpg`, `/images/off-the-rack/wireframe.png` |
| Off The Rack inquiry flow pair | Existing contact screenshot and `INQUIRY FORM.png` wireframe | `/images/off-the-rack/inquiry.jpg`, `/images/off-the-rack/inquiry-wireframe.png` |
| Marci case-study visual record | Existing two homepage captures | `/images/marci/{homepage,homepage-detail}.png` |
| Ground Control Station | `frontend/design/assets/projects/01.ground control station/`: original GCS presentation and selected dashboard/analytics/stream/mobile screens. Related GCS diagrams in `05.flows and wireframes/` were inspected and grouped with this project, but are not displayed. | `/images/ground-control-station/` |
| Riftbound | `frontend/design/assets/projects/03.riftbound/`: original presentation and selected home/heroes/equipment/battle captures | `/images/riftbound/` |
| Task Mate | `frontend/design/assets/projects/05.flows and wireframes/FIVERR - Task Mate Wireframe.jpg` | `/images/task-mate/` |
| Study Buddies | `frontend/design/assets/projects/05.flows and wireframes/FIVERR - Study Buddies Flowchart Project.jpg` | `/images/study-buddies/` |
| DropSafe | `frontend/design/assets/projects/05.flows and wireframes/FIVERR - DROPSAFE.jpg` | `/images/dropsafe/` |
| E-Registered Messaging System | Titled `FIVERR - 04.jpg` and selected related numbered messaging diagrams in `frontend/design/assets/projects/05.flows and wireframes/` | `/images/e-registered-messaging-system/` |

All real asset proportions are retained. Covers use intrinsic dimensions and `next/image`; gallery captures link to full originals. Monochrome display is CSS-only and original files remain intact. No required visual asset is missing. Tape, grid, grain, arrows, stamps, and outlined type are design decoration derived from the export rather than fake project imagery.

The image reveal observes an unclipped outer frame and animates a separate inner mask. This avoids an IntersectionObserver deadlock where a fully clipped target has zero intersection area and never reveals. Browser regressions cover real portrait/project/hero/gallery rendering with standard motion enabled on mobile and desktop, in addition to reduced-motion coverage.

## Interaction adaptation

- The real G logo covers initial loads, internal route/anchor navigation, case-preview screen changes, Back/Forward, and returns to a visible browser tab. Release waits for the committed path and query, route readiness, local fonts, and visible/eager image load/error and decode. Offscreen lazy images remain lazy. It uses no fixed minimum delay or once-per-session suppression. Content stays measurable but hidden and inert until ready. A 15-second failure offers Retry/Return with keyboard focus recovery. Cancellation, removed modal images, and image errors settle without an indefinite overlay.
- Hero text masks wait for readiness. Scroll reveals use Framer Motion with the export's thresholds and easing. CSS handles ticker, grain, button fill, visual sweep, and navigation hover states. Reduced motion removes movement and provides readable static content; no-JavaScript fallback exposes content without the loader.
- Desktop rail retains pointer dragging, restrained momentum, native scroll snapping, previous/next buttons, and active index. Added keyboard arrow/Home/End support and disabled end controls. Touch/mobile uses the vertical list; no wheel interception or scroll-jacking.
- The export's case-study overlay is retained with its scrim, charcoal reading panel, close affordance, responsive single-column details, and entrance/exit motion. Its summary, sections, metadata, and cover now come from the CMS. Focus stays inside the dialog, Escape closes it, background content is inert, and focus returns to the project action. A full-story link uses a six-strip shutter transition to the reusable `/work/[slug]` route, with the real gallery, reflection and next-project link. Same-page anchors also retain shutter transitions.
- Cursor labels follow mouse movement on fine-pointer devices. The native cursor remains visible; keyboard input hides the supplemental label. Reduced-motion/touch devices omit it.

## Accessibility and responsive behavior

Export thresholds are preserved: about/project stacking at 1080px, static hero labels at 1024px, vertical work rail at 900px, single-column process/navigation compression at 720px. All four navigation destinations remain visible at 360px (the export hid About below 420px). Explicit navigation accessible names prevent the CSS text replacement from being announced twice. Metadata/hint text has `#8C8C8C` contrast while decorative gray stays unchanged. Semantic landmarks, image alt text, focus indicators, a skip link, reduced motion, and no-JavaScript reveal fallbacks are maintained.

Automated viewport coverage: 360×800, 390×844, 430×932, 600×960, 820×1180, 1024×768, 1366×768, 1440×900, 1920×1080. The six additional case studies also fit 360/820/1440px widths. Screenshots in `.local/screenshots/` include the actual export, public hero, real assets, toolkit, footer, and 404. The custom 404 finishes its loader, prevents indexing, and offers home/archive recovery links.

## Changed files

- Public routes: `frontend/app/(site)/{layout,page,loading,error,not-found}.tsx`, `frontend/app/(site)/work/page.tsx`, `frontend/app/(site)/work/[slug]/page.tsx`, `frontend/app/{layout,not-found}.tsx`, `frontend/app/icon.svg`.
- Visual styling: generated `frontend/styles/opendesign.css`, `frontend/styles/opendesign-adaptations.css`, `frontend/styles/brand.css`, `frontend/styles/loading-screen.css`, and `scripts/adopt-opendesign.mjs`.
- Components: `frontend/components/layout/{header,footer,not-found-view}.tsx`, `frontend/components/home/tech-stack.tsx`, `frontend/components/work/{project-card,work-rail}.tsx`, `frontend/components/case-study/preview.tsx`, `frontend/components/motion/{archive-motion,logo-loader}.tsx`.
- Content/CMS: `database/seed-data.json`, `frontend/lib/image-dimensions.ts`, `backend/cms/`, `api/contracts/cms.ts`, `database/supabase/seed.sql`, `api/validation/cms.ts`, `frontend/components/admin/project-form.tsx`; optional unknown role fields stay blank rather than inventing them.
- Real media: `frontend/public/images/logo-white.png`, the two inquiry assets under `off-the-rack/`, and the six new project directories listed above. Original assets remain intact.
- Verification/setup: `package.json`, `package-lock.json`, `playwright.config.ts`, `tests/browser/{assets,opendesign,readiness}.spec.ts`, README, and this report. Next.js also regenerates `next-env.d.ts` during build/development.

## Verification and remaining inputs

- Lint, TypeScript, production build, canonical seed SQL drift check, and Git whitespace check pass.
- Seven validation/security tests pass. Thirty unique browser checks pass: the initial full run passed 28; an accessible nav-name duplication and an overlapping synthetic test fixture were corrected, and the affected checks plus Axe passed on rerun. The six new project cases also passed the expanded width checks.
- Loader audits passed delayed query commits, rapid navigation cancellation, Back, modal dismissal with an unresolved image, offscreen lazy images, image failures, timeout recovery, focus trapping, and Escape Return.
- No required visual assets are missing. Task Mate, Study Buddies, and DropSafe have one source sheet each, used as cover and gallery; they are described as wireframes/flows rather than shipped products. Unknown roles/tools for the six added projects, years/statuses, project URLs, résumé URL, and availability remain blank and editable.
- CMS/admin functionality is preserved. Live Supabase auth/storage/RLS checks require connection values and database setup; they were not run without that configuration. For an existing database, rerun the additive seed to add missing project rows and edit existing site settings through the CMS.
- The development server is available at `http://localhost:3000`; HTTP 200 verified. No deployment or domain change was made.

The project now uses frontend/backend/api/database ownership; see [the current structure](project-structure.md). Historical validation above applies to the original design adoption; the reorganization was additionally checked by lint, type generation, production build, validation/privacy tests, and the browser suite.
