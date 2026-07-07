-- Phase 1 Plan 02: initial schema
-- orders / order_items / order_status_history / processed_webhook_events
-- + admin_users email allowlist + is_admin() resolver + RLS
--
-- CLAUDE.md enum values win over ARCHITECTURE.md's text values:
-- order_status = pending | paid | confirmed | shipped

create type order_status as enum ('pending', 'paid', 'confirmed', 'shipped');

-- ============================================================================
-- Tables
-- ============================================================================

create table orders (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_ref text not null,
  status order_status not null default 'pending',
  customer_name text not null,
  customer_email text not null,
  amount_total_ore integer not null,
  currency text not null default 'NOK',
  tracking_number text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_ref)
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  league text not null,
  team text not null,
  season text not null,
  size text not null,
  patches text[] not null default '{}',
  custom_name text null,
  custom_number text null,
  unit_price_ore integer not null,
  quantity integer not null
);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  status order_status not null,
  note text null,
  created_at timestamptz not null default now()
);

create table processed_webhook_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid null references orders (id) on delete set null,
  provider text not null,
  provider_event_id text not null,
  channel text not null,
  event text not null,
  status text not null,
  error text null,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

-- Admin allowlist: stable, email-keyed. Plan 04's seed script inserts the
-- ADMIN_EMAIL row alongside auth.admin.createUser(). Only the service-role
-- key (bypasses RLS) reads/writes this table.
create table admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- is_admin() resolver
-- ============================================================================
-- SECURITY DEFINER so the policy can consult admin_users without recursing
-- into admin_users' own RLS. search_path pinned per Postgres SECURITY
-- DEFINER hardening guidance. Resolves against the JWT email claim, never a
-- hardcoded placeholder UUID (the seeded admin's auth.uid() is unknowable at
-- migration-write time).
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admin_users where email = (auth.jwt() ->> 'email')
  );
$$;

-- ============================================================================
-- RLS
-- ============================================================================

alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table processed_webhook_events enable row level security;
alter table admin_users enable row level security;

-- orders: admin-only read/update. No anon/public INSERT policy — order rows
-- are only ever created by server code using the service-role key (Phase
-- 3/4 webhook handlers), which bypasses RLS entirely and intentionally.
create policy "admin can read all orders"
  on orders for select
  to authenticated
  using (public.is_admin());

create policy "admin can update orders"
  on orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- order_items: admin-only read, scoped the same way.
create policy "admin can read all order items"
  on order_items for select
  to authenticated
  using (public.is_admin());

-- order_status_history: admin-only read.
create policy "admin can read all order status history"
  on order_status_history for select
  to authenticated
  using (public.is_admin());

-- processed_webhook_events: admin-only read (diagnostic visibility only).
create policy "admin can read all processed webhook events"
  on processed_webhook_events for select
  to authenticated
  using (public.is_admin());

-- admin_users: no anon/public policy at all. Only the service-role key
-- (which bypasses RLS) reads/writes this table; Plan 04's seed script uses
-- it to insert the single admin email.
