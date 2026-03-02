-- Customer/Supplier table setup (compatible with existing setup style)
-- Run this in Supabase SQL editor after businesses_setup.sql.

create extension if not exists pgcrypto;

create table if not exists public.customer_suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  business_id uuid not null references public.businesses(id) on delete cascade,
  party_type text not null,
  name text not null,
  phone text not null,
  total_payable numeric(14, 2) not null default 0,
  total_receivable numeric(14, 2) not null default 0,
  description text,
  record_date date not null default current_date,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_suppliers_party_type_valid check (party_type in ('customer', 'supplier')),
  constraint customer_suppliers_name_not_blank check (char_length(trim(name)) > 0),
  constraint customer_suppliers_phone_not_blank check (char_length(trim(phone)) > 0),
  constraint customer_suppliers_total_payable_non_negative check (total_payable >= 0),
  constraint customer_suppliers_total_receivable_non_negative check (total_receivable >= 0)
);

alter table public.customer_suppliers add column if not exists user_id text;
alter table public.customer_suppliers add column if not exists business_id uuid references public.businesses(id) on delete cascade;
alter table public.customer_suppliers add column if not exists party_type text;
alter table public.customer_suppliers add column if not exists name text;
alter table public.customer_suppliers add column if not exists phone text;
alter table public.customer_suppliers add column if not exists total_payable numeric(14, 2) default 0;
alter table public.customer_suppliers add column if not exists total_receivable numeric(14, 2) default 0;
alter table public.customer_suppliers add column if not exists description text;
alter table public.customer_suppliers add column if not exists record_date date default current_date;
alter table public.customer_suppliers add column if not exists avatar_url text;
alter table public.customer_suppliers add column if not exists is_active boolean default true;
alter table public.customer_suppliers add column if not exists created_at timestamptz default now();
alter table public.customer_suppliers add column if not exists updated_at timestamptz default now();

-- Ensure required fields exist before NOT NULL enforcement
delete from public.customer_suppliers
where user_id is null
   or business_id is null
   or party_type is null
   or name is null
   or phone is null;

update public.customer_suppliers
set is_active = true
where is_active is null;

update public.customer_suppliers
set total_payable = 0
where total_payable is null;

update public.customer_suppliers
set total_receivable = 0
where total_receivable is null;

update public.customer_suppliers
set record_date = current_date
where record_date is null;

update public.customer_suppliers
set created_at = now()
where created_at is null;

update public.customer_suppliers
set updated_at = now()
where updated_at is null;

alter table public.customer_suppliers
  alter column user_id set not null,
  alter column business_id set not null,
  alter column party_type set not null,
  alter column name set not null,
  alter column phone set not null,
  alter column total_payable set not null,
  alter column total_payable set default 0,
  alter column total_receivable set not null,
  alter column total_receivable set default 0,
  alter column record_date set not null,
  alter column record_date set default current_date,
  alter column is_active set not null,
  alter column is_active set default true,
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();

alter table public.customer_suppliers disable row level security;

grant usage on schema public to anon, authenticated;
grant select on table public.customer_suppliers to anon;
grant select, insert, update, delete on table public.customer_suppliers to authenticated;

create index if not exists customer_suppliers_user_id_idx
  on public.customer_suppliers (user_id);

create index if not exists customer_suppliers_business_id_idx
  on public.customer_suppliers (business_id);

create index if not exists customer_suppliers_business_type_idx
  on public.customer_suppliers (business_id, party_type);

create unique index if not exists customer_suppliers_business_phone_unique_idx
  on public.customer_suppliers (business_id, phone)
  where is_active = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_customer_suppliers_set_updated_at on public.customer_suppliers;
create trigger trg_customer_suppliers_set_updated_at
before update on public.customer_suppliers
for each row execute function public.set_updated_at();
