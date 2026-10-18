begin;
-- Recoverable portfolio-only snapshot; never exposed through the Data API.
create schema if not exists portfolio_backup;
revoke all on schema portfolio_backup from public, anon, authenticated;
create table portfolio_backup.editorial_reset_20261018 as
select now() as backed_up_at,
  (select coalesce(jsonb_agg(to_jsonb(p)), '[]') from public.projects p) as projects,
  (select coalesce(jsonb_agg(to_jsonb(s)), '[]') from public.project_sections s) as sections,
  (select coalesce(jsonb_agg(to_jsonb(m)), '[]') from public.project_media m) as media;
revoke all on all tables in schema portfolio_backup from public, anon, authenticated;
delete from public.projects;
-- Shared storage, profiles, settings and capabilities are deliberately untouched.
alter table public.projects
  add column section_one_heading text not null default '',
  add column section_one_body text not null default '',
  add column section_two_heading text not null default '',
  add column section_two_body text not null default '',
  add column figma_url text not null default '',
  add column gallery_layout text not null default 'landscape' check (gallery_layout in ('landscape','mixed')),
  alter column project_number set default 1,
  add constraint editorial_project_fields check (
    char_length(title) between 1 and 45 and char_length(slug) between 1 and 60
    and char_length(short_description) between 1 and 100 and char_length(role) between 1 and 70
    and year is not null and year between 1900 and 2200
    and status in ('Concept','In Progress','Completed')
    and project_type in ('Personal Project','Independent Concept','Academic Project','Client Work')
    and char_length(section_one_heading) between 1 and 40 and char_length(section_two_heading) between 1 and 40
    and char_length(section_one_body) between 1 and 400 and char_length(section_two_body) between 1 and 400
    and char_length(cover_alt) <= 160 and cardinality(tools) <= 8
  );
alter table public.project_media add column slot integer check (slot between 0 and 5);
alter table public.project_media add constraint project_media_slot_unique unique (project_id, slot) deferrable initially deferred;
alter table public.project_media add constraint editorial_media_text check (char_length(alt_text) between 1 and 160 and char_length(caption) <= 90);
create table public.homepage_content (
 id smallint primary key default 1 check(id=1),
 featured_project_id uuid references public.projects on delete set null,
 secondary_one_id uuid references public.projects on delete set null,
 secondary_two_id uuid references public.projects on delete set null,
 editorial_one_path text not null default '', editorial_one_alt text not null default '',
 editorial_two_path text not null default '', editorial_two_alt text not null default '',
 check(featured_project_id is distinct from secondary_one_id or featured_project_id is null),
 check(featured_project_id is distinct from secondary_two_id or featured_project_id is null),
 check(secondary_one_id is distinct from secondary_two_id or secondary_one_id is null),
 check(char_length(editorial_one_alt)<=160 and char_length(editorial_two_alt)<=160),
 check(editorial_one_path='' or length(btrim(editorial_one_alt))>0),
 check(editorial_two_path='' or length(btrim(editorial_two_alt))>0)
);
insert into public.homepage_content(id) values (1);
alter table public.homepage_content enable row level security;
revoke all on public.homepage_content from anon, authenticated;
grant select on public.homepage_content to anon;
grant select, update on public.homepage_content to authenticated;
create policy "Public homepage" on public.homepage_content for select to anon, authenticated using(true);
create policy "Admin homepage" on public.homepage_content for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy "Public editorial images" on storage.objects for select to anon, authenticated using (
 bucket_id='portfolio-media' and exists(select 1 from public.homepage_content h where name in (h.editorial_one_path,h.editorial_two_path))
);
update storage.buckets set file_size_limit=3145728, allowed_mime_types=array['image/png','image/jpeg','image/webp'] where id='portfolio-media';

create function public.validate_editorial_project() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from unnest(new.tools) t where char_length(t)>25 or btrim(t)='') then raise exception 'Use up to 8 stack entries, each at most 25 characters.'; end if;
 if new.is_published then
   if new.cover_image_url='' or btrim(new.cover_alt)='' then raise exception 'Add a cover and alt text before publishing.'; end if;
   if (select count(*) from public.project_media where project_id=new.id and slot is not null) <> (case new.gallery_layout when 'mixed' then 5 else 6 end)
      or exists(select 1 from public.project_media where project_id=new.id and slot is not null and
        (slot >= case new.gallery_layout when 'mixed' then 5 else 6 end or
         layout <> case when new.gallery_layout='mixed' and slot<3 then 'portrait' else 'half' end))
   then raise exception 'Complete every Visual Board slot before publishing.'; end if;
 end if;
 return new;
end $$;
create trigger validate_editorial_project before insert or update on public.projects for each row execute function public.validate_editorial_project();

