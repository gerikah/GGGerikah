begin;

-- Keep all existing content. Only publish-ready projects require complete copy.
alter table public.projects drop constraint editorial_project_fields;
alter table public.projects add constraint editorial_project_fields check (
 char_length(title) between 1 and 45 and char_length(slug) between 1 and 60
 and char_length(short_description)<=100 and char_length(role)<=70
 and (year is null or year between 1900 and 2200)
 and status in ('Concept','In Progress','Completed')
 and project_type in ('Personal Project','Independent Concept','Academic Project','Client Work')
 and char_length(section_one_heading)<=40 and char_length(section_two_heading)<=40
 and char_length(section_one_body)<=400 and char_length(section_two_body)<=400
 and char_length(cover_alt)<=160 and cardinality(tools)<=8
 and (not is_published or (
 btrim(short_description)<>'' and btrim(role)<>'' and year is not null
 and btrim(section_one_heading)<>'' and btrim(section_two_heading)<>''
 and btrim(section_one_body)<>'' and btrim(section_two_body)<>''))
);

create table public.media_assets (
 id uuid primary key default gen_random_uuid(),
 storage_path text not null unique,
 filename text not null check(char_length(filename) between 1 and 255),
 content_type text not null,
 byte_size bigint not null check(byte_size>=0),
 width integer check(width>0), height integer check(height>0),
 sha256 text,
 alt_text text not null default '' check(char_length(alt_text)<=160),
 deleting boolean not null default false,
 created_at timestamptz not null default now()
);
create index media_assets_hash on public.media_assets(sha256);
alter table public.media_assets enable row level security;
revoke all on public.media_assets from public, anon, authenticated;
grant select, insert, update, delete on public.media_assets to authenticated;
create policy "Administrators manage media index" on public.media_assets for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

-- Index existing files without moving or deleting any Storage objects.
insert into public.media_assets(storage_path,filename,content_type,byte_size,created_at,alt_text)
select o.name, regexp_replace(o.name,'^.*/',''), coalesce(o.metadata->>'mimetype','application/octet-stream'),
coalesce((o.metadata->>'size')::bigint,0),o.created_at,
left(coalesce((select p.cover_alt from public.projects p where p.cover_image_url=o.name limit 1),
(select m.alt_text from public.project_media m where m.storage_path=o.name limit 1),
(select case when h.editorial_one_path=o.name then h.editorial_one_alt else h.editorial_two_alt end
 from public.homepage_content h where o.name in(h.editorial_one_path,h.editorial_two_path) limit 1),''),160)
from storage.objects o where bucket_id='portfolio-media'
on conflict(storage_path) do nothing;

create function public.media_is_referenced(p_path text) returns boolean
language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.projects where cover_image_url=p_path)
 or exists(select 1 from public.project_media where storage_path=p_path)
 or exists(select 1 from public.homepage_content where p_path in(editorial_one_path,editorial_two_path))
$$;
revoke all on function public.media_is_referenced(text) from public,anon;
grant execute on function public.media_is_referenced(text) to authenticated;

create function public.guard_media_index_delete() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if public.media_is_referenced(old.storage_path) then raise exception 'This image is still referenced by content.'; end if;
 return old;
end $$;
revoke all on function public.guard_media_index_delete() from public,anon,authenticated;
create trigger guard_media_index_delete before delete on public.media_assets for each row execute function public.guard_media_index_delete();

-- Reserve deletion before the Storage API call; new assignments lock the same row.
create function public.begin_media_delete(p_id uuid) returns text
language plpgsql security invoker set search_path='' as $$
declare v_path text;
begin
 if not public.is_admin() then raise exception 'Admin access required'; end if;
 select storage_path into v_path from public.media_assets where id=p_id for update;
 if not found then raise exception 'Image not found'; end if;
 if public.media_is_referenced(v_path) then raise exception 'This image is in use. Remove its assignments first.'; end if;
 update public.media_assets set deleting=true where id=p_id;
 return v_path;
end $$;
revoke all on function public.begin_media_delete(uuid) from public,anon;
grant execute on function public.begin_media_delete(uuid) to authenticated;

