# Gerikah — Design & Development

A black-and-cream editorial portfolio based on the three screenshots in `frontend/design/assets/NEW ASSETS/`, with Space Mono headings and Poppins body text. Projects are created and published through the existing authenticated Supabase CMS. The archive starts empty; homepage placeholders remain until configured.

See the [redesign and verification report](docs/editorial-redesign.md) for implementation details, backup locations, upload investigation and the first-project walkthrough. The [project structure](docs/project-structure.md) describes the current files and cleanup.

## Local development

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`. Without Supabase configuration, the site shows global seed settings and empty project positions; no projects are seeded or recreated.

Copy `frontend/.env.example` to `frontend/.env.local` and configure:

```dotenv
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
```

Normal CMS operations use the authenticated session and RLS. Optional `SUPABASE_SECRET_KEY` is only needed for local backup/integration verification, not production CMS writes. Never expose it through a `NEXT_PUBLIC_` variable. Environment files and backups are ignored by Git.

## Database setup

For a new database, apply files in `database/supabase/migrations/` in filename order, then `database/supabase/seed.sql`. For an existing database, apply only unapplied migrations. **The editorial migration intentionally backs up and resets the old project collection. Do not rerun it on a new active collection.** It leaves storage objects, users, global settings and capabilities intact.

The seed now contains only global settings and capabilities. `npm run seed:generate` regenerates SQL; `node scripts/seed.mjs --check` verifies it.

Core tables are `projects`, `project_media`, `homepage_content`, `site_settings`, `capabilities` and protected administrator `profiles`. The old `project_sections` table remains for compatibility; new projects use two bounded story fields directly on `projects`. The private `portfolio-media` bucket accepts PNG/JPG/WebP up to 3 MB.

Provision an administrator in Supabase Auth, then assign that user's real UUID:

```sql
insert into public.profiles (id, role)
values ('YOUR_AUTH_USER_UUID', 'admin')
on conflict (id) do update set role = excluded.role;
```

Sign in at `/login`. There is no public sign-up page. See [CMS setup](docs/cms-setup.md).

## Editing

1. **Projects → New project**: enter the short metadata and two story sections, select a gallery layout, upload a cover with alt text, and save a draft.
2. Fill the six landscape slots, or three portrait and two landscape slots. The cover is separate. Use the saved-page preview, then publish.
3. **Homepage**: assign published projects to the large feature and two secondary positions; upload the independent editorial portraits.
4. Unpublish before changing layouts or removing required visuals. Replacements and layout changes retain displaced files in Unassigned media. Deleting a project removes its records while retaining stored files.

Only published projects appear at `/work` and `/work/[slug]`. Private previews under `/admin/projects/[id]/preview` require administrator authentication. Public media URLs are permission-checked and expire after five minutes; already downloaded or cached images cannot be revoked by unpublishing.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run privacy:check
npm run build
npm run start
npx playwright test tests/browser/editorial.spec.ts
```

The browser suite uses installed Microsoft Edge on Windows. The CMS lifecycle test requires the local private `SUPABASE_SECRET_KEY`: it creates a temporary verification administrator, project and images, exercises actual UI actions, and removes those records afterward. Run it against an empty verification portfolio; it temporarily updates homepage assignments and restores them. Do not run it concurrently with real CMS editing.

## Deployment

The repository root is the Vercel root. `vercel.json` runs `npm run build` and uses `frontend/.next`. Configure the URL and publishable key for the intended environment and apply migrations separately; the frontend build does not migrate the database. Deploy to a preview first. This redesign task has not published a frontend deployment or changed domain mappings.

## Repository

```text
frontend/   Routes, components, styles, public assets and source designs
backend/    Server-only data, media resolution and authorization
api/        Server Actions, contracts and validation
database/   Seed, migrations, ignored backups and SQL tests
scripts/    Backup and seed utilities
tests/      Unit, security and browser checks
docs/       Setup and implementation reports
```
