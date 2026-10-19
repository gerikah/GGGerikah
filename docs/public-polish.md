# Public portfolio refinements

The existing artwork, Space Mono/Poppins pairing, and navy/red/cream palette remain the design reference. The hero tagline and GERIKAH footer background assets are unchanged. Regular-weight headings and a shared five-step desktop type scale replace the previous competing sizes; supporting copy is 14–15px and navigation/captions are 13px.

- Design and Build share aligned columns on desktop and compact heading/list rows on phones.
- All method numbers are neutral initially. A pointer hover applies the brand gradient; touch devices do not retain a hover accent.
- The stack uses right-aligned labels with locally hosted logos on their left. The heading and method hover use lighter tints of the existing gradient for readability on black.
- Footer contact details, social links, and signature come from CMS settings. Work, About, and Back to top links complete the footer.
- Scroll reveals run once, with small hero/brand-mark parallax. Route entrances preserve Next.js navigation, history, and hash scrolling. Reduced motion disables travel and animations; content remains visible without JavaScript.
- The favicon is the same SVG as the navbar logo.

Technology icons are from [Devicon](https://github.com/devicons/devicon), downloaded on 2026-10-19 from `icons/{name}/{name}-original.svg`. Names: nextjs, typescript, react, supabase, postgresql, nodejs, html5, css3, javascript, figma, git, vercel. The [MIT license](devicon-license.txt) is included. Grayscale preserves internal logo details; black marks use inversion for the dark background.

Validation covers production build, TypeScript, ESLint, existing unit tests, desktop/tablet/mobile widths (1440, 768, 390, 320px), hover/touch behavior, route history, anchors, favicon response, reduced motion, and no-JavaScript content. Visual captures and local check results live in ignored `.local/` and `.taste-skill/` directories.

The design inspector allows the explicitly requested monospace type, gradients, original multi-line artwork composition, and smaller body type. Empty CMS image/project slots are preserved rather than populated with invented work.
