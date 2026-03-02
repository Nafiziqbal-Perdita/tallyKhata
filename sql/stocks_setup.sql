-- Stocks table setup (compatible with existing businesses_setup.sql style)
-- Run this in Supabase SQL editor after businesses_setup.sql.

-- 1) Ensure UUID generator is available
create extension if not exists pgcrypto;

-- 2) Create table
create table if not exists public.stocks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  unit text not null,
  sku text,
  cost_per_unit numeric(12, 2) not null default 0,
  total_cost numeric(14, 2) not null default 0,
  total_sold numeric(14, 2) not null default 0,
  purchase_price numeric(12, 2) not null default 0,
  sale_price numeric(12, 2) not null default 0,
  opening_stock numeric(14, 3) not null default 0,
  low_stock_threshold numeric(14, 3) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stocks_name_not_blank check (char_length(trim(name)) > 0),
  constraint stocks_unit_not_blank check (char_length(trim(unit)) > 0),
  constraint stocks_cost_per_unit_non_negative check (cost_per_unit >= 0),
  constraint stocks_total_cost_non_negative check (total_cost >= 0),
  constraint stocks_total_sold_non_negative check (total_sold >= 0),
  constraint stocks_purchase_price_non_negative check (purchase_price >= 0),
  constraint stocks_sale_price_non_negative check (sale_price >= 0),
  constraint stocks_opening_stock_non_negative check (opening_stock >= 0),
  constraint stocks_low_stock_threshold_non_negative check (low_stock_threshold >= 0)
);

-- 3) Bring existing table shape in sync if it already existed
alter table public.stocks add column if not exists user_id text;
alter table public.stocks add column if not exists business_id uuid references public.businesses(id) on delete cascade;
alter table public.stocks add column if not exists name text;
alter table public.stocks add column if not exists unit text;
alter table public.stocks add column if not exists sku text;
alter table public.stocks add column if not exists cost_per_unit numeric(12, 2) default 0;
alter table public.stocks add column if not exists total_cost numeric(14, 2) default 0;
alter table public.stocks add column if not exists total_sold numeric(14, 2) default 0;
alter table public.stocks add column if not exists purchase_price numeric(12, 2) default 0;
alter table public.stocks add column if not exists sale_price numeric(12, 2) default 0;
alter table public.stocks add column if not exists opening_stock numeric(14, 3) default 0;
alter table public.stocks add column if not exists low_stock_threshold numeric(14, 3) default 0;
alter table public.stocks add column if not exists is_active boolean default true;
alter table public.stocks add column if not exists created_at timestamptz default now();
alter table public.stocks add column if not exists updated_at timestamptz default now();

-- Ensure required ownership/base fields exist before enforcing NOT NULL constraints
delete from public.stocks
where user_id is null
  or business_id is null
  or name is null
  or unit is null;

update public.stocks
set is_active = true
where is_active is null;

update public.stocks
set purchase_price = 0
where purchase_price is null;

update public.stocks
set cost_per_unit = 0
where cost_per_unit is null;

update public.stocks
set total_cost = 0
where total_cost is null;

update public.stocks
set total_sold = 0
where total_sold is null;

update public.stocks
set sale_price = 0
where sale_price is null;

update public.stocks
set opening_stock = 0
where opening_stock is null;

update public.stocks
set low_stock_threshold = 0
where low_stock_threshold is null;

update public.stocks
set created_at = now()
where created_at is null;

update public.stocks
set updated_at = now()
where updated_at is null;

alter table public.stocks
  alter column user_id set not null,
  alter column business_id set not null,
  alter column name set not null,
  alter column unit set not null,
  alter column cost_per_unit set not null,
  alter column cost_per_unit set default 0,
  alter column total_cost set not null,
  alter column total_cost set default 0,
  alter column total_sold set not null,
  alter column total_sold set default 0,
  alter column purchase_price set not null,
  alter column purchase_price set default 0,
  alter column sale_price set not null,
  alter column sale_price set default 0,
  alter column opening_stock set not null,
  alter column opening_stock set default 0,
  alter column low_stock_threshold set not null,
  alter column low_stock_threshold set default 0,
  alter column is_active set not null,
  alter column is_active set default true,
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();

-- 4) Keep setup simple and aligned with current project SQL style
alter table public.stocks disable row level security;

grant usage on schema public to anon, authenticated;
grant select on table public.stocks to anon;
grant select, insert, update, delete on table public.stocks to authenticated;

-- 5) Helpful indexes
create index if not exists stocks_user_id_idx on public.stocks (user_id);
create index if not exists stocks_business_id_idx on public.stocks (business_id);
create index if not exists stocks_business_name_idx on public.stocks (business_id, lower(name));

-- 6) Avoid duplicate active stock names under the same business
create unique index if not exists stocks_business_name_unique_idx
  on public.stocks (business_id, lower(name))
  where is_active = true;

-- 7) updated_at maintenance trigger (reuse if already exists)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_stocks_set_updated_at on public.stocks;
create trigger trg_stocks_set_updated_at
before update on public.stocks
for each row execute function public.set_updated_at();
