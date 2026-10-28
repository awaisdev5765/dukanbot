-- P1: team, notifications, WA send log, storage, retention
-- Safe to re-run (idempotent). Run after p0_market.sql

-- Notification prefs on merchants
alter table public.merchants
  add column if not exists notification_prefs jsonb
    default '{"new_order":true,"escalation":true,"daily_summary":false,"email":true,"whatsapp":true}'::jsonb,
  add column if not exists notify_email text,
  add column if not exists notify_whatsapp_number text,
  add column if not exists onboarding_completed boolean default false,
  add column if not exists is_platform_admin boolean default false;

-- Team members / invites
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  email text not null,
  role text not null default 'staff' check (role in ('owner', 'admin', 'staff')),
  status text not null default 'pending' check (status in ('pending', 'active')),
  invite_token text unique,
  user_id uuid references auth.users(id) on delete set null,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index if not exists idx_team_merchant_email
  on public.team_members (merchant_id, lower(email));

create index if not exists idx_team_token on public.team_members (invite_token)
  where invite_token is not null;

alter table public.team_members enable row level security;

drop policy if exists "team_select_own" on public.team_members;
create policy "team_select_own"
  on public.team_members for select
  using (
    merchant_id in (select id from public.merchants where user_id = auth.uid())
    or user_id = auth.uid()
  );

drop policy if exists "team_insert_owner" on public.team_members;
create policy "team_insert_owner"
  on public.team_members for insert
  with check (
    merchant_id in (select id from public.merchants where user_id = auth.uid())
  );

drop policy if exists "team_update_owner" on public.team_members;
create policy "team_update_owner"
  on public.team_members for update
  using (
    merchant_id in (select id from public.merchants where user_id = auth.uid())
    or user_id = auth.uid()
    or (
      status = 'pending'
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists "team_select_pending_token" on public.team_members;
create policy "team_select_pending_token"
  on public.team_members for select
  using (status = 'pending' and invite_token is not null);

drop policy if exists "team_delete_owner" on public.team_members;
create policy "team_delete_owner"
  on public.team_members for delete
  using (
    merchant_id in (select id from public.merchants where user_id = auth.uid())
  );

-- WhatsApp send audit log
create table if not exists public.wa_send_log (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references public.merchants(id) on delete set null,
  to_phone text,
  body_preview text,
  ok boolean not null default false,
  skipped boolean not null default false,
  error jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_wa_send_log_created on public.wa_send_log (created_at desc);
create index if not exists idx_wa_send_log_ok on public.wa_send_log (ok, created_at desc);

alter table public.wa_send_log enable row level security;

drop policy if exists "wa_log_admin_or_owner" on public.wa_send_log;
create policy "wa_log_admin_or_owner"
  on public.wa_send_log for select
  using (
    merchant_id in (select id from public.merchants where user_id = auth.uid())
    or exists (
      select 1 from public.merchants m
      where m.user_id = auth.uid() and m.is_platform_admin = true
    )
  );

-- Notification delivery log
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  kind text not null,
  channel text not null,
  payload jsonb default '{}'::jsonb,
  ok boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_notif_log_merchant on public.notification_log (merchant_id, created_at desc);

alter table public.notification_log enable row level security;

drop policy if exists "notif_log_own" on public.notification_log;
create policy "notif_log_own"
  on public.notification_log for select
  using (
    merchant_id in (select id from public.merchants where user_id = auth.uid())
  );

-- Retention: purge conversation message bodies older than N days (keep order metadata)
create or replace function public.purge_old_chat_payloads(p_days int default 365)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  update public.conversations
  set messages = '[]'::jsonb
  where updated_at < now() - make_interval(days => p_days)
    and jsonb_array_length(coalesce(messages, '[]'::jsonb)) > 0;
  get diagnostics n = row_count;
  delete from public.wa_send_log
  where created_at < now() - make_interval(days => greatest(p_days, 90));
  delete from public.notification_log
  where created_at < now() - make_interval(days => greatest(p_days, 90));
  return n;
end;
$$;

grant execute on function public.purge_old_chat_payloads(int) to service_role;

-- Team members can read/write shop data for merchants they belong to
create or replace function public.user_merchant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.merchants where user_id = auth.uid()
  union
  select merchant_id from public.team_members
  where user_id = auth.uid() and status = 'active';
$$;

drop policy if exists "merchants_team_select" on public.merchants;
create policy "merchants_team_select" on public.merchants
  for select using (id in (select public.user_merchant_ids()));

drop policy if exists "products_team" on public.products;
create policy "products_team" on public.products
  for all using (merchant_id in (select public.user_merchant_ids()))
  with check (merchant_id in (select public.user_merchant_ids()));

drop policy if exists "orders_team" on public.orders;
create policy "orders_team" on public.orders
  for all using (merchant_id in (select public.user_merchant_ids()))
  with check (merchant_id in (select public.user_merchant_ids()));

drop policy if exists "conversations_team" on public.conversations;
create policy "conversations_team" on public.conversations
  for all using (merchant_id in (select public.user_merchant_ids()))
  with check (merchant_id in (select public.user_merchant_ids()));

-- Storage bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "product_images_auth_upload" on storage.objects;
create policy "product_images_auth_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
  );

drop policy if exists "product_images_auth_update" on storage.objects;
create policy "product_images_auth_update"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
  );

drop policy if exists "product_images_auth_delete" on storage.objects;
create policy "product_images_auth_delete"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
  );
