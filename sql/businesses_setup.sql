-- Simple businesses table setup for development (no RLS policies)
-- Run this in Supabase SQL editor.

-- 1) Ensure UUID generator is available
create extension if not exists pgcrypto;

-- 2) Create table
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null default 'My Shop',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Bring existing table shape in sync if it already existed
alter table public.businesses add column if not exists user_id text;
alter table public.businesses add column if not exists name text;
alter table public.businesses add column if not exists created_at timestamptz default now();
alter table public.businesses add column if not exists updated_at timestamptz default now();

update public.businesses
set name = 'My Shop'
where name is null;

-- Remove rows that cannot satisfy NOT NULL user_id.
delete from public.businesses
where user_id is null;

update public.businesses
set created_at = now()
where created_at is null;

update public.businesses
set updated_at = now()
where updated_at is null;

alter table public.businesses
  alter column user_id set not null,
  alter column name set not null,
  alter column name set default 'My Shop',
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();

-- 4) Explicitly disable RLS for simple setup (NOT for production)
alter table public.businesses disable row level security;

-- 5) Grant access to client roles (required when using anon key)
grant usage on schema public to anon, authenticated;
grant select on table public.businesses to anon;
grant select, insert, update, delete on table public.businesses to authenticated;

-- 6) Optional cleanup from previous RLS experiments
drop policy if exists "Business owner only" on public.businesses;
drop policy if exists "Business select own" on public.businesses;
drop policy if exists "Business insert own" on public.businesses;
drop policy if exists "Business update own" on public.businesses;
drop policy if exists "Business delete own" on public.businesses;

-- 7) Remove duplicate rows (keep newest) before creating unique index
with ranked as (
  select
    id,
    row_number() over (
      partition by user_id
      order by created_at desc nulls last, id desc
    ) as rn
  from public.businesses
)
delete from public.businesses b
using ranked r
where b.id = r.id and r.rn > 1;

-- 8) Enforce one business per user (matches current app behavior)
create unique index if not exists businesses_user_id_unique_idx
  on public.businesses (user_id);

-- 9) Keep updated_at current on updates
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_businesses_set_updated_at on public.businesses;
create trigger trg_businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();
