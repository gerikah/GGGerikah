begin;

alter table public.capabilities
  drop constraint capabilities_kind_check,
  add constraint capabilities_kind_check check (kind in ('capability', 'process', 'tool')),
  add column logo_key text not null default '' check (logo_key in (
    '', 'figma', 'javascript', 'html5', 'css3', 'react', 'nextjs', 'typescript',
    'nodejs', 'supabase', 'postgresql', 'git', 'vercel'
  )),
  add column proficiency_level smallint check (proficiency_level between 1 and 5);

alter table public.homepage_content
  add column secondary_three_id uuid references public.projects on delete set null;

alter table public.homepage_content
  add constraint homepage_projects_distinct check (
    (featured_project_id is null or secondary_one_id is null or featured_project_id <> secondary_one_id)
    and (featured_project_id is null or secondary_two_id is null or featured_project_id <> secondary_two_id)
    and (featured_project_id is null or secondary_three_id is null or featured_project_id <> secondary_three_id)
    and (secondary_one_id is null or secondary_two_id is null or secondary_one_id <> secondary_two_id)
    and (secondary_one_id is null or secondary_three_id is null or secondary_one_id <> secondary_three_id)
    and (secondary_two_id is null or secondary_three_id is null or secondary_two_id <> secondary_three_id)
  );

create or replace function public.validate_homepage_projects()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from unnest(array[
   new.featured_project_id, new.secondary_one_id, new.secondary_two_id, new.secondary_three_id
 ]) id where id is not null and not exists(
   select 1 from public.projects p where p.id=id and p.is_published
 )) then
   raise exception 'Only published projects can be assigned to the homepage.';
 end if;
 return new;
end $$;

create or replace function public.clear_unpublished_homepage()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if old.is_published and not new.is_published then
   update public.homepage_content set
     featured_project_id=case when featured_project_id=new.id then null else featured_project_id end,
     secondary_one_id=case when secondary_one_id=new.id then null else secondary_one_id end,
     secondary_two_id=case when secondary_two_id=new.id then null else secondary_two_id end,
     secondary_three_id=case when secondary_three_id=new.id then null else secondary_three_id end
   where new.id in (featured_project_id,secondary_one_id,secondary_two_id,secondary_three_id);
 end if;
 return new;
end $$;

commit;
