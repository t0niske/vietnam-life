-- bot: remembers the last turns of every chat (not only the nutrition interview), and who each linked person is
alter table public.vl_bot_chat alter column mode set default 'chat';
alter table public.vl_bot_chat add column if not exists convo jsonb not null default '[]'::jsonb;
alter table public.vl_tg_links add column if not exists name text;
