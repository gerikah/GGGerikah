# Project structure

```text
frontend/
  app/                 Next.js public, login, and CMS routes
  components/          Interface and interaction components
  styles/              Shared, public, and CMS stylesheets
  public/images/       Active branding, portrait, textures, tool logos, and CMS test fixture
  content/             Editable portfolio copy
  REFERENCE/           Original supplied layout references
  design/assets/       Original supplied artwork and project captures
  proxy.ts             Thin Next.js request entry point
  next.config.ts       Next.js roots and image configuration
  .env.example         Blank environment template
backend/
  cms/                 Published content and signed media access
  supabase/            Server clients, authorization, and session refresh
api/
  actions/             Existing login and authenticated CMS Server Actions
  contracts/           Shared content and form response types
  validation/          Input and external URL validation
database/
  seed-data.json       Canonical editable seed source
  supabase/migrations/ Schema, RLS policies, and database functions
  supabase/seed.sql    Generated additive seed
  supabase/tests/      Database access regressions
scripts/               Seed generation, backup and privacy utilities
tests/                 Validation, privacy, and browser checks
docs/                  Setup and design reports
```

Run npm commands from the repository root. `npm run dev`, `build`, and `start` select `frontend` as the Next.js project. The URL paths and `/images` URLs are unchanged. `frontend/tsconfig.json` extends the root tooling configuration; `@frontend`, `@backend`, `@api`, and `@database` identify module ownership. Turbopack and output tracing are confined to this repository so sibling server/database modules are included.

The API folder holds the existing Next.js Server Actions, not a separate HTTP server. CMS mutation actions check `requireAdmin()`; server data/auth modules retain `server-only`. Login is the unauthenticated entry point and checks the admin profile after authentication. Shared API contracts and validation can be imported by interface components without exposing the server implementation. Future HTTP routes must be registered through Next.js `frontend/app/api/**/route.ts` and perform their own authorization.

Keep local configuration in `frontend/.env.local`, which is ignored by Git. Only the blank `.env.example` is committed. Secret keys, private certificates, service-account credentials, database backups, Supabase local credentials, build output, test output, and local caches are also ignored. Never put secrets inside `frontend/public` or a `NEXT_PUBLIC_` variable. Supabase publishable keys intentionally carry limited public permissions; Auth and RLS protect access. No elevated secret/service-role key is needed for this CMS.

The October 18 cleanup traced module imports from every Next.js route and checked stylesheet, image, script and test references. It removed eleven unused components/helpers, five old stylesheets, five superseded browser specifications, the OpenDesign export/generator, outdated design reports, old bundled project/technology images and generated audit results. Original supplied artwork in `frontend/design/assets/`, current design references, database backups, migrations, authentication and environment configuration were retained. The active `logo-white.png` remains because the 404 component and CMS upload verification use it.

Public routes, including the root 404, use `frontend/styles/editorial.css`. The landing hero, expanding flowchart, interactive process and footer have focused stylesheets. Shared globals provide the foundation; CMS forms use `frontend/styles/admin.css`. `ArchiveMotion` retains section scroll entrances, while the flowchart measures and animates connectors. The opening hero uses the original portrait and paper texture, and the contact footer uses live links from CMS settings. Space Mono and Poppins remain the two typefaces.

Obsolete freeform-section and upload actions were removed. Project pages no longer query the unused `project_sections` table; historical schema migrations and backup support remain intact. No database or remote storage records were changed during this cleanup.

After staging a commit, run `npm run privacy:check` to check the actual Git index for private filenames, populated environment templates, and recognizable secret patterns. It reports filenames without printing detected values. Use the verification commands in the README to check the current implementation; live database access tests require Supabase configuration.


## November 5 cleanup

Traced route, module, dynamic logo, script, test and asset references. Removed three superseded homepage components (`tech-stack`, `workflow`, `workflow-route`), their unused CSS, nine unused public artwork copies, and the unused UI/UX content block. Preserved the original tagline artwork under `frontend/design/assets/NEW ASSETS/hero-tagline.png`. Original design references, all CMS-selectable technology logos, database migrations, local backups and environment configuration remain.

Removed 26 generated screenshot/report folders (400 files, approximately 136.7 MiB) and disposable test output. Historical reports may reference those regenerated captures; the reports themselves remain as implementation history. Active preview/build dependencies are retained.
