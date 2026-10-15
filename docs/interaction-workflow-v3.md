# Interaction and workflow revision

This focused revision preserves the dark editorial identity, black-dominant palette, typography, neutral hero concept, logo navigation, project copy, and case-study routes. It adds feedback for inspecting the existing work and replaces the fragmented workflow layout with one connected process map. The earlier [v2 report](focused-v2.md) and [original redesign report](taste-redesign.md) remain historical records.

## Interactions

- **Hero composition:** only the visual layers on the right respond to a mouse. The original white-mark PNG is reused in two complementary clipped layers so its exact artwork is preserved with one image resource. The personal mark moves up to 4px, the cursor layer up to 8px, and the small window up to 6px in the opposite direction. Normalized movement also caps diagonal travel. Updates use one scheduled animation frame, with a smooth return to rest. The headline and body copy stay still. Narrow layouts, coarse pointers, and reduced motion disable the effect.
- **Selected-work browser:** three vertical project rows highlight on hover or focus, with a small line reveal, 4px label shift, and restrained arrow movement. A 320px colour preview shows the real Off The Rack storefront, Marci homepage, or Ground Control dashboard beside the rows. Images are absent initially and mount only after eligible hover/focus on a fine pointer above 720px; they are never preloaded. Keyboard focus clears stale hover, and leaving a hovered row restores any focused row. Mobile keeps direct, easy-to-tap anchors without image previews.
- **Project covers and links:** desktop covers retain a monochrome idle state and reveal their original colour on hover or keyboard focus, with a 4px lift. Archive labels and arrows follow with a small shift. Touch devices display colour immediately. Evidence, previews, workflow artifacts, and case-study imagery retain their original colours.
- **Toolbox:** the ten existing local SVG technology marks brighten on hover/focus, related project tags appear, and items lift 3px over 250ms. Touch layouts keep the project tags visible. Each item still links to actual project evidence.

## One connected workflow

The intro uses a separate two-column header: `From brief` / `to browser` and `A connected process. Foundation and interface work can overlap.` The eight stage titles and descriptions are preserved: Discover, Define, Structure, Design, Build the foundation, Build the interface, Test and refine, and Release and iterate.

On desktop, a thin continuous route connects the alternating nodes for stages 01–04. The path then splits into Foundation and Interface branches, reconnects at Test and refine, and ends at Release and iterate. The shared `Build / parallel work` label explains the relationship. Only three small real artifacts attach to relevant stages: the Off The Rack inquiry wireframe at Design, its product admin at Foundation, and the Marci interface at Interface. The Ground Control dashboard provides the existing Interface fallback when Marci is unavailable. Artifacts remain gated by published project data.

At 900px and below, the map becomes one vertical timeline. The shared build label and stage order remain, with no side-by-side branch cards. The main intro stacks on narrow screens. Descriptions remain readable at rest; hover/focus brightens the node and description and reveals the artifact's case-study prompt without changing layout height.

An IntersectionObserver marks each stage once as it enters view. Connecting lines reveal with transform scaling, and nodes fade and move 8px over 350ms. Reduced motion shows the complete route without travel or entrance animation. Server-rendered content stays readable if JavaScript is unavailable.

## Implementation and performance

The main implementation lives in `frontend/components/home/hero-mark.tsx`, `selected-index.tsx`, `workflow.tsx`, `workflow-route.tsx`, the homepage, and `frontend/styles/taste.css`. Browser regression coverage lives under `tests/`.

Motion uses CSS transforms and opacity, with limited colour feedback. Preview images use Next.js image optimization and lazy loading after interaction. There are no new dependencies, environment changes, backend changes, deployments, video backgrounds, canvas effects, loaders, animation loops, or page transitions in this revision.

## Visual review

The inherited editorial direction was retained without a new direction draw. Desktop review found a single readable spine, balanced build branches, and small artifacts integrated into the route rather than separate cards. The build label was moved above the fork to clear the connecting line. Colour reveals stay on project covers; index previews and evidence retain the real assets' original colours. The mobile timeline and project links remain clear. Screenshots were reviewed at 1440px, 768px, and 390px, including the hero, active index, toolbox, and workflow. Static design lint reported zero failures and two warnings for the explicitly requested stage numbering and node outlines. The final browser design probe/judge reported zero failures, no collisions, and a two-line hero at all three widths. Its desktop video warning is intentional: the brief calls for lightweight interaction around the existing static artwork.

## Verification

The final production build, ESLint, TypeScript checks, all 11 validation tests, and the separate privacy check of 182 tracked files passed. All 51 unique browser cases were verified through the initial full run and the corrected preview-network test rerun, covering desktop and mobile layouts, keyboard interactions, reduced motion, and no-JavaScript access. After the final hero-layer and workflow-label refinements, all 19 affected checks passed again: the ten new interaction tests, two first-fold checks, desktop cover behaviour, and six accessibility scans with zero violations. Final screenshots at 1440px, 768px, and 390px showed no outstanding visual defects. `git diff --check` is clean. Local public-page verification used the checked-in seed content rather than a live CMS connection.
