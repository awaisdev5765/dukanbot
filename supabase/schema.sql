-- DukanBot Phase 1 schema — run in Supabase SQL Editor
-- Enable UUID extension if needed
create extension if not exists "pgcrypto";

-- Merchants (linked to auth.users)
create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null default '',
  category text check (category in ('boutique', 'restaurant', 'clinic', 'other')),
  whatsapp_number text,
  whatsapp_api_token text,
  business_hours jsonb default '{"open":"09:00","close":"21:00","days":["mon","tue","wed","thu","fri","sat"]}'::jsonb,
  delivery_areas text[] default '{}',
  welcome_message text default 'Assalam o Alaikum! Welcome to our shop. How can I help you today?',
  languages text[] default array['en','ur','roman_ur'],
  escalation_threshold int default 2,
  plan text default 'starter',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null default 0,
  description text,
  image_url text,
  stock_status text not null default 'in_stock' check (stock_status in ('in_stock', 'low', 'out_of_stock')),
  category text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  customer_name text,
  customer_phone text not null,
  items jsonb not null default '[]'::jsonb,
  total numeric(12,2) not null default 0,
  payment_method text check (payment_method in ('cod', 'jazzcash', 'easypaisa')),
  status text not null default 'new' check (status in ('new', 'confirmed', 'dispatched', 'delivered', 'cancelled')),
  courier text check (courier in ('leopards', 'tcs', null)),
  tracking_id text,
  conversation_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  customer_phone text not null,
  customer_name text,
  messages jsonb not null default '[]'::jsonb,
  status text not null default 'bot_handling' check (status in ('bot_handling', 'escalated', 'resolved')),
  unread_count int not null default 0,
  low_confidence_streak int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faq_entries (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  question text not null,
  answer text not null,
  language text not null default 'en' check (language in ('en', 'ur', 'roman_ur')),
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_products_merchant on public.products(merchant_id);
create index if not exists idx_orders_merchant on public.orders(merchant_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_conversations_merchant on public.conversations(merchant_id);
create index if not exists idx_faq_merchant on public.faq_entries(merchant_id);

-- RLS
alter table public.merchants enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.conversations enable row level security;
alter table public.faq_entries enable row level security;

create policy "merchants_own" on public.merchants
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "products_own" on public.products
  for all using (
    merchant_id in (select id from public.merchants where user_id = auth.uid())
  ) with check (
    merchant_id in (select id from public.merchants where user_id = auth.uid())
  );

create policy "orders_own" on public.orders
  for all using (
    merchant_id in (select id from public.merchants where user_id = auth.uid())
  ) with check (
    merchant_id in (select id from public.merchants where user_id = auth.uid())
  );

create policy "conversations_own" on public.conversations
  for all using (
    merchant_id in (select id from public.merchants where user_id = auth.uid())
  ) with check (
    merchant_id in (select id from public.merchants where user_id = auth.uid())
  );

create policy "faq_own" on public.faq_entries
  for all using (
    merchant_id in (select id from public.merchants where user_id = auth.uid())
  ) with check (
    merchant_id in (select id from public.merchants where user_id = auth.uid())
  );

-- Auto-create merchant row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.merchants (user_id, business_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'business_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
