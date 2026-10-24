-- bot: change any record on the site, and undo it from Telegram

-- insert or replace one item (by id) in a list section, keeping its place
create or replace function public.vl_put(p_sec text, p_item jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.vl_sections(sec, body) values (p_sec, jsonb_build_object('items', jsonb_build_array(p_item)))
  on conflict (sec) do update
    set body = jsonb_set(public.vl_sections.body, '{items}',
      case when exists (select 1 from jsonb_array_elements(coalesce(public.vl_sections.body -> 'items', '[]'::jsonb)) x
                         where x ->> 'id' = p_item ->> 'id')
        then (select jsonb_agg(case when x ->> 'id' = p_item ->> 'id' then p_item else x end order by o)
                from jsonb_array_elements(public.vl_sections.body -> 'items') with ordinality t(x, o))
        else coalesce(public.vl_sections.body -> 'items', '[]'::jsonb) || jsonb_build_array(p_item)
      end),
        updated_at = now();
end;
$$;

-- set one key of an object section (settings, useful, meals); null removes the key
create or replace function public.vl_set(p_sec text, p_key text, p_value jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.vl_sections(sec, body)
    values (p_sec, case when p_value is null then '{}'::jsonb else jsonb_build_object(p_key, p_value) end)
  on conflict (sec) do update
    set body = case when p_value is null then public.vl_sections.body - p_key
                    else public.vl_sections.body || jsonb_build_object(p_key, p_value) end,
        updated_at = now();
end;
$$;

revoke all on function public.vl_put(text, jsonb) from public, anon, authenticated;
revoke all on function public.vl_set(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.vl_put(text, jsonb) to service_role;
grant execute on function public.vl_set(text, text, jsonb) to service_role;

-- what each "cancel" button in the chat puts back; only the bot (service role) uses it
create table public.vl_bot_undo (
  id uuid primary key default gen_random_uuid(),
  chat_id bigint not null,
  ops jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.vl_bot_undo enable row level security;
