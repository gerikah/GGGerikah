# Gerikah — Design Archive

A charcoal portfolio for **Gerikah**, UI/UX Designer and Frontend Developer. The published seed contains eight projects identified from the supplied screenshots, wireframes, and diagrams. Marci Metzger Homes remains explicitly an **independent redesign concept**. Source images and the supplied portrait are preserved in `frontend/design/assets/` and copied into `frontend/public/images/` for the portfolio.

The public interface uses the taste skill’s **Pinned poster** direction: locally hosted Michroma/Manrope typography, the supplied Mosaic Lens hero, real project plates, a wireframe/build comparison, and Gerikah’s charcoal gradient references. Phosphor supplies action icons; locally hosted brand marks identify the CMS tech stack. See [the redesign report](docs/taste-redesign.md) and [logo attribution](docs/technology-logo-attribution.md). The original OpenDesign export remains archived in `frontend/design/opendesign/`.

## Published project inventory

| Project | Case-study slug | Evidence in the supplied assets |
| --- | --- | --- |
| Off The Rack | `off-the-rack` | Storefront, product, administration, and wireframe screenshots; user-confirmed project details. |
| Marci Metzger Homes | `marci-metzger-homes` | Independent homepage redesign screenshots; user-confirmed project details. |
| Ground Control Station | `ground-control-station` | LIPAD GCS desktop/mobile dashboards, analytics, drone-stream screens, and related GCS diagrams. |
| Riftbound | `riftbound` | Presentation labeled Game UI Design, with home, heroes, equipment, and battle screens. |
| Task Mate | `task-mate` | Named, annotated mobile task-management wireframe map. |
| Study Buddies | `study-buddies` | Named account, matching, chat, and navigation flowchart. |
| DropSafe | `dropsafe` | Named locker-system diagram for delivery, retrieval, and the resident dashboard. |
| E-Registered Messaging System | `e-registered-messaging-system` | Titled use-case diagram and related numbered sender, message, campaign, and account flows. |

The Flows & Wireframes presentation combines several of these works; it is not counted as an additional project. The numbered messaging diagrams belong to one documented system, and the GCS diagrams belong to Ground Control Station. Each case study uses a selection of real source visuals rather than publishing every image. Task Mate, Study Buddies, and DropSafe each have one standalone source sheet, used for both their cover and gallery. Their descriptions identify wireframes or flow documentation and do not claim a shipped application, client engagement, or measured outcome.

This repository is a separate replacement project. Develop and deploy it as a new project while the existing portfolio stays live. No production domain or existing deployment needs to change to preview this version.

## Stack and routes

- Next.js 16 App Router, React, strict TypeScript, Tailwind CSS, and Framer Motion.
- Supabase Auth, Postgres with Row-Level Security, and a private Storage bucket.
- `/`: introduction, design/build comparison, eight-project work archive, about snapshot, CMS-derived tech stack, process, and contact.
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

Copy `frontend/.env.example` to `frontend/.env.local`, then fill in the values from the new Supabase project's API settings:

```dotenv
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
```

Only the URL and publishable key are required. The template also has optional private SECRET_KEY and JWKS_URL entries; neither is used by the CMS's RLS-protected clients. These variables are read on the server, without NEXT_PUBLIC prefixes. The publishable key is intended for client use; permissions are enforced by the authenticated session and RLS. Do not add a service-role or secret key to a `NEXT_PUBLIC_` variable. `frontend/.env.local` is ignored by Git. Restart the development server after changing environment values.

The verification commands are:

```sh
npm run lint
npm run typecheck
npm test
npm run privacy:check
npm run test:e2e
npm run build
npm run start
```

`npm run start` serves the completed production build. The test command checks canonical content and validation boundaries; a live Supabase project is still needed to exercise real login, database permissions, and uploads. With a running local Supabase instance, apply/reset the local database and run `supabase --workdir database test db` for the pgTAP access regression suite in `database/supabase/tests/portfolio_rls.test.sql`. That suite exercises anonymous, viewer, and admin permissions, draft storage references, and unpublishing, then rolls back its fixtures.

## Create and seed Supabase

1. Create a **new** Supabase project dedicated to this portfolio.
2. In its SQL editor, run **every numbered SQL file in `database/supabase/migrations/` in filename order**, starting with `20261013000000_portfolio_cms.sql`. The migration creates the schema, RLS, private bucket, and CMS database functions. Apply all available migrations before using the admin.
3. Run `database/supabase/seed.sql` in the same project.
4. Add the project's URL and publishable key to `frontend/.env.local`.
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

The canonical initial content is `database/seed-data.json`; the seed SQL is generated from it so the offline preview and the database use the same source. To update the initial fixture during development:

