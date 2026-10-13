begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

-- Admin status comes from a protected table, never user-editable Auth metadata.
-- The definer avoids recursively applying the profiles SELECT policy.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  name text not null default '',
  role text not null default '',
  tagline text not null default '',
  hero_supporting_copy text not null default '',
  bio text not null default '',
  availability_text text not null default '',
  email text not null default '',
  linkedin_url text not null default '',
  github_url text not null default '',
  resume_url text not null default '',
  footer_copy text not null default ''
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  project_number integer not null check (project_number > 0),
  category text not null default '',
  short_description text not null default '',
  overview text not null default '',
  role text not null default '',
  tools text[] not null default '{}'::text[],
  year integer check (year between 1900 and 2200),
  project_type text not null default '',
  status text not null default '',
  live_url text not null default '',
  repository_url text not null default '',
  -- Either a bundled /images path, an approved external URL, or a Storage path.
  cover_image_url text not null default '',
  cover_alt text not null default '',
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_cover_requires_alt check (cover_image_url = '' or length(btrim(cover_alt)) > 0)
);

create table public.project_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  section_type text not null default 'text' check (section_type in (
    'text', 'image', 'image_pair', 'gallery', 'quote', 'split',
    'tools', 'full_width', 'reflection', 'external_link'
  )),
  heading text,
  body text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null check (length(btrim(storage_path)) > 0),
  alt_text text not null check (length(btrim(alt_text)) > 0),
  caption text not null default '',
  media_type text not null default 'image' check (media_type = 'image'),
  layout text not null default 'full' check (layout in ('full', 'half', 'portrait')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.capabilities (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'capability' check (kind in ('capability', 'process')),
  title text not null check (length(btrim(title)) > 0),
  description text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default false
);

create index projects_public_order on public.projects(is_published, sort_order);
create index project_sections_project_order on public.project_sections(project_id, sort_order);
create index project_media_project_order on public.project_media(project_id, sort_order);
create index project_media_storage_path on public.project_media(storage_path);
create index capabilities_public_order on public.capabilities(kind, is_published, sort_order);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
create trigger projects_updated_at before update on public.projects
for each row execute function public.set_updated_at();
create trigger project_sections_updated_at before update on public.project_sections
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.projects enable row level security;
alter table public.project_sections enable row level security;
alter table public.project_media enable row level security;
alter table public.capabilities enable row level security;

-- Remove implicit grants before granting only the operations exposed by the CMS.
revoke all on table public.profiles, public.site_settings, public.projects,
  public.project_sections, public.project_media, public.capabilities from anon, authenticated;
grant select on table public.site_settings, public.projects, public.project_sections,
  public.project_media, public.capabilities to anon;
grant select, insert, update, delete on table public.site_settings, public.projects,
  public.project_sections, public.project_media, public.capabilities to authenticated;
grant select on table public.profiles to authenticated;

-- Profiles can only be created/promoted through the SQL editor by the owner.
create policy "Read own profile" on public.profiles
for select to authenticated using (id = (select auth.uid()));

create policy "Read public site settings" on public.site_settings
for select to anon, authenticated using (true);
create policy "Admin insert site settings" on public.site_settings
for insert to authenticated with check ((select public.is_admin()));
create policy "Admin update site settings" on public.site_settings
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete site settings" on public.site_settings
for delete to authenticated using ((select public.is_admin()));

create policy "Read published projects" on public.projects
for select to anon, authenticated using (is_published);
create policy "Admin read projects" on public.projects
for select to authenticated using ((select public.is_admin()));
create policy "Admin insert projects" on public.projects
for insert to authenticated with check ((select public.is_admin()));
create policy "Admin update projects" on public.projects
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete projects" on public.projects
for delete to authenticated using ((select public.is_admin()));

create policy "Read published project sections" on public.project_sections
for select to anon, authenticated using (
  exists (select 1 from public.projects p where p.id = project_id and p.is_published)
);
create policy "Admin read project sections" on public.project_sections
for select to authenticated using ((select public.is_admin()));
create policy "Admin insert project sections" on public.project_sections
for insert to authenticated with check ((select public.is_admin()));
create policy "Admin update project sections" on public.project_sections
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete project sections" on public.project_sections
for delete to authenticated using ((select public.is_admin()));

create policy "Read published project media" on public.project_media
for select to anon, authenticated using (
  exists (select 1 from public.projects p where p.id = project_id and p.is_published)
);
create policy "Admin read project media" on public.project_media
for select to authenticated using ((select public.is_admin()));
create policy "Admin insert project media" on public.project_media
for insert to authenticated with check ((select public.is_admin()));
create policy "Admin update project media" on public.project_media
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete project media" on public.project_media
for delete to authenticated using ((select public.is_admin()));

create policy "Read published capabilities" on public.capabilities
for select to anon, authenticated using (is_published);
create policy "Admin read capabilities" on public.capabilities
for select to authenticated using ((select public.is_admin()));
create policy "Admin insert capabilities" on public.capabilities
for insert to authenticated with check ((select public.is_admin()));
create policy "Admin update capabilities" on public.capabilities
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete capabilities" on public.capabilities
for delete to authenticated using ((select public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media', 'portfolio-media', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- An unpublished project's uploaded images are not available to visitors.
-- Local seed assets are bundled files, not objects in this private bucket.
create policy "Read published portfolio images" on storage.objects
for select to anon, authenticated using (
  bucket_id = 'portfolio-media'
  and (
    exists (
      select 1 from public.projects p
      where p.is_published and p.cover_image_url = storage.objects.name
    )
    or exists (
      select 1 from public.project_media m
      join public.projects p on p.id = m.project_id
      where p.is_published and m.storage_path = storage.objects.name
    )
  )
);
create policy "Admin read portfolio images" on storage.objects
for select to authenticated using (bucket_id = 'portfolio-media' and (select public.is_admin()));
create policy "Admin upload portfolio images" on storage.objects
for insert to authenticated with check (bucket_id = 'portfolio-media' and (select public.is_admin()));
create policy "Admin update portfolio images" on storage.objects
for update to authenticated
using (bucket_id = 'portfolio-media' and (select public.is_admin()))
with check (bucket_id = 'portfolio-media' and (select public.is_admin()));
create policy "Admin delete portfolio images" on storage.objects
for delete to authenticated using (bucket_id = 'portfolio-media' and (select public.is_admin()));

-- Keep cover removal and gallery deletion in the same database transaction.
-- The server action can clean up the Storage object after this succeeds.
create function public.delete_project_media(p_project_id uuid, p_media_id uuid)
returns table(storage_path text, slug text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_storage_path text;
  v_slug text;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select p.slug into v_slug
  from public.projects p where p.id = p_project_id
  for update;
  if not found then
    raise exception 'Project not found' using errcode = 'P0002';
  end if;

  select m.storage_path into v_storage_path
  from public.project_media m
  where m.id = p_media_id and m.project_id = p_project_id
  for update;
  if not found then
    raise exception 'Project image not found' using errcode = 'P0002';
  end if;

  update public.projects p
  set cover_image_url = '', cover_alt = ''
  where p.id = p_project_id and p.cover_image_url = v_storage_path;

  delete from public.project_media m
  where m.id = p_media_id and m.project_id = p_project_id;

  return query select v_storage_path, v_slug;
end;
$$;

revoke all on function public.delete_project_media(uuid, uuid) from public, anon, authenticated;
grant execute on function public.delete_project_media(uuid, uuid) to authenticated;

commit;
