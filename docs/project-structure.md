# Project structure

```text
frontend/
  app/                 Next.js public, login, and CMS routes
  components/          Interface and interaction components
  styles/              Shared, public, and CMS stylesheets
  public/images/       Curated portfolio images served at /images/...
  design/assets/       Original supplied artwork and project captures
  design/opendesign/   Original handoff, manifest, and index.html
  lib/                 Image dimensions for the interface
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
scripts/               Seed and design stylesheet generators
tests/                 Validation, privacy, and browser checks
docs/                  Setup and design reports
```

Run npm commands from the repository root. `npm run dev`, `build`, and `start` select `frontend` as the Next.js project. The URL paths and `/images` URLs are unchanged. `frontend/tsconfig.json` extends the root tooling configuration; `@frontend`, `@backend`, `@api`, and `@database` identify module ownership. Turbopack and output tracing are confined to this repository so sibling server/database modules are included.

The API folder holds the existing Next.js Server Actions, not a separate HTTP server. CMS mutation actions check `requireAdmin()`; server data/auth modules retain `server-only`. Login is the unauthenticated entry point and checks the admin profile after authentication. Shared API contracts and validation can be imported by interface components without exposing the server implementation. Future HTTP routes must be registered through Next.js `frontend/app/api/**/route.ts` and perform their own authorization.

Keep local configuration in `frontend/.env.local`, which is ignored by Git. Only the blank `.env.example` is committed. Secret keys, private certificates, service-account credentials, database backups, Supabase local credentials, build output, test output, and local caches are also ignored. Never put secrets inside `frontend/public` or a `NEXT_PUBLIC_` variable. Supabase publishable keys intentionally carry limited public permissions; Auth and RLS protect access. No elevated secret/service-role key is needed for this CMS.

Cleanup removed the unimported browser Supabase client, unused compatibility props and `PaperLabel`, old empty module folders, and obsolete generated caches/reports. All 30 served images, original artwork, handoff files, migrations, seed data, scripts, and tests were retained.

The subsequent [taste redesign](taste-redesign.md) uses `frontend/styles/taste.css` for public routes and retains the OpenDesign export/extracted styles as references. `ArchiveMotion` keeps content visible and manages legacy modal background accessibility; navigation uses normal Next.js links without loading gates. Shared globals contain the foundation and reduced-motion-aware smooth scrolling, while CMS form styling stays in `frontend/styles/admin.css`.

After staging a commit, run `npm run privacy:check` to check the actual Git index for private filenames, populated environment templates, and recognizable secret patterns. It reports filenames without printing detected values. Lint, type generation, production build, all 11 validation/privacy tests, and all 30 browser checks passed after this reorganization. Live database access tests still require Supabase configuration.