create function public.guard_media_assignment() returns trigger
language plpgsql security invoker set search_path='' as $$
declare v_paths text[]; v_path text; v_deleting boolean;
begin
 if tg_table_name='projects' then v_paths=array[new.cover_image_url];
 elsif tg_table_name='project_media' then v_paths=array[new.storage_path];
 else v_paths=array[new.editorial_one_path,new.editorial_two_path]; end if;
 foreach v_path in array v_paths loop
  select deleting into v_deleting from public.media_assets where storage_path=v_path for update;
  if found and v_deleting then raise exception 'This image is being removed. Choose another image.'; end if;
 end loop;
 return new;
end $$;
revoke all on function public.guard_media_assignment() from public,anon,authenticated;
create trigger guard_project_asset before insert or update of cover_image_url on public.projects for each row execute function public.guard_media_assignment();
create trigger guard_gallery_asset before insert or update of storage_path on public.project_media for each row execute function public.guard_media_assignment();
create trigger guard_homepage_asset before update of editorial_one_path,editorial_two_path on public.homepage_content for each row execute function public.guard_media_assignment();

drop policy "Admin delete portfolio images" on storage.objects;
create policy "Admin delete portfolio images" on storage.objects for delete to authenticated
using(bucket_id='portfolio-media' and (select public.is_admin()) and not public.media_is_referenced(name));

create function public.assign_library_image(p_asset_id uuid, p_target text, p_project_id uuid default null, p_slot integer default null, p_alt text default '', p_caption text default '') returns void
language plpgsql security invoker set search_path='' as $$
declare v_path text; v_layout text; v_media uuid;
begin
 if not public.is_admin() then raise exception 'Admin access required'; end if;
 -- Match the project editor's lock order.
 if p_project_id is not null then
  select gallery_layout into v_layout from public.projects where id=p_project_id for update;
  if not found then raise exception 'Project not found'; end if;
 end if;
 select storage_path into v_path from public.media_assets where id=p_asset_id and not deleting for update;
 if not found then raise exception 'Image unavailable'; end if;
 if btrim(p_alt)='' or char_length(p_alt)>160 or char_length(p_caption)>90 then raise exception 'Add alt text (1–160 characters) and a caption of at most 90 characters.'; end if;
 if p_target='cover' and p_project_id is not null then
  update public.projects set cover_image_url=v_path,cover_alt=p_alt where id=p_project_id;
 elsif p_target='gallery' and p_project_id is not null then
  if p_slot is null or p_slot<0 or p_slot>=(case when v_layout='mixed' then 5 else 6 end) then raise exception 'Choose a valid gallery slot'; end if;
  insert into public.project_media(project_id,storage_path,alt_text,caption,layout,sort_order)
  values(p_project_id,v_path,p_alt,p_caption,case when v_layout='mixed' and p_slot<3 then 'portrait' else 'half' end,p_slot) returning id into v_media;
  perform public.assign_gallery_image(p_project_id,v_media,p_slot);
 elsif p_target='homepage-one' then update public.homepage_content set editorial_one_path=v_path,editorial_one_alt=p_alt where id=1;
 elsif p_target='homepage-two' then update public.homepage_content set editorial_two_path=v_path,editorial_two_alt=p_alt where id=1;
 else raise exception 'Choose a supported image position'; end if;
end $$;
revoke all on function public.assign_library_image(uuid,text,uuid,integer,text,text) from public,anon;
grant execute on function public.assign_library_image(uuid,text,uuid,integer,text,text) to authenticated;

-- Replacements update references together; original files remain available.
create function public.replace_library_image(p_old uuid,p_new uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare v_old text; v_new text;
begin
 if not public.is_admin() then raise exception 'Admin access required'; end if;
 select storage_path into v_old from public.media_assets where id=p_old and not deleting;
 select storage_path into v_new from public.media_assets where id=p_new and not deleting;
 if v_old is null or v_new is null then raise exception 'Image unavailable'; end if;
 update public.projects set cover_image_url=v_new where cover_image_url=v_old;
 update public.project_media set storage_path=v_new where storage_path=v_old;
 update public.homepage_content set
 editorial_one_path=case when editorial_one_path=v_old then v_new else editorial_one_path end,
 editorial_two_path=case when editorial_two_path=v_old then v_new else editorial_two_path end
 where v_old in(editorial_one_path,editorial_two_path);
end $$;
revoke all on function public.replace_library_image(uuid,uuid) from public,anon;
grant execute on function public.replace_library_image(uuid,uuid) to authenticated;
commit;
