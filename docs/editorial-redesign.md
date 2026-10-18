# Editorial portfolio redesign

The supplied `NEW ASSETS/HOMEPAGE.png`, `VIEW PROJECT LANDSCAPE.png` and `VIEW PROJECT PORTRAIT.png` are the design authority. Space Mono handles headings; Poppins handles body text. The new logo and hero illustration are served from `frontend/public/images/brand/`. Reference-required gray placeholders, gradients, rules, numbering and monospace intentionally override the generic design skill's house rules. No stock imagery or sample portfolio content was added.

## Implementation

- `frontend/app/(site)/page.tsx` and `frontend/styles/editorial.css`: reference homepage, two editorial images, three selected-work positions, restrained scroll entrances, hero drift, reduced-motion support and responsive layouts.
- `frontend/components/case-study/project-detail.tsx` and `visual-board.tsx`: one project template, two short story columns, landscape/mixed grids, native fullscreen dialog with Escape, arrow navigation and focus restoration.
- `frontend/app/admin/homepage/page.tsx`: published-project assignments and separate editorial uploads.
- `frontend/components/admin/project-form.tsx`, `gallery-editor.tsx`, `image-input.tsx`: counters, editable generated slugs, cover preview, layout previews, fixed gallery slots, compatible reordering, retained displaced media and private saved-page preview.
- `api/actions/editorial.ts`, `backend/cms/upload.ts`, `api/validation/cms.ts`: authenticated actions, client/server validation, file-signature and 3 MB checks, persistent object references and upload compensation on save failures.
- `backend/cms/data.ts`: published database records only. No project fallback from the seed.

## Database and recovery

Applied to project `jzvfuuunlrdiicajllvd`:

1. `20261018111727_editorial_portfolio.sql`: portfolio snapshot/reset, bounded project fields, gallery slots, singleton homepage configuration, admin-only mutations, publishing validation, transactional layout changes and slot assignment.
2. `20261018112342_gallery_integrity.sql`: private unassigned media, deferred gallery integrity checks, automatic clearing of homepage assignments on unpublish.

Before clearing, exported 9 projects, 31 sections and 34 media records to ignored file `database/backups/portfolio-1792321720438.json`; read it back to verify counts. A second recoverable snapshot is in private table `portfolio_backup.editorial_reset_20261018`. Original local seed is in `database/backups/seed-before-redesign.json`. Storage objects, admin users, authentication settings, global site settings and capabilities were retained.

Recovery should be reviewed before importing: old data uses the former freeform schema and does not meet the new required-field constraints. The JSON export and private snapshot contain complete original records; restore them into an isolated database running the original migration, or map them deliberately to the new fields. Never rerun the reset migration manually on an active collection.

## Cover upload investigation

The existing bucket and admin storage policies were present. The confirmed workflow defect was that project creation had no cover-file field or direct cover mutation: a project had to be created, a gallery image uploaded, then explicitly assigned as cover. The old limit was 10 MB; files that size also exceed common serverless request limits. No evidence established that RLS caused the historical failure.

Creation now uploads directly to a unique persistent project object path and saves that path with project details. Editing has a dedicated cover upload/replacement action. Replacements use new object names; previous files remain intact. A failed database write removes only the newly uploaded orphan, preserving the previous reference. Blob URLs are used solely for local previews. The server action body limit is 4 MB; both application validation and Storage enforce 3 MB per image.

The bucket remains private. Published cover/gallery images and configured homepage editorial images can be read; drafts and unassigned gallery images cannot be read anonymously. Admin writes still require the existing protected `profiles` role. See [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control) and [standard upload guidance](https://supabase.com/docs/guides/storage/uploads/standard-uploads).

## Your first project

1. Sign in at `/login`; open **Projects → New project**.
2. Enter title, subtitle, role, four-digit year, status/type and both short story sections. Review the generated slug; add optional stack and links.
3. Choose **Visual Board Layout**, upload a cover with alt text, then **Save draft**.
4. Fill all six landscape slots, or three portrait plus two landscape slots. Cover is separate. Add alt text to every image; captions are optional.
5. Use **Preview page** to review saved content. Save all edits, then confirm **Publish project**.
6. Open **Homepage** to assign the published project to one of three positions. Manage the two editorial portraits separately there.

To change a layout or remove a required image, unpublish first. Layout changes retain compatible images and move displaced images to **Unassigned media**. Reordering occupied compatible slots swaps their images. Project deletion removes associated records but retains storage files to avoid damaging shared references.

## Environment

No new production variables. Existing `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` remain required. `SUPABASE_SECRET_KEY` is used only by local backup and integration verification scripts, never by browser code or normal CMS writes. Font files are installed locally via `@fontsource/space-mono` and `@fontsource/poppins`.

The code must be deployed with the two applied migrations. This task does not deploy the frontend.

## Verification

- Production build and TypeScript: passed.
- Twelve unit/security tests: passed (field bounds, required metadata, safe URLs, empty seed and authorization guards).
- ESLint and repository privacy check: passed.
- Public browser checks: passed at 1440, 768 and 390 px; three empty project placeholders, two editorial placeholders, empty archive, protected admin, no horizontal overflow and no serious/critical Axe violations.
- Both Playwright tests passed on the production build (1.9 minutes). The real CMS lifecycle covered draft creation; cover upload, removal, restoration and replacement verified after refresh; rejection of oversized images; six landscape images; gallery replacement, swapping and removal/reassignment; switching to three portraits plus two landscapes while preserving displaced media; publication; duplicate homepage assignment rejection; both editorial uploads; public navigation; keyboard fullscreen navigation; unpublishing and deletion. Public image loading was verified before screenshots at all three widths, and project pages also passed serious/critical Axe checks.
- Final connected-database cleanup audit confirmed zero projects, zero temporary verification accounts and empty homepage assignments/editorial references.
- Local pgTAP fixture was updated for the new required fields and six-slot publication rule, but the local pgTAP suite was not executed; browser tests exercised the connected database instead.
- The skill's standalone CDP inspector timed out twice. Playwright screenshots were used for visual QA instead; no inspector pass is claimed.

Existing Supabase advisor warnings: `is_admin()` is the intentional protected role lookup used by RLS; `rls_auto_enable()` is an existing platform function; leaked-password protection is disabled in the existing Auth configuration. This change did not weaken those settings.

## Visual review

The supplied screenshots fix the composition, so no randomized replacement direction was used. Gerikah's sketch/code illustration becomes the hero backdrop; the enlarged G/cursor mark and full-width wordmark carry that identity through the stack and footer. The functional interaction is the CMS-backed work navigation and keyboard-accessible visual viewer. The empty media positions are intentional requirements, not fabricated portfolio evidence.

Reviewed full-page captures at 1440, 768 and 390 pixels. First review corrected an undersized hero and footer wordmark, reduced the illustration's prominence and restored the cream/red/purple footer field. Second review confirmed the large-feature/two-secondary hierarchy and stacked mobile metadata/story/grid. The original workflow's progressive scroll entrances are retained with reduced-motion support. Typography and content stay visible before JavaScript runs.

The exact desktop source proportions are adapted to usable mobile reading sizes. Empty project positions deliberately omit fake titles and links. The stack uses real technology names instead of repeating placeholder labels from the reference. No extra case-study sections were added.
