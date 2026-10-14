-- Run against a fresh local Supabase database with: supabase test db
-- Fixtures and every mutation are rolled back. No actual files are uploaded.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

insert into auth.users (id, email) values
  ('dddddddd-dddd-4ddd-8ddd-dddddddd0001', 'admin-rls-test@example.invalid'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddd0002', 'viewer-rls-test@example.invalid');
insert into public.profiles (id, role) values
  ('dddddddd-dddd-4ddd-8ddd-dddddddd0001', 'admin'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddd0002', 'viewer');
insert into public.site_settings(id, name) values (1, 'RLS fixture') on conflict (id) do nothing;
insert into public.projects (id, title, slug, project_number, cover_image_url, cover_alt, is_published) values
  ('dddddddd-dddd-4ddd-8ddd-dddddddd0101', 'Published fixture', 'rls-published-fixture', 98, 'rls-test/public-cover.webp', 'Published cover', true),
  ('dddddddd-dddd-4ddd-8ddd-dddddddd0102', 'Draft fixture', 'rls-draft-fixture', 99, 'rls-test/draft-cover.webp', 'Draft cover', false);
insert into public.project_sections (id, project_id, body) values
  ('dddddddd-dddd-4ddd-8ddd-dddddddd0201', 'dddddddd-dddd-4ddd-8ddd-dddddddd0101', 'Published section'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddd0202', 'dddddddd-dddd-4ddd-8ddd-dddddddd0102', 'Draft section');
insert into public.project_media (id, project_id, storage_path, alt_text) values
  ('dddddddd-dddd-4ddd-8ddd-dddddddd0301', 'dddddddd-dddd-4ddd-8ddd-dddddddd0101', 'rls-test/public-gallery.webp', 'Published image'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddd0302', 'dddddddd-dddd-4ddd-8ddd-dddddddd0102', 'rls-test/draft-gallery.webp', 'Draft image');
insert into public.capabilities (id, title, is_published) values
  ('dddddddd-dddd-4ddd-8ddd-dddddddd0401', 'Published fixture', true),
  ('dddddddd-dddd-4ddd-8ddd-dddddddd0402', 'Draft fixture', false);
insert into storage.objects(bucket_id, name) values
  ('portfolio-media', 'rls-test/public-cover.webp'),
  ('portfolio-media', 'rls-test/public-gallery.webp'),
  ('portfolio-media', 'rls-test/draft-cover.webp'),
  ('portfolio-media', 'rls-test/draft-gallery.webp'),
  ('portfolio-media', 'rls-test/unreferenced.webp');

select ok((select bool_and(relrowsecurity) from pg_class where oid in (
  'public.profiles'::regclass, 'public.site_settings'::regclass, 'public.projects'::regclass,
  'public.project_sections'::regclass, 'public.project_media'::regclass, 'public.capabilities'::regclass
)), 'Every CMS table enables RLS');
select ok((select not public from storage.buckets where id = 'portfolio-media'), 'Portfolio bucket is private');
select ok((select bool_and(not has_table_privilege('anon', table_name, 'insert,update,delete')) from (values
  ('public.profiles'), ('public.site_settings'), ('public.projects'), ('public.project_sections'), ('public.project_media'), ('public.capabilities')
) as tables(table_name)), 'Anonymous visitors hold no CMS write grants');
select ok(not has_table_privilege('authenticated', 'public.profiles', 'insert,update,delete'), 'No authenticated user can promote a profile through the API');
select ok(not has_function_privilege('anon', 'public.delete_project_media(uuid,uuid)', 'execute'), 'Anonymous visitors cannot execute the media deletion RPC');

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select ok(not public.is_admin(), 'Anonymous visitors are not admins');
select is((select count(*) from public.site_settings), 1::bigint, 'Anonymous visitors can read the singleton settings');
select is((select count(*) from public.projects where slug like 'rls-%-fixture'), 1::bigint, 'Anonymous visitors see the published project only');
select is((select count(*) from public.project_sections where body in ('Published section', 'Draft section')), 1::bigint, 'Anonymous visitors see published sections only');
select is((select count(*) from public.project_media where storage_path like 'rls-test/%'), 1::bigint, 'Anonymous visitors see published gallery records only');
select is((select count(*) from public.capabilities where title in ('Published fixture', 'Draft fixture')), 1::bigint, 'Anonymous visitors see published capabilities only');
select is((select count(*) from storage.objects where bucket_id = 'portfolio-media' and name like 'rls-test/%'), 2::bigint, 'Anonymous visitors see only published cover and gallery paths');
select is((select count(*) from storage.objects where bucket_id = 'portfolio-media' and name = 'rls-test/unreferenced.webp'), 0::bigint, 'Unreferenced objects are private');
select throws_ok($$select * from public.profiles$$, '42501', null, 'Anonymous visitors cannot inspect profiles');

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"dddddddd-dddd-4ddd-8ddd-dddddddd0002","role":"authenticated"}';
select ok(not public.is_admin(), 'Signed-in viewer is not an admin');
select is((select count(*) from public.profiles), 1::bigint, 'Viewer can inspect only their own profile');
select is((select count(*) from public.projects where slug like 'rls-%-fixture'), 1::bigint, 'Signing in does not reveal drafts');
select is((select count(*) from storage.objects where bucket_id = 'portfolio-media' and name like 'rls-test/%'), 2::bigint, 'Signing in does not reveal draft or unreferenced images');
with changed as (update public.site_settings set name = 'Viewer edit' where id = 1 returning id) select is((select count(*) from changed), 0::bigint, 'Viewer cannot update settings');
with changed as (update public.projects set title = 'Viewer edit' where slug = 'rls-published-fixture' returning id) select is((select count(*) from changed), 0::bigint, 'Viewer cannot update projects');
with changed as (update public.project_sections set body = 'Viewer edit' where id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0201' returning id) select is((select count(*) from changed), 0::bigint, 'Viewer cannot update sections');
with changed as (update public.project_media set caption = 'Viewer edit' where id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0301' returning id) select is((select count(*) from changed), 0::bigint, 'Viewer cannot update gallery records');
with changed as (update public.capabilities set title = 'Viewer edit' where id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0401' returning id) select is((select count(*) from changed), 0::bigint, 'Viewer cannot update capabilities');
with changed as (delete from public.projects where slug = 'rls-published-fixture' returning id) select is((select count(*) from changed), 0::bigint, 'Viewer cannot delete projects');
select throws_ok($$insert into public.projects(title, slug, project_number) values ('Viewer insert', 'rls-viewer-insert', 97)$$, '42501', null, 'Viewer cannot create projects');
select throws_ok($$insert into public.project_sections(project_id) values ('dddddddd-dddd-4ddd-8ddd-dddddddd0101')$$, '42501', null, 'Viewer cannot create sections');
select throws_ok($$insert into public.project_media(project_id, storage_path, alt_text) values ('dddddddd-dddd-4ddd-8ddd-dddddddd0101', 'rls-test/viewer.webp', 'Viewer image')$$, '42501', null, 'Viewer cannot create gallery records');
select throws_ok($$insert into public.capabilities(title) values ('Viewer insert')$$, '42501', null, 'Viewer cannot create capabilities');
select throws_ok($$insert into storage.objects(bucket_id, name) values ('portfolio-media', 'rls-test/viewer.webp')$$, '42501', null, 'Viewer cannot upload objects');
with changed as (update storage.objects set name = 'rls-test/viewer-edit.webp' where bucket_id = 'portfolio-media' and name = 'rls-test/public-cover.webp' returning id) select is((select count(*) from changed), 0::bigint, 'Viewer cannot overwrite objects');
with changed as (delete from storage.objects where bucket_id = 'portfolio-media' and name = 'rls-test/public-cover.webp' returning id) select is((select count(*) from changed), 0::bigint, 'Viewer cannot delete objects');
select throws_ok($$update public.profiles set role = 'admin' where id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0002'$$, '42501', null, 'Viewer cannot promote themselves');
select throws_ok($$select * from public.delete_project_media('dddddddd-dddd-4ddd-8ddd-dddddddd0101', 'dddddddd-dddd-4ddd-8ddd-dddddddd0301')$$, '42501', null, 'Media deletion RPC explicitly rejects signed-in viewers');

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"dddddddd-dddd-4ddd-8ddd-dddddddd0001","role":"authenticated"}';
select ok(public.is_admin(), 'Protected admin profile grants admin access');
select is((select count(*) from public.projects where slug like 'rls-%-fixture'), 2::bigint, 'Admin can inspect draft and published projects');
select is((select count(*) from public.project_sections where body in ('Published section', 'Draft section')), 2::bigint, 'Admin can inspect draft sections');
select is((select count(*) from public.project_media where storage_path like 'rls-test/%'), 2::bigint, 'Admin can inspect draft gallery records');
select is((select count(*) from public.capabilities where title in ('Published fixture', 'Draft fixture')), 2::bigint, 'Admin can inspect draft capabilities');
select is((select count(*) from storage.objects where bucket_id = 'portfolio-media' and name like 'rls-test/%'), 5::bigint, 'Admin can inspect draft and unreferenced objects');
with changed as (update public.site_settings set name = 'Admin edit' where id = 1 returning id) select is((select count(*) from changed), 1::bigint, 'Admin can update settings');
with changed as (update public.projects set title = 'Admin edit' where slug = 'rls-draft-fixture' returning id) select is((select count(*) from changed), 1::bigint, 'Admin can update draft projects');
with changed as (update public.project_sections set body = 'Admin edit' where id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0202' returning id) select is((select count(*) from changed), 1::bigint, 'Admin can update draft sections');
with changed as (update public.project_media set caption = 'Admin edit' where id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0302' returning id) select is((select count(*) from changed), 1::bigint, 'Admin can update draft gallery records');
with changed as (update public.capabilities set description = 'Admin edit' where id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0402' returning id) select is((select count(*) from changed), 1::bigint, 'Admin can update draft capabilities');
select lives_ok($$insert into public.projects(id, title, slug, project_number) values ('dddddddd-dddd-4ddd-8ddd-dddddddd0103', 'Admin insert', 'rls-admin-insert', 97)$$, 'Admin can create draft projects');
select lives_ok($$insert into public.project_sections(project_id) values ('dddddddd-dddd-4ddd-8ddd-dddddddd0103')$$, 'Admin can create sections');
select lives_ok($$insert into public.project_media(project_id, storage_path, alt_text) values ('dddddddd-dddd-4ddd-8ddd-dddddddd0103', 'rls-test/admin.webp', 'Admin image')$$, 'Admin can create gallery records');
select lives_ok($$insert into public.capabilities(id, title) values ('dddddddd-dddd-4ddd-8ddd-dddddddd0403', 'Admin insert')$$, 'Admin can create capabilities');
select lives_ok($$insert into storage.objects(bucket_id, name) values ('portfolio-media', 'rls-test/admin.webp')$$, 'Admin can upload objects');
with changed as (update storage.objects set name = 'rls-test/admin-renamed.webp' where bucket_id = 'portfolio-media' and name = 'rls-test/admin.webp' returning id) select is((select count(*) from changed), 1::bigint, 'Admin can update objects');
with changed as (delete from storage.objects where bucket_id = 'portfolio-media' and name = 'rls-test/admin-renamed.webp' returning id) select is((select count(*) from changed), 1::bigint, 'Admin can delete objects');
with changed as (delete from public.project_sections where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0103' returning id) select is((select count(*) from changed), 1::bigint, 'Admin can delete sections');
with changed as (delete from public.project_media where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0103' returning id) select is((select count(*) from changed), 1::bigint, 'Admin can delete gallery records');
with changed as (delete from public.capabilities where id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0403' returning id) select is((select count(*) from changed), 1::bigint, 'Admin can delete capabilities');
with changed as (delete from public.projects where id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0103' returning id) select is((select count(*) from changed), 1::bigint, 'Admin can delete projects');

select throws_ok($$select * from public.delete_project_media('dddddddd-dddd-4ddd-8ddd-dddddddd0102', 'dddddddd-dddd-4ddd-8ddd-dddddddd0301')$$, 'P0002', null, 'Media deletion RPC rejects an image belonging to another project');
select is((select count(*) from public.project_media where id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0301'), 1::bigint, 'Mismatched RPC call does not delete another project image');
update public.projects set cover_image_url = 'rls-test/draft-gallery.webp' where id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0102';
select results_eq(
  $$select storage_path, slug from public.delete_project_media('dddddddd-dddd-4ddd-8ddd-dddddddd0102', 'dddddddd-dddd-4ddd-8ddd-dddddddd0302')$$,
  $$values ('rls-test/draft-gallery.webp'::text, 'rls-draft-fixture'::text)$$,
  'Media deletion RPC returns the removed path and affected project slug'
);
select is((select count(*) from public.project_media where id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0302'), 0::bigint, 'Media deletion RPC removes the requested gallery record');
select ok((select cover_image_url = '' and cover_alt = '' from public.projects where id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0102'), 'Media deletion RPC clears the matching project cover and alt text');

update public.projects set is_published = false where id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0101';
reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select is((select count(*) from public.projects where slug = 'rls-published-fixture'), 0::bigint, 'Unpublishing removes the project from public reads');
select is((select count(*) from public.project_sections where id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0201'), 0::bigint, 'Unpublishing removes public section reads');
select is((select count(*) from public.project_media where id = 'dddddddd-dddd-4ddd-8ddd-dddddddd0301'), 0::bigint, 'Unpublishing removes public gallery reads');
select is((select count(*) from storage.objects where bucket_id = 'portfolio-media' and name like 'rls-test/%'), 0::bigint, 'Unpublishing prevents new public signatures and reads for both cover and gallery paths');

reset role;
select * from finish();
rollback;
