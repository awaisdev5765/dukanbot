-- P0: multi-tenant WhatsApp + bot config on merchants
-- Run in Supabase SQL Editor

alter table public.merchants
  add column if not exists whatsapp_phone_number_id text,
  add column if not exists whatsapp_verify_token text default 'dukanbot_verify',
  add column if not exists whatsapp_waba_id text,
  add column if not exists bot_welcome_message text,
  add column if not exists bot_languages text[] default array['en','ur','roman_ur'],
  add column if not exists bot_escalation_threshold int default 2,
  add column if not exists bot_notify_whatsapp boolean default true,
  add column if not exists bot_faqs jsonb default '[]'::jsonb;

create unique index if not exists idx_merchants_wa_phone_id
  on public.merchants (whatsapp_phone_number_id)
  where whatsapp_phone_number_id is not null;

-- Resolve merchant by Meta phone_number_id (webhook)
create or replace function public.bot_resolve_merchant(p_phone_number_id text)
returns table (
  id uuid,
  business_name text,
  whatsapp_api_token text,
  whatsapp_phone_number_id text,
  whatsapp_verify_token text,
  bot_welcome_message text,
  bot_languages text[],
  bot_escalation_threshold int,
  bot_notify_whatsapp boolean,
  bot_faqs jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    m.id,
    m.business_name,
    m.whatsapp_api_token,
    m.whatsapp_phone_number_id,
    coalesce(m.whatsapp_verify_token, 'dukanbot_verify'),
    coalesce(m.bot_welcome_message, m.welcome_message),
    coalesce(m.bot_languages, array['en','ur','roman_ur']),
    coalesce(m.bot_escalation_threshold, 2),
    coalesce(m.bot_notify_whatsapp, true),
    coalesce(m.bot_faqs, '[]'::jsonb)
  from public.merchants m
  where m.whatsapp_phone_number_id = p_phone_number_id
  limit 1;
$$;

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

grant execute on function public.bot_resolve_merchant(text) to anon, authenticated, service_role;
grant execute on function public.bot_get_whatsapp_creds() to anon, authenticated, service_role;
grant execute on function public.bot_upsert_conversation(uuid, text, text, jsonb, text, int, int) to anon, authenticated, service_role;
grant execute on function public.bot_insert_order(uuid, text, text, jsonb, numeric, text, uuid) to anon, authenticated, service_role;
