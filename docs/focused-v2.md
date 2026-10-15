# Focused portfolio v2

The dark editorial/archive direction, typography, spacing system, project compositions, and case-study content are retained. This revision implements the six requested changes without choosing a new design direction or adding dependencies.

## Changes

- **Personal introduction:** the hero contains Gerikah's name, role, existing headline, supporting copy, and CTA. An abstract responsive-layout composition uses the existing white personal mark. No project image, project label, or case-study link remains in the hero. The selected-project index is a separate bridge below the first viewport; Off The Rack follows immediately.
- **Original project colour:** detail screenshots, wireframes, implementation evidence, workflow artifacts, and case-study images have no grayscale treatment. Only the dedicated `.project-cover` class can be grayscale, at desktop widths with a fine pointer and hover support. Hover and keyboard focus reveal colour over 240ms without zooming. Narrow layouts and touch devices display original colours immediately.
- **Logo navigation:** the existing minimal white mark replaces the text name and links to `/`. Work always opens `/work`; About and Contact retain their homepage anchors.
- **Sticky utility layer:** the compact navigation stays at the top, transparent initially. A scroll observer enables a dark translucent surface, 12px backdrop blur, and low-contrast border when content moves behind it. Anchors leave space beneath the navigation. Without JavaScript, the sticky bar uses an opaque dark fallback for readable links.
- **Working toolbox:** ten genuine local SVG marks are paired with technology names and associated project links. HTML/CSS display as HTML5/CSS3; Node/npm expands to Node.js and npm while retaining the same project evidence. The marks stay monochrome. Figma is not added because existing project content does not list it.
- **Connected workflow:** Discover, Define, Structure, Design, Build the foundation, Build the interface, Test and refine, and Release and iterate appear in order. Steps five and six share a Build connection and an explicit overlap note. Small real wireframe, admin, and interface artifacts support the route. The mobile version is a vertical timeline rather than a horizontal scroll trap or eight cards.

The hero mark and first featured interface are preloaded. Reduced motion removes transitions. All eight case-study routes, archive links, contact links, publication checks, backend code, and original assets remain intact.

## Files

- `frontend/app/(site)/page.tsx`: neutral hero, separate project bridge, workflow integration.
- `frontend/components/layout/header.tsx`: actual logo, sticky scroll state, archive destination, no-JavaScript fallback.
- `frontend/components/home/workflow.tsx`: new server-rendered eight-stage route and publication-aware real artifacts.
- `frontend/components/home/tech-stack.tsx`: SVG technology index and project associations.
- `frontend/styles/taste.css`: targeted hero, navigation, image-colour, workflow, and toolbox rules.
- `frontend/app/(site)/work/page.tsx` and `frontend/components/work/project-card.tsx`: dedicated cover-image class.
- `tests/browser/focused-v2.spec.ts`, `assets.spec.ts`, `opendesign.spec.ts`, and `readiness.spec.ts`: v2 behavior checks and preserved case-study coverage.
- `README.md`, `docs/technology-logo-attribution.md`, and this report: current behavior and asset attribution.

## Verification

- Production build, ESLint, and TypeScript/route generation pass.
- All 11 existing validation/privacy tests pass.
- All 41 unique browser tests pass: the full 40-test production run plus the new narrow-layout check and final affected reruns.
- Desktop/mobile sticky navigation, logo/home navigation, archive destination, anchor visibility, cover hover/focus colour, narrow/touch original colour, no-JavaScript navigation, reduced motion, eight case studies, workflow order/overlap, and all ten SVG assets are covered.
- Six axe scans across home, archive, and Off The Rack at desktop/mobile widths report zero violations.
- Screenshots at 1440px and 390px were inspected for the hero, bridge, workflow, toolbox, full homepage, and archive. The 768px layout is also browser-tested. Captures are under ignored `.local/screenshots/v2-*`.
- Static design lint reports no failures. Its workflow-number warning corresponds to the requested ordered steps. The requested hero outlines, timeline connections, and sticky border/blur are deliberate exceptions to the skill's default ornament rules.
- The design skill's probe/judging modules, run through installed Playwright/Edge at all three widths, report no failures, no text collisions, and two-line hero headings. The remaining no-footage warning is intentional: the brief calls for restrained motion and the source material is static project artwork.

Browser/build verification uses the repository's existing seed fallback through child-process environment overrides. No environment files, CMS configuration, live database records, or deployment were changed.

## Visual review

The inherited Split stage direction is retained; no redraw was needed for this focused revision. Gerikah's personal mark now carries the first viewport, and the actual projects carry their own colours below it. The existing wireframe/interface toggle remains the one live project interaction.

ROUND 1: the first viewport is project-neutral; the workflow reads as preparation, parallel build work, then validation/release; the toolbox shows recognizable marks and project associations. The workflow descriptions were raised to the same 16px body size as the existing page during final measurement. Desktop and mobile renders show no text clipping or collisions. Scores: design 8.0, usability 8.5, creativity 7.5, content 8.8; overall 8.1. The requested mono labels, index lines, and restrained motion supersede the skill's generic defaults.
