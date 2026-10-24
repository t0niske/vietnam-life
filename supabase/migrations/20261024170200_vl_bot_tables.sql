-- Telegram bot: chats linked to a member, one-time link codes, secret lookup for the edge function
create table public.vl_tg_links (
  chat_id bigint primary key,
  email text not null references public.vl_members(email) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.vl_tg_codes (
  code text primary key,
  email text not null,
  expires_at timestamptz not null default now() + interval '15 minutes'
);
alter table public.vl_tg_links enable row level security;
alter table public.vl_tg_codes enable row level security;

create policy "members see own telegram links" on public.vl_tg_links
  for select to authenticated using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
create policy "members create own link codes" on public.vl_tg_codes
  for insert to authenticated
  with check ((select private.vl_is_member()) and lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- secrets for the bot live in Vault; only the service role (edge function) can read them
create or replace function public.vl_secret(p_name text)
returns text language sql stable security definer set search_path = ''
as $$ select decrypted_secret from vault.decrypted_secrets where name = p_name limit 1 $$;
revoke all on function public.vl_secret(text) from public, anon, authenticated;
grant execute on function public.vl_secret(text) to service_role;

-- atomic append/remove used by the bot, so it never overwrites a whole section
create or replace function public.vl_append(p_sec text, p_item jsonb, p_front boolean default false)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.vl_sections(sec, body) values (p_sec, jsonb_build_object('items', jsonb_build_array(p_item)))
  on conflict (sec) do update
    set body = jsonb_set(public.vl_sections.body, '{items}',
      case when p_front
        then jsonb_build_array(p_item) || coalesce(public.vl_sections.body -> 'items', '[]'::jsonb)
        else coalesce(public.vl_sections.body -> 'items', '[]'::jsonb) || jsonb_build_array(p_item)
      end);
end;
$$;
create or replace function public.vl_remove(p_sec text, p_id text)
returns void language sql security definer set search_path = ''
as $$
  update public.vl_sections
     set body = jsonb_set(body, '{items}', coalesce((select jsonb_agg(x) from jsonb_array_elements(body -> 'items') x where x ->> 'id' <> p_id), '[]'::jsonb))
   where sec = p_sec;
$$;
revoke all on function public.vl_append(text, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.vl_remove(text, text) from public, anon, authenticated;
grant execute on function public.vl_append(text, jsonb, boolean) to service_role;
grant execute on function public.vl_remove(text, text) to service_role;

-- secrets are added once, outside the repo:
--   select vault.create_secret('<token>', 'telegram_bot_token');
--   select vault.create_secret('<random>', 'telegram_webhook_secret');
--   select vault.create_secret('<key>', 'anthropic_api_key');
--   select vault.create_secret('<key>', 'groq_api_key');   -- or openai_api_key
