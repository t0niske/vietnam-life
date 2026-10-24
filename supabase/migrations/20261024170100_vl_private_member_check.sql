-- membership check moved out of the API-exposed schema
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.vl_is_member()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.vl_members m
    where lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function private.vl_is_member() from public, anon;
grant execute on function private.vl_is_member() to authenticated;

drop policy "members read sections" on public.vl_sections;
drop policy "members insert sections" on public.vl_sections;
drop policy "members update sections" on public.vl_sections;
create policy "members read sections" on public.vl_sections
  for select to authenticated using ((select private.vl_is_member()));
create policy "members insert sections" on public.vl_sections
  for insert to authenticated with check ((select private.vl_is_member()));
create policy "members update sections" on public.vl_sections
  for update to authenticated using ((select private.vl_is_member())) with check ((select private.vl_is_member()));

drop function public.vl_is_member();