```sh
npm run seed:generate
node scripts/seed.mjs --check
```

The generator writes `database/supabase/seed.sql`; `--check` fails if generated SQL has drifted. The seed uses `ON CONFLICT (id) DO NOTHING`, so rerunning it preserves existing CMS edits and adds only missing initial records. Changing the JSON fixture does not overwrite rows already in the database; use the CMS or a deliberate database update for existing content. If using the Supabase CLI locally, initialize/start the local project under `database` using the CLI's `--workdir database` option and run `supabase --workdir database db reset` to apply migrations and seed; this resets the local development database. For a hosted project, use the SQL editor steps above.

For a database already seeded with the earlier two-project archive, rerun the generated seed to add the six new project records, sections, and images. Existing records and site settings remain unchanged. In the CMS, set **Site settings → Name** to `Gerikah` to adopt the current display name. Do not reset a database containing content you want to retain.

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

The original seed screenshots under `frontend/public/images/` are ordinary public static files. Unpublishing a seeded project hides its content from the archive but cannot make those checked-in static assets private. For future draft visuals, use the private CMS upload flow. Unpublishing prevents new visitor reads/signatures, but does not revoke previously issued URLs or copies already downloaded. Token expiration and browser/CDN image caching are independent, so cached images can remain accessible after a token expires. See [Supabase's signed URL caching behavior](https://supabase.com/docs/guides/storage/cdn/smart-cdn#signed-urls-and-cdn-caching). Sensitive draft images should never be published as a temporary preview.

## Deploy separately to Vercel

1. Push this repository to its own Git repository/branch as appropriate.
2. Import it into a **new Vercel project**, using the Next.js framework preset and this repository root.
3. Add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for the environments that should use the new Supabase project. Keep preview content separate from production if needed by using a separate Supabase project.
4. Build from the repository root with `npm run build`, set the Output Directory to `frontend/.next`, and deploy to the new project's Vercel preview domain. Vercel supports overriding the build command and output directory in [project configuration](https://vercel.com/docs/project-configuration/vercel-json#outputdirectory). Hosting deployment was not performed during the local folder reorganization.
5. Update Supabase's Auth site URL for the new deployment, then verify public pages, login, admin access, publishing, and uploads.

Keep the existing portfolio's Vercel project and domain mapping as they are while reviewing this replacement. Switch a custom domain only when this version is ready. Database migrations and seed initialization are explicit setup steps; Vercel does not run them during the application build.

## Content and assets still to supply

The seed uses the provided email, GitHub, and LinkedIn links. No résumé URL, project live/repository URLs, confirmed project years/statuses, or current availability claim were supplied, so those fields remain empty. The six projects added from visual evidence also leave role and tools empty until verified; the original two keep the details explicitly provided by the user. Add verified values in the CMS. There are no stock images, invented clients, testimonials, or performance metrics.

All seeded visual assets are present: the real portrait, the original two projects, Ground Control Station screens, Riftbound game UI screens, and the named wireframe/flowchart works listed above. The source color images are preserved; the portfolio displays them with a monochrome treatment.

## Project layout

```text
frontend/              Next.js routes, components, styles, images, and source designs
backend/               Server data, signed media, authorization, and session refresh
api/                   Server Actions, shared contracts, and input validation
database/              Canonical seed, Supabase migrations, SQL, and database tests
scripts/               Seed and OpenDesign stylesheet generators
tests/                 Validation, privacy, and browser regressions
docs/                  CMS setup, folder structure, and design reports
```

The public portfolio adapts the actual OpenDesign export in `frontend/design/opendesign/`. The navigation is logo-only, the hero and footer use GERIKAH, and the footer G logo is removed. Contact links display “Start a conversation” and open email. A real-logo loading screen covers initial loads, navigation, preview changes, and browser-tab returns until the route, fonts, and necessary images are ready. Offscreen lazy images stay lazy; reduced motion and no-JavaScript fallbacks expose readable content. Failed loads offer Retry/Return. A custom 404 provides home/archive recovery.

The public portfolio uses semantic landmarks, keyboard focus styles, responsive layouts, alt text, and reduced-motion support. Ongoing CMS changes belong in the database; future projects can be added through the admin without editing page components. See [the OpenDesign implementation report](docs/opendesign-adaptation.md) for inspected handoff files, all eight asset mappings, changed files, missing-input details, and verification results. The browser suite uses installed Microsoft Edge on Windows and reuses the local development server.

See [CMS quick setup](docs/cms-setup.md) and [folder ownership/privacy](docs/project-structure.md). The API modules are server-side actions; admin writes require authorization. Local env files and credentials are excluded from Git.
