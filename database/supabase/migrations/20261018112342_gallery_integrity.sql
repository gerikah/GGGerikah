begin;
drop policy "Read published project media" on public.project_media;
create policy "Read published project media" on public.project_media for select to anon, authenticated using(
 slot is not null and exists(select 1 from public.projects p where p.id=project_id and p.is_published)
);
drop policy "Read published portfolio images" on storage.objects;
create policy "Read published portfolio images" on storage.objects for select to anon,authenticated using(
 bucket_id='portfolio-media' and (
 exists(select 1 from public.projects p where p.is_published and p.cover_image_url=storage.objects.name)
 or exists(select 1 from public.project_media m join public.projects p on p.id=m.project_id where p.is_published and m.slot is not null and m.storage_path=storage.objects.name)
 )
);
create function public.check_gallery_integrity() returns trigger language plpgsql security invoker set search_path='' as $$
declare p public.projects; target uuid;
begin
 target=case when tg_op='DELETE' then old.project_id else new.project_id end;
 select * into p from public.projects where id=target;
 if found and p.is_published then
   if (select count(*) from public.project_media m where m.project_id=target and m.slot is not null) <> (case p.gallery_layout when 'mixed' then 5 else 6 end)
   or exists(select 1 from public.project_media m where m.project_id=target and m.slot is not null and (m.slot>=(case p.gallery_layout when 'mixed' then 5 else 6 end) or m.layout<>(case when p.gallery_layout='mixed' and m.slot<3 then 'portrait' else 'half' end)))
   then raise exception 'Unpublish before removing a gallery slot or changing its orientation.'; end if;
 end if;
 return null;
end $$;
create constraint trigger gallery_integrity after insert or update or delete on public.project_media deferrable initially deferred for each row execute function public.check_gallery_integrity();
create function public.clear_unpublished_homepage() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if old.is_published and not new.is_published then
 update public.homepage_content set
 featured_project_id=case when featured_project_id=new.id then null else featured_project_id end,
 secondary_one_id=case when secondary_one_id=new.id then null else secondary_one_id end,
 secondary_two_id=case when secondary_two_id=new.id then null else secondary_two_id end
 where new.id in (featured_project_id,secondary_one_id,secondary_two_id);
 end if;
 return new;
end $$;
create trigger clear_unpublished_homepage after update of is_published on public.projects for each row execute function public.clear_unpublished_homepage();
revoke all on function public.check_gallery_integrity(),public.clear_unpublished_homepage() from public,anon,authenticated;
commit;
