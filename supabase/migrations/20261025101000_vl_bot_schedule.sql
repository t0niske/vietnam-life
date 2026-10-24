-- bot: every 15 minutes the database knocks on the bot so it can send reminders and reports on time;
-- the secret is read from Vault at run time, so it is not stored in the job itself
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('vl-bot-tick', '*/15 * * * *', $job$
  select net.http_post(
    url := 'https://rdaupsnobthvisqgwpuy.supabase.co/functions/v1/telegram-bot',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-vl-cron', (select decrypted_secret from vault.decrypted_secrets where name = 'telegram_webhook_secret')),
    body := '{}'::jsonb)
$job$);
