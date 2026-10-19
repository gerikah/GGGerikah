# Portfolio media refinement

Reference exports: **portrait 450 × 850 (9:17)** and **landscape 700 × 350 (2:1)**. Display sizes remain responsive. The same frames render on public pages and CMS previews. Logos and decorative brand assets keep their original proportions.

All artwork uses contain, with no image filter or dark overlay. Different source ratios leave visible background inside the frame. No artwork was resized, cropped, or re-exported, and no project records or ordering were changed.

## Assets needing re-export to fill their frames

Audit of published content and homepage assignments on 19 October 2026, using stored source dimensions. These assets are usable now, with their complete artwork visible; re-export is only needed to fill the new frame without empty space. Higher-resolution proportional exports are accepted. One source pixel of rounding is tolerated.

| Placement | Source file | Source dimensions | Target ratio |
| --- | --- | --- | --- |
| Homepage editorial 1 | 2.png | 500 × 800 | 9:17 |
| Homepage editorial 2 | 1.png | 500 × 800 | 9:17 |
| Off The Rack — cover / cards | Off_The_Rack_Cover_Fitted_1428x700.png | 1428 × 700 | 2:1 |
| Off The Rack — gallery 4 | 6.png | 699 × 343 | 2:1 |
| Off The Rack — gallery 5 | 7.png | 699 × 343 | 2:1 |
| BLACKSITE — cover / cards | Blacksite_ Operational Clarity.png | 1672 × 941 | 2:1 |
| BLACKSITE — gallery 1 | Tell Us About Your Deployment-5.png | 1791 × 878 | 2:1 |
| BLACKSITE — gallery 2 | Inspect any node_ SITE-C topology-4.png | 1790 × 879 | 2:1 |
| BLACKSITE — gallery 3 | Product monitoring topology and events dashboard-2.png | 1791 × 878 | 2:1 |
| BLACKSITE — gallery 4 | Operational clarity laptop hero.png | 1770 × 889 | 2:1 |
| BLACKSITE — gallery 5 | Graphite Laptop with Orange-Accented Interface.png | 1770 × 889 | 2:1 |
| TaskMate — cover / cards | Taskmate screens on slender phones.png | 1787 × 880 | 2:1 |
| TaskMate — gallery 4 | 20.png | 699 × 343 | 2:1 |
| TaskMate — gallery 5 | 21.png | 699 × 343 | 2:1 |
| Flowcharts & Process Documentation — cover / cards | FIVERR - hero.png | 1672 × 941 | 2:1 |
| Flowcharts & Process Documentation — gallery 4 | 14.png | 699 × 343 | 2:1 |
| Flowcharts & Process Documentation — gallery 5 | 15.png | 699 × 343 | 2:1 |
| Mosquito Drone Ground Control Station — cover / cards | GCS portfolio on matte black.png | 1792 × 878 | 2:1 |
| Mosquito Drone Ground Control Station — gallery 4 | 12.png | 699 × 343 | 2:1 |
| Mosquito Drone Ground Control Station — gallery 5 | 13.png | 699 × 343 | 2:1 |

20 of 33 assigned images in the original audit differ from the revised target ratio. All twelve 450 × 850 gallery portraits now match, along with Blacksite NODE-01 laptop hero.png.

Draft projects Riftbound and Marci Metzger Homes have no cover assigned; their shared preview renderer follows the same rules. Unassigned library assets are not listed as required re-exports.

## Implementation

