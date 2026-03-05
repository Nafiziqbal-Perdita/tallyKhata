-- Cashbook table + helper functions setup
-- Run this in Supabase SQL editor after businesses_setup.sql.

create extension if not exists pgcrypto;

create table if not exists public.cashbook_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind text not null,
  direction text not null,
  title text not null,
  amount numeric(14, 2) not null,
  note text,
  image_url text,
  entry_date date not null default current_date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cashbook_entries_kind_valid check (
    kind in ('cash_sale', 'cash_buy', 'expense', 'owner_gave', 'owner_took')
  ),
  constraint cashbook_entries_direction_valid check (direction in ('in', 'out')),
  constraint cashbook_entries_amount_positive check (amount > 0),
  constraint cashbook_entries_title_not_blank check (char_length(trim(title)) > 0),
  constraint cashbook_entries_kind_direction_consistent check (
    (kind = 'cash_sale' and direction = 'in') or
    (kind = 'cash_buy' and direction = 'out') or
    (kind = 'expense' and direction = 'out') or
    (kind = 'owner_gave' and direction = 'in') or
    (kind = 'owner_took' and direction = 'out')
  )
);

alter table public.cashbook_entries add column if not exists user_id text;
alter table public.cashbook_entries add column if not exists business_id uuid references public.businesses(id) on delete cascade;
alter table public.cashbook_entries add column if not exists kind text;
alter table public.cashbook_entries add column if not exists direction text;
alter table public.cashbook_entries add column if not exists title text;
alter table public.cashbook_entries add column if not exists amount numeric(14, 2);
alter table public.cashbook_entries add column if not exists note text;
alter table public.cashbook_entries add column if not exists image_url text;
alter table public.cashbook_entries add column if not exists entry_date date default current_date;
alter table public.cashbook_entries add column if not exists is_active boolean default true;
alter table public.cashbook_entries add column if not exists created_at timestamptz default now();
alter table public.cashbook_entries add column if not exists updated_at timestamptz default now();

update public.cashbook_entries
set is_active = true
where is_active is null;

update public.cashbook_entries
set created_at = now()
where created_at is null;

update public.cashbook_entries
set updated_at = now()
where updated_at is null;

alter table public.cashbook_entries
  alter column user_id set not null,
  alter column business_id set not null,
  alter column kind set not null,
  alter column direction set not null,
  alter column title set not null,
  alter column amount set not null,
  alter column entry_date set not null,
  alter column entry_date set default current_date,
  alter column is_active set not null,
  alter column is_active set default true,
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();

alter table public.cashbook_entries disable row level security;

grant usage on schema public to anon, authenticated;
grant select on table public.cashbook_entries to anon;
grant select, insert, update, delete on table public.cashbook_entries to authenticated;

create index if not exists cashbook_entries_user_id_idx
  on public.cashbook_entries (user_id);

create index if not exists cashbook_entries_business_id_idx
  on public.cashbook_entries (business_id);

create index if not exists cashbook_entries_business_date_idx
  on public.cashbook_entries (business_id, entry_date desc);

create index if not exists cashbook_entries_business_kind_idx
  on public.cashbook_entries (business_id, kind);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_cashbook_entries_set_updated_at on public.cashbook_entries;
create trigger trg_cashbook_entries_set_updated_at
before update on public.cashbook_entries
for each row execute function public.set_updated_at();

create or replace function public.get_cashbook_overview(
  p_user_id text,
  p_business_id uuid,
  p_today date default current_date
)
returns table (
  current_cash numeric,
  today_in numeric,
  today_out numeric
)
language sql
security invoker
as $$
  with scoped as (
    select
      direction,
      amount,
      entry_date
    from public.cashbook_entries
    where user_id = p_user_id
      and business_id = p_business_id
      and is_active = true
  )
  select
    coalesce(sum(case when direction = 'in' then amount else -amount end), 0)::numeric(14,2) as current_cash,
    coalesce(sum(case when direction = 'in' and entry_date = p_today then amount else 0 end), 0)::numeric(14,2) as today_in,
    coalesce(sum(case when direction = 'out' and entry_date = p_today then amount else 0 end), 0)::numeric(14,2) as today_out
  from scoped;
$$;

grant execute on function public.get_cashbook_overview(text, uuid, date) to authenticated;
