# Responsive flowchart validation

The home page now uses a content-sized connected journey. The original paper hero, portrait, warm off-white surface, monochrome type, pale yellow nodes, published projects, and colored tool logos remain in place.

## Underlying changes

- Replaced the fixed-height pinned canvas and separate mobile details with natural document sections. Desktop reserves a node column, tablet reduces lateral travel, and mobile reserves a narrow left connector lane. Each node stays with its supporting content.
- Rebuilt connector routes from the actual node edge positions. ResizeObserver, viewport changes, and font readiness trigger measurement. Branches split at the decision diamond and visibly reconnect before continuing toward Selected Works, process, and contact.
- Line drawing follows document position and reverses consistently when scrolling upward. Content remains readable without waiting for animation. The current stage uses restrained yellow emphasis; the final contact stage activates at the natural end of the page.
- About and Contact navigation point to real section anchors; the navbar Work link opens the full `/work` archive. Section navigation accounts for the sticky header, and corrects initial hash positioning after font and hydration reflow. That initial correction is cancelled when the visitor starts interacting.
- Project previews keep their original image ratios and colors. The existing card controls work with a keyboard; inactive cards are inert. Without JavaScript, all selected projects appear in a normal vertical list.
- Reduced motion draws all connectors immediately. If diagram initialization is unavailable, static CSS connectors and all content remain visible.
- Added a short-viewport hero composition, quieter texture behind reading sections, consistent card spacing, and compact mobile branches.

## Tested viewports

Production build, local Edge/Chromium browser automation:

| Viewport | Forward/backward scroll | Geometry and overflow | Screenshot stages |
| --- | --- | --- | --- |
| 320 x 740 | Pass | Pass | 9 |
| 375 x 812 | Pass | Pass | - |
| 390 x 844 | Pass | Pass | 9 |
| 768 x 1024 | Pass | Pass | 9 |
| 1024 x 768 | Pass | Pass | - |
| 1280 x 800 | Pass | Pass | - |
| 1440 x 900 | Pass | Pass | 9 |
| 844 x 390, landscape | Pass | Pass | 9 |

Checks sample the full page in overlapping viewport steps in both directions. At every stage, they check node overlap, connector endpoints, connector crossings through content, horizontal overflow, clipped panels, and active-stage state. Additional tests cover direct links, resized layouts, project image ratios, keyboard controls, reduced motion, and JavaScript-disabled rendering. The mobile WCAG A/AA automated audit reports no violations.

- Responsive browser suite: 12 passed.
- Public landing and protected CMS route regression check: 1 passed.
- Existing automated tests: 14 passed.
- ESLint: passed.
- TypeScript check: passed.
- Production build: passed.

Screenshots are actual local production-preview captures. The gallery contains hero, intro, background, capabilities, branches, tools, selected works, process, and contact stages at each of the five captured sizes:

[Open the 45-screenshot gallery](../.local/responsive-journey/after/index.html)

| Stage | Desktop, 1440 x 900 | Tablet, 768 x 1024 | Mobile, 390 x 844 |
| --- | --- | --- | --- |
| Introduction | [Screenshot](../.local/responsive-journey/after/1440-intro.png) | [Screenshot](../.local/responsive-journey/after/768-intro.png) | [Screenshot](../.local/responsive-journey/after/390-intro.png) |
| Branches | [Screenshot](../.local/responsive-journey/after/1440-branches.png) | [Screenshot](../.local/responsive-journey/after/768-branches.png) | [Screenshot](../.local/responsive-journey/after/390-branches.png) |
| Selected works | [Screenshot](../.local/responsive-journey/after/1440-works.png) | [Screenshot](../.local/responsive-journey/after/768-works.png) | [Screenshot](../.local/responsive-journey/after/390-works.png) |
| Contact | [Screenshot](../.local/responsive-journey/after/1440-contact.png) | [Screenshot](../.local/responsive-journey/after/768-contact.png) | [Screenshot](../.local/responsive-journey/after/390-contact.png) |

The screenshot files are local review artifacts under the existing ignored `.local` directory. They are not production assets.

## Visual review

Reviewed actual desktop, tablet, mobile, 320px branch, and short-landscape captures. The existing GERIKAH/portrait composition remains the landing focal point. Supporting content follows consistent alignment, and the mobile branch descriptions use full available width while the two branch nodes retain their visible join.

The design skill inspector also ran at 1440, 768, and 390px. Its generic house-style findings concern intentionally preserved features: Space Mono, flowchart labels and outlined nodes, project stacks, the suspended portrait shadow, warm palette, and compact technical text. Its covered-text flags identify the supplied overlapping hero composition and inactive project cards, which are deliberately covered and excluded from keyboard and accessibility interaction. These are retained under the user's explicit design-preservation instruction. No video or unrelated reveal animation was added; the extending path remains the signature interaction.

## Files changed

- `frontend/components/home/flow-journey.tsx`: content-sized stages, progressive SVG drawing, measurement, anchors, and project fallback.
- `frontend/components/home/flow-layout.ts`: node ports, responsive route geometry, and document-position drawing progress.
- `frontend/components/home/flow-details.tsx`: aligns capability copy with its branch nodes and avoids duplicate headings.
- `frontend/components/layout/header.tsx`: Work navigation opens the full project archive; the hero CTA targets the selected-works stage.
- `frontend/components/layout/footer.tsx`: adds the connected contact end node.
- `frontend/styles/flow-journey.css`: responsive journey grid, branch lanes, typography, project cards, contact alignment, and static fallback.
- `frontend/styles/flow-details-polish.css`: content spacing independent of animation; removed superseded capability styles.
- `frontend/styles/landing-hero.css`: short-landscape hero composition.
- `tests/browser/flow-journey.spec.ts`: replaces old pinned-canvas checks with responsive journey regression coverage.
- `docs/responsive-journey-validation.md`: implementation and validation record.

Changes are local. No deployment is included in this task.