- Shared frame, ratio definitions, responsive sizes, and warnings: `frontend/components/media/`, `frontend/styles/media.css`.
- Compact introduction, metadata, optional stories, ordered gallery, keyboard fullscreen controls, and next-project links: `frontend/components/case-study/`, `frontend/app/(site)/work/[slug]/page.tsx`, `backend/cms/data.ts`.
- Homepage, archive cards, responsive spacing, gutters, typography, footer, reduced motion: `frontend/app/(site)/page.tsx`, `frontend/components/work/selected-project.tsx`, `frontend/styles/editorial.css`, `frontend/styles/globals.css`.
- CMS upload, library selection, tiles, assignment previews, review, and layout labels: `frontend/components/admin/`, `frontend/app/admin/`, `frontend/styles/admin.css`.
- Image failure handling: retry original after optimizer failure, refresh expired signed URLs once using existing authenticated server reads, then show a useful fallback. A failed gallery asset no longer rejects the entire page: `backend/cms/media.ts`.

## Image-loading findings

BLACKSITE gallery images below the viewport were initially deferred by native lazy loading. Scrolling loaded all six originals successfully during the initial network audit. Later stale signed URLs returned HTTP 400 and an optimizer request timed out; the shared component now handles both failure paths without keeping artwork hidden by animation. Fullscreen displays the original asset with contain.

## Original refinement verification (before the portrait-ratio revision)

Build, typecheck, lint, and the 14 existing unit/security/migration tests passed. All four focused browser tests passed against the production build: published layouts/fullscreen/navigation, optimizer and original failure handling, JavaScript-disabled content, and CMS previews/ratio warnings. Screenshots are stored locally in `.local/refinement/` and `.local/taste-refinement/`.

- Homepage, work archive, and all five published projects checked at **360, 390, 768, 1024, and 1440px**: no horizontal overflow; every content frame measured at 3:17 or 2:1; images loaded, used contain, and had no filter or opacity reduction.
- Fullscreen next/previous, Escape, return focus, scroll restoration, and next-project navigation passed.
- CMS homepage, mixed-gallery editor, review, and media library checked at the same five widths. Actual images loaded; a 300 × 1700 local preview was accepted without warning, and a 450 × 850 preview showed a ratio warning. No content-save requests were allowed in the final CMS test; the temporary test administrator was deleted.
- Design source lint: zero findings. Browser design inspector: zero failures with explicit allowances for preserved Space Mono, requested subtle separators, and the functional back link. Its three warnings (warm brand ink, no video, restrained motion) reflect the supplied identity, original artwork, and requested motion limits.
- Development cold compilation delayed some interactions; production checks passed without those delays. Playwright uses localhost consistently and accepts PLAYWRIGHT_BASE_URL for production verification.

## Visual review

Existing design retained; no new direction draw, stock photos, video, or generated artwork. The composition makes the original work the focal point, then uses compact story columns and an ordered visual board. The three main issues addressed were conflicting frame geometry, accumulated section gaps, and mobile gallery/title overflow. Screenshots confirm readable metadata and controls, uncropped images, closer captions, and a consistent footer.

The portrait ratio was revised to 9:17 at the owner’s request. Existing 450 × 850 portraits now fill their frames without cropping. The two 500 × 800 homepage assets still have a small amount of space inside their frames. No source artwork was altered.

Revision verification: typecheck passed; homepage and TaskMate portrait frames measured at 9:17 at 360, 390, 768, 1024, and 1440px, with loaded, uncropped images and no horizontal overflow. Landscape frames stayed 2:1. Shared CMS validation accepts 450 × 850 and 900 × 1700 without a ratio warning and flags 500 × 800. Updated screenshots are in `.local/portrait-9-17/`.

Gallery alignment revision: both gallery groups now occupy 100% of their shared parent. Desktop uses three equal portrait columns and two equal landscape columns with a shared 24px gap. At 600px and below, portraits use two columns and landscapes one, with a 16px gap; at 400px and below, portraits also use one column. Heights derive independently from the 9:17 and 2:1 frame ratios. Responsive image sizes were updated for the wider portrait columns. Typecheck and whitespace checks passed. Browser measurements at 360, 390, 500, 768, 1024, and 1440px confirmed aligned edges, equal column widths accounting for gaps, preserved ratios, loaded images, no overflow, and working fullscreen controls. Screenshots are in `.local/gallery-alignment/`.
