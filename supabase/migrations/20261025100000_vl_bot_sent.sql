-- bot: scheduled messages already sent (reminders, daily/weekly/monthly reports), so each goes out once
create table public.vl_bot_sent (
  key text primary key,
  sent_at timestamptz not null default now()
);
alter table public.vl_bot_sent enable row level security;
