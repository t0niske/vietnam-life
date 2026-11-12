-- the messages of the two pinned panel widgets in each chat (o: «Финансы», t: «Сегодня»), so the bot can keep them up to date
alter table public.vl_bot_chat add column if not exists panels jsonb;
