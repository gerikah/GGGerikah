# Gerikah Alday — Design Archive

A new black-and-white portfolio for **Gerikah L. Alday**, UI/UX Designer and Frontend Developer. The initial archive contains Off The Rack and Marci Metzger Homes; the latter is explicitly an **independent redesign concept**. Existing project screenshots and the supplied portrait are preserved in `assets/` and copied into `public/images/` for the initial content.

This repository is a separate replacement project. Develop and deploy it as a new project while the existing portfolio stays live. No production domain or existing deployment needs to change to preview this version.

## Stack and routes

- Next.js 16 App Router, React, strict TypeScript, Tailwind CSS, and Framer Motion.
- Supabase Auth, Postgres with Row-Level Security, and a private Storage bucket.
- `/`: introduction, about snapshot, selected work, process, and contact.
- `/work`: published project archive.
- `/work/[slug]`: reusable case study assembled from CMS sections and media.
- `/login`: email/password sign-in; there is no public sign-up page.
- `/admin`: authenticated administration, restricted to profiles with `role = 'admin'`.

## Local development

Use Node.js 20.9 or later and npm. Next.js 16 runs ESLint separately from the production build, so run both commands when validating changes. See the [official Next.js installation instructions](https://nextjs.org/docs/app/getting-started/installation).

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. Without Supabase environment values, the public portfolio renders the checked-in seed content, and the CMS explains that a connection is required. This makes it possible to review the design before creating the database. Once Supabase is configured, published database content becomes the source for public pages.

On Windows PowerShell, if script execution policy blocks `npm.ps1`, run the same commands with `npm.cmd` (for example, `npm.cmd run dev`); changing the system execution policy is unnecessary.

Copy `.env.example` to `.env.local`, then fill in the values from the new Supabase project's API settings:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Only these two environment variables are required. The publishable key is intended for client use; permissions are enforced by the authenticated session and RLS. Do not add a service-role or secret key to a `NEXT_PUBLIC_` variable. `.env.local` is ignored by Git. Restart the development server after changing environment values.

The verification commands are:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run start
```

`npm run start` serves the completed production build. The test command checks canonical content and validation boundaries; a live Supabase project is still needed to exercise real login, database permissions, and uploads. With a running local Supabase instance, apply/reset the local database and run `supabase test db` for the pgTAP access regression suite in `supabase/tests/portfolio_rls.test.sql`. That suite exercises anonymous, viewer, and admin permissions, draft storage references, and unpublishing, then rolls back its fixtures.

## Create and seed Supabase

1. Create a **new** Supabase project dedicated to this portfolio.
2. In its SQL editor, run **every numbered SQL file in `supabase/migrations/` in filename order**, starting with `20261013000000_portfolio_cms.sql`. The migration creates the schema, RLS, private bucket, and CMS database functions. Apply all available migrations before using the admin.
3. Run `supabase/seed.sql` in the same project.
4. Add the project's URL and publishable key to `.env.local`.
5. Set up the admin account as described below.

The migration creates these tables:

| Table | Purpose |
| --- | --- |
| `profiles` | Links an Auth user UUID to an administrator role. |
| `site_settings` | Singleton identity, copy, availability, and contact settings. |
| `projects` | Metadata, cover image, ordering, external links, and publication state. |
| `project_sections` | Ordered case-study content blocks. |
| `project_media` | Ordered visuals with alt text, captions, and layout. |
| `capabilities` | Editable capability/process items and publication state. |

The migrations also create the private `portfolio-media` bucket, access policies, and transactional CMS functions. Anonymous visitors can read published projects, their sections and media, published capabilities, and public site settings. Only authenticated admins can change portfolio content. Admin roles are provisioned through SQL, never through a public form.

The canonical initial content is `lib/cms/seed-data.json`; the seed SQL is generated from it so the offline preview and the database use the same source. To update the initial fixture during development:

```sh
npm run seed:generate
node scripts/seed.mjs --check
```

The generator writes `supabase/seed.sql`; `--check` fails if generated SQL has drifted. The seed uses `ON CONFLICT (id) DO NOTHING`, so rerunning it preserves existing CMS edits and adds only missing initial records. Changing the JSON fixture does not overwrite rows already in the database; use the CMS or a deliberate database update for existing content. If using the Supabase CLI locally, initialize/start the local project and run `supabase db reset` to apply migrations and seed; this resets the local development database. For a hosted project, use the SQL editor steps above.

## Provision the CMS administrator

In the Supabase dashboard, disable new public user sign-ups in Authentication settings. Create the administrator in **Authentication → Users** with an email and a strong password, and confirm the user if required. Use the supplied portfolio email, `aldaygerikah@gmail.com`, or replace it in the SQL below with the email of the admin account you created. The [Supabase password authentication guide](https://supabase.com/docs/guides/auth/passwords) describes the underlying sign-in system.

Run this in the SQL editor **after** creating the Auth user:

```sql
-- Verify the real Auth UUID before granting access.
select id, email
from auth.users
where email = 'aldaygerikah@gmail.com';

-- The profile id is the Auth user's UUID, not an unrelated generated id.
insert into public.profiles (id, role)
select id, 'admin'
from auth.users
where email = 'aldaygerikah@gmail.com'
on conflict (id) do update set role = excluded.role;
```

The first query must return the intended user. If it returns no rows, create/confirm that user before proceeding; the insert will otherwise grant no access. Then visit `/login`, sign in with the account's password, and open `/admin`. A signed-in account without an admin profile cannot manage content.

Set Supabase's Auth site URL to the eventual new deployment URL and allow the local development URL as needed. This project uses password sign-in; account provisioning and recovery remain managed through Supabase rather than a public registration flow.

## CMS editing workflow

1. Sign in at `/login` and open `/admin`.
2. Edit **Site settings** for the name, role, tagline, supporting copy, bio, availability, email, LinkedIn, GitHub, résumé URL, and footer copy.
3. Create a project as a draft. Give it a unique slug, project number, category, description, overview, role/tools, and meaningful cover alt text. Leave status blank until verified, and add year and external links only when verified.
4. Add case-study sections and upload visuals. Give each visual meaningful alt text; use captions to explain what visitors should notice. Change display order to control the narrative and gallery sequence.
5. Save and publish the project once its content is ready. Use the published-content preview link to review the public result. Changes revalidate the affected homepage, archive, and case-study routes.
6. Unpublish to return a project to draft. Delete only content you intend to remove. Capabilities/process entries can also be edited, ordered, and hidden.

Public case-study pages only expose published projects. Drafts can be edited in the CMS; the public preview link is for published content. Do not use a public project URL as a private draft preview.

### Uploaded images and draft privacy

`portfolio-media` remains **private**. The database stores the uploaded object's storage path, not an expiring URL. The server generates permission-checked signed URLs with a 300-second lifetime when rendering content. Anonymous storage access is allowed only when a published project references that object; admins can access draft media. Keep the bucket private and use CMS uploads instead of making it public. See [Supabase's bucket documentation](https://supabase.com/docs/guides/storage/buckets/fundamentals).

The original seed screenshots under `public/images/` are ordinary public static files. Unpublishing a seeded project hides its content from the archive but cannot make those checked-in static assets private. For future draft visuals, use the private CMS upload flow. Unpublishing prevents new visitor reads/signatures, but does not revoke previously issued URLs or copies already downloaded. Token expiration and browser/CDN image caching are independent, so cached images can remain accessible after a token expires. See [Supabase's signed URL caching behavior](https://supabase.com/docs/guides/storage/cdn/smart-cdn#signed-urls-and-cdn-caching). Sensitive draft images should never be published as a temporary preview.

## Deploy separately to Vercel

1. Push this repository to its own Git repository/branch as appropriate.
2. Import it into a **new Vercel project**, using the Next.js framework preset and this repository root.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the environments that should use the new Supabase project. Keep preview content separate from production if needed by using a separate Supabase project.
4. Build with `npm run build` and deploy to the new project's Vercel preview domain.
5. Update Supabase's Auth site URL for the new deployment, then verify public pages, login, admin access, publishing, and uploads.

Keep the existing portfolio's Vercel project and domain mapping as they are while reviewing this replacement. Switch a custom domain only when this version is ready. Database migrations and seed initialization are explicit setup steps; Vercel does not run them during the application build.

## Content and assets still to supply

The seed uses the provided email, GitHub, and LinkedIn links. No résumé URL, project live/repository URLs, confirmed project years/statuses, or current availability claim were supplied, so those fields remain empty. Add verified values in the CMS. There are no stock images, invented clients, testimonials, performance metrics, or additional public projects.

All initial visual assets are present: a real portrait, Off The Rack mockup/storefront/admin/wireframe screenshots, and Marci Metzger Homes mockup and homepage screenshots. The source color images are preserved; the portfolio displays them with a monochrome treatment.

## Project layout

```text
app/                    Public routes, login, and protected administration
components/             Custom layout, work, case-study, admin, and motion UI
lib/cms/                Content types, seed source, and data access
lib/validations/        CMS field and URL validation
lib/supabase/           Browser/server clients and session handling
public/images/          Supplied visuals used by the seed
assets/                 Untouched source assets
scripts/seed.mjs         Canonical content → SQL generator
supabase/migrations/    Schema, permissions, and private storage setup
supabase/seed.sql        Generated initial portfolio data
tests/                  Content/access regression checks
```

The public portfolio uses semantic landmarks, keyboard focus styles, responsive layouts, alt text, reduced-motion support, and a skippable intro that is recorded once per browser session. Ongoing CMS changes belong in the database; future projects can be added through the admin without editing page components.
