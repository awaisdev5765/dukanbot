-- Run in Supabase SQL Editor once — allows webhook to persist without user JWT
create or replace function public.bot_upsert_conversation(
  p_merchant_id uuid,
  p_phone text,
  p_name text,
  p_messages jsonb,
  p_status text,
  p_unread int,
  p_streak int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from public.conversations
  where merchant_id = p_merchant_id and customer_phone = p_phone
  limit 1;

  if v_id is null then
    insert into public.conversations (
      merchant_id, customer_phone, customer_name, messages, status, unread_count, low_confidence_streak, updated_at
    ) values (
      p_merchant_id, p_phone, p_name, p_messages, p_status, p_unread, p_streak, now()
    )
    returning id into v_id;
  else
    update public.conversations set
      customer_name = coalesce(p_name, customer_name),
      messages = p_messages,
      status = p_status,
      unread_count = p_unread,
      low_confidence_streak = p_streak,
      updated_at = now()
    where id = v_id;
  end if;

  return v_id;
end;
$$;

create or replace function public.bot_insert_order(
  p_merchant_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_items jsonb,
  p_total numeric,
  p_payment_method text,
  p_conversation_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.orders (
    merchant_id, customer_name, customer_phone, items, total, payment_method, status, conversation_id
  ) values (
    p_merchant_id, p_customer_name, p_customer_phone, p_items, p_total, p_payment_method, 'new', p_conversation_id
  )
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.bot_upsert_conversation(uuid, text, text, jsonb, text, int, int) to anon, authenticated, service_role;
grant execute on function public.bot_insert_order(uuid, text, text, jsonb, numeric, text, uuid) to anon, authenticated, service_role;
