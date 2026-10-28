-- Run once in Supabase SQL Editor
alter table public.merchants
  add column if not exists whatsapp_phone_number_id text,
  add column if not exists whatsapp_verify_token text default 'dukanbot_verify',
  add column if not exists whatsapp_waba_id text;

-- Webhook can load creds without a user JWT
create or replace function public.bot_get_whatsapp_creds()
returns table (
  whatsapp_api_token text,
  whatsapp_phone_number_id text,
  whatsapp_verify_token text
)
language sql
security definer
set search_path = public
as $$
  select
    whatsapp_api_token,
    whatsapp_phone_number_id,
    coalesce(whatsapp_verify_token, 'dukanbot_verify')
  from public.merchants
  where whatsapp_api_token is not null
    and whatsapp_phone_number_id is not null
  order by created_at asc
  limit 1;
$$;

grant execute on function public.bot_get_whatsapp_creds() to anon, authenticated, service_role;
