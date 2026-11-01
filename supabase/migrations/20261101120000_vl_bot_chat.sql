-- bot: an ongoing conversation per chat (the nutrition interview), so the bot remembers what it asked
create table public.vl_bot_chat (
  chat_id bigint primary key,
  mode text not null,
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.vl_bot_chat enable row level security;
