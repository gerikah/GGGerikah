# CMS workspace redesign — 19 October 2026

The administration area now provides a fixed collapsible sidebar, mobile drawer, dashboard, searchable project list, three-step project editor and shared Media Library. The public homepage and project-page design were not changed.

## Editing flow

- **Details:** grouped identity, story, gallery-layout and link fields. Incomplete drafts preserve all existing length, URL and range limits. The server assigns an untitled draft a usable title and unique slug if those fields are empty. A stable draft ID prevents duplicate records during repeated submissions.
- **Images:** a separate cover tile and the selected gallery grid. Empty tiles open the file picker; tiles and upload zones accept dropped files. Dialogs provide upload, existing-media selection, alt text, caption, replacement, removal and compatible-position swapping. Uploads show pending and failure feedback; gallery counts and thumbnails update after saving.
- **Review & publish:** saved metadata, cover and compact gallery previews; actionable missing-content links; private preview; draft exit; publication confirmation. Publishing stays disabled until required information is complete and is checked again on the server and in the database.
- **Media Library:** independent upload, filename search, usage/project filters, full previews, dimensions, size, format and upload date. Content hashes reuse identical stored files. Assignment supports covers, gallery slots and either homepage portrait. Replacing a library image updates all its uses transactionally, retaining the original file.
- **Homepage:** three selected-work tiles with live cover previews and two portrait image tiles. Static branding assets have no new controls.
- **Site Content:** existing site details, capabilities and workflow records remain editable. The public homepage's fixed eight-step method remains unchanged; the workflow editor explicitly identifies its saved records as separate from that fixed design. Settings summarizes the account and existing media configuration.

Unsaved form changes trigger navigation warnings. Destructive operations use native confirmation dialogs. A confirmed discard closes and resets the image editor. Save controls remain near the bottom of the editor viewport.

## Database and preservation

Applied `database/supabase/migrations/20261018134801_cms_workspace.sql` to the connected Supabase project and recorded version `20261018134801` in migration history. This migration does **not** reset content. It relaxes publish-only draft requirements, adds the administrator-only `media_assets` index, backfills existing Storage objects, adds transactional assignment/replacement functions, and guards image references during deletion.

The Storage bucket remains private with PNG/JPG/WebP and the 3 MB limit. All server actions require administrator authorization. The index is unavailable to anonymous users and filtered by RLS for non-admin users. Existing publication and gallery integrity triggers remain in place.

Deletion reserves the asset before the Storage API call, blocks new assignments while reserved, and rejects referenced assets. Storage failure retains a retryable library entry; index cleanup failure is explicitly reported. Retained, unassigned project-image links can be removed separately before file deletion. Files are never deleted as part of a project replacement or layout change.

Before migration, all project records, homepage content, settings and capabilities were exported to the ignored `database/backups/portfolio-1792342443716.json`. Existing data consisted of zero projects, one homepage record, one settings record and nine capability/process records. All 15 existing Storage objects were indexed; `node scripts/reconcile-media.mjs` populated their dimensions and hashes without altering assignments or file bytes. Backups and CLI caches are excluded from Git.

## Verification

- Production build, TypeScript, ESLint and privacy check passed.
- Fourteen unit/security/database tests passed. The isolated Postgres test executes the actual migrations and verifies content preservation, incomplete drafts, stable draft IDs, publish constraints, media reuse, replacement, layout retention, deletion reservation and anonymous/non-admin restrictions.
- Two browser tests passed against the production build in Microsoft Edge. They exercised responsive public pages, protected admin entry points, desktop collapse, mobile drawer, stale-project recovery, automatic draft saving, cover persistence, all six landscape uploads, invalid-file rejection with preserved values, deduplication, private preview, publish/unpublish, public images/lightbox, mixed-layout retention, three portrait assignments from the library, independent upload, metadata, cover assignment, reference protection, global replacement, permanent unused-file deletion, homepage portrait replacement and selected-work assignment.
- The browser test restored the homepage, deleted its temporary project, uploads and administrator, and compared homepage/settings/capabilities with their original values.
- The homepage administration accessibility scan reported no serious or critical violations. Desktop and mobile screenshots were inspected in `.local/screenshots/cms-*.png`.

The development compiler stalled while first compiling a public project route during one intermediate run. The final suite ran successfully against the optimized production build. Earlier test-selector failures were corrected before the passing run.

## Deployment and setup

The database migration and existing-image indexing are already complete for the connected project. No new production secrets are required. Deploy the code changes through the existing Vercel workflow to expose the new interface on `gerikah.vercel.app`; this task did not publish a frontend deployment or commit changes.

For another existing database, back up content and apply only the new workspace migration after its prerequisites. Do not rerun the older editorial reset migration. The connected project's historical migration timestamps differ from the local prerequisite filenames; inspect history before using an automatic `db push`.

`node scripts/reconcile-media.mjs` can populate missing metadata or index orphaned uploads after an interrupted index write. It preserves existing records, assignments and files. It requires the local service key and is not exposed through the website.

## Changed files

### Navigation, routes and styling

- `frontend/app/admin/layout.tsx`
- `frontend/app/admin/page.tsx`
- `frontend/app/admin/projects/page.tsx` (new)
- `frontend/app/admin/projects/new/page.tsx`
- `frontend/app/admin/projects/[id]/page.tsx`
- `frontend/app/admin/media/page.tsx` (new)
- `frontend/app/admin/homepage/page.tsx`
- `frontend/app/admin/content/page.tsx` (new; existing site-details controls moved here)
- `frontend/app/admin/settings/page.tsx`
- `frontend/app/admin/capabilities/page.tsx`
- `frontend/styles/admin.css`

### Administration components

- `frontend/components/admin/admin-navigation.tsx` (new)
- `frontend/components/admin/editor-steps.tsx` (new)
- `frontend/components/admin/project-list.tsx` (new)
- `frontend/components/admin/project-form.tsx`
- `frontend/components/admin/action-form.tsx`
- `frontend/components/admin/gallery-editor.tsx`
- `frontend/components/admin/image-input.tsx`
- `frontend/components/admin/image-tile.tsx` (new)
- `frontend/components/admin/media-picker.tsx` (new)
- `frontend/components/admin/media-library.tsx` (new)
- `frontend/components/admin/homepage-assignments.tsx` (new)

### Server, data and migration

- `api/actions/editorial.ts`
- `api/actions/media-library.ts` (new)
- `api/contracts/media-library.ts` (new)
- `api/validation/cms.ts`
- `backend/cms/upload.ts`
- `backend/cms/library.ts` (new)
- `database/supabase/migrations/20261018134801_cms_workspace.sql` (new)

### Tests, dependencies and documentation

- `tests/browser/editorial.spec.ts`
- `tests/cms-database.test.mjs` (new)
- `tests/privacy.test.mjs`
- `tests/security-validation.test.mjs`
- `scripts/backup-portfolio.mjs`
- `scripts/reconcile-media.mjs` (new)
- `package.json` and `package-lock.json` (direct Sharp dependency; PGlite for isolated Postgres tests)
- `.gitignore`
- `README.md`
- `docs/cms-workspace.md` (this report)
