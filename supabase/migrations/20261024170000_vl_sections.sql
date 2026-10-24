-- Vietnam Life: shared household data, one row per site section (expenses, events, notes...).
-- Only emails listed in vl_members can sign up, read or write.

create table public.vl_members (
  email text primary key,
  created_at timestamptz not null default now()
);

create table public.vl_sections (
  sec text primary key,
  body jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.vl_members enable row level security;
alter table public.vl_sections enable row level security;

create or replace function public.vl_is_member()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.vl_members m
    where lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.vl_is_member() from public, anon;
grant execute on function public.vl_is_member() to authenticated;

create policy "members see own membership" on public.vl_members
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

create policy "members read sections" on public.vl_sections
  for select to authenticated using ((select public.vl_is_member()));
create policy "members insert sections" on public.vl_sections
  for insert to authenticated with check ((select public.vl_is_member()));
create policy "members update sections" on public.vl_sections
  for update to authenticated using ((select public.vl_is_member())) with check ((select public.vl_is_member()));

create or replace function public.vl_touch()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;
create trigger vl_sections_touch before insert or update on public.vl_sections
  for each row execute function public.vl_touch();

-- closed sign-up: only allowlisted emails can create an account
create or replace function public.vl_signup_guard()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.vl_members m where lower(m.email) = lower(new.email)) then
    raise exception 'Регистрация закрыта: этого адреса нет в списке участников';
  end if;
  return new;
end;
$$;
revoke all on function public.vl_signup_guard() from public, anon, authenticated;
create trigger vl_signup_guard before insert on auth.users
  for each row execute function public.vl_signup_guard();

-- live updates on the site when the Telegram bot adds something
alter publication supabase_realtime add table public.vl_sections;