create function public.validate_homepage_projects() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from unnest(array[new.featured_project_id,new.secondary_one_id,new.secondary_two_id]) id
 where id is not null and not exists(select 1 from public.projects p where p.id=id and p.is_published)) then
 raise exception 'Only published projects can be assigned to the homepage.'; end if;
 return new;
end $$;
create trigger validate_homepage_projects before update on public.homepage_content for each row execute function public.validate_homepage_projects();

create function public.save_editorial_project(p_id uuid, p_details jsonb, p_cover_path text default null, p_cover_alt text default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare old_layout text; old_published boolean;
begin
 if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 select gallery_layout,is_published into old_layout,old_published from public.projects where id=p_id for update;
 if found then
   if old_layout <> p_details->>'gallery_layout' then
     if old_published then raise exception 'Unpublish before changing the gallery layout.'; end if;
     if old_layout='landscape' then
       -- First two landscape images move to the two compatible slots; others stay in the media library.
       update public.project_media set slot=case slot when 0 then 3 when 1 then 4 else null end where project_id=p_id and slot is not null;
     else
       update public.project_media set slot=case slot when 3 then 0 when 4 then 1 else null end where project_id=p_id and slot is not null;
     end if;
   end if;
   update public.projects set
     title=p_details->>'title',slug=p_details->>'slug',short_description=p_details->>'short_description',
     role=p_details->>'role',year=(p_details->>'year')::integer,tools=array(select jsonb_array_elements_text(p_details->'tools')),
     status=p_details->>'status',project_type=p_details->>'project_type',
     section_one_heading=p_details->>'section_one_heading',section_one_body=p_details->>'section_one_body',
     section_two_heading=p_details->>'section_two_heading',section_two_body=p_details->>'section_two_body',
     live_url=p_details->>'live_url',repository_url=p_details->>'repository_url',figma_url=p_details->>'figma_url',
     gallery_layout=p_details->>'gallery_layout',sort_order=(p_details->>'sort_order')::integer,
     cover_image_url=coalesce(p_cover_path,cover_image_url),cover_alt=coalesce(p_cover_alt,cover_alt)
   where id=p_id;
 else
   insert into public.projects(id,title,slug,short_description,role,year,tools,status,project_type,section_one_heading,section_one_body,section_two_heading,section_two_body,live_url,repository_url,figma_url,gallery_layout,sort_order,cover_image_url,cover_alt)
   values(p_id,p_details->>'title',p_details->>'slug',p_details->>'short_description',p_details->>'role',(p_details->>'year')::integer,array(select jsonb_array_elements_text(p_details->'tools')),p_details->>'status',p_details->>'project_type',p_details->>'section_one_heading',p_details->>'section_one_body',p_details->>'section_two_heading',p_details->>'section_two_body',p_details->>'live_url',p_details->>'repository_url',p_details->>'figma_url',p_details->>'gallery_layout',(p_details->>'sort_order')::integer,coalesce(p_cover_path,''),coalesce(p_cover_alt,''));
 end if;
 return p_id;
end $$;
-- A single transaction assigns/replaces/swaps images, retaining displaced media.
create function public.assign_gallery_image(p_project_id uuid,p_media_id uuid,p_slot integer)
returns void language plpgsql security invoker set search_path='' as $$
declare v_layout text; v_published boolean; v_old_slot integer; v_media_layout text; v_target uuid; v_expected text;
begin
 if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 select gallery_layout,is_published into v_layout,v_published from public.projects where id=p_project_id for update;
 if not found then raise exception 'Project not found'; end if;
 select slot,layout into v_old_slot,v_media_layout from public.project_media where id=p_media_id and project_id=p_project_id;
 if not found then raise exception 'Image not found'; end if;
 if p_slot is null then
   if v_published then raise exception 'Unpublish before removing a gallery image.'; end if;
   update public.project_media set slot=null where id=p_media_id;
   return;
 end if;
 if p_slot<0 or p_slot>=(case v_layout when 'mixed' then 5 else 6 end) then raise exception 'Invalid gallery slot'; end if;
 v_expected=case when v_layout='mixed' and p_slot<3 then 'portrait' else 'half' end;
 if v_media_layout<>v_expected then raise exception 'Choose a compatible image slot.'; end if;
 select id into v_target from public.project_media where project_id=p_project_id and slot=p_slot;
 update public.project_media set slot=v_old_slot where id=v_target;
 update public.project_media set slot=p_slot where id=p_media_id;
end $$;
revoke all on function public.save_editorial_project(uuid,jsonb,text,text),public.assign_gallery_image(uuid,uuid,integer),public.validate_editorial_project(),public.validate_homepage_projects() from public,anon,authenticated;
grant execute on function public.save_editorial_project(uuid,jsonb,text,text),public.assign_gallery_image(uuid,uuid,integer) to authenticated;
commit;
