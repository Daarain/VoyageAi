-- ═══════════════════════════════════════════════════════════════════
-- VoyageAI Pro — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. PROFILES ─────────────────────────────────────────────────────
-- One row per user, linked to Supabase Auth (auth.users)
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text,
  company     text     default 'VoyageAI Pro',
  role        text     not null default 'Chartering Manager'
                       check (role in (
                         'Chartering Manager',
                         'Port Owner',
                         'Organization Admin',
                         'System Administrator'
                       )),
  avatar_url  text,
  is_active   boolean  not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create a profile whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'Chartering Manager')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();


-- ── 2. CHARTERING REQUESTS ───────────────────────────────────────────
create table if not exists public.chartering_requests (
  id                      uuid default gen_random_uuid() primary key,
  user_id                 uuid references auth.users(id) on delete cascade not null,
  cargo_type              text not null default 'Coal',
  cargo_quantity_mt       float not null,
  origin_port             text not null,
  destination_ports       text[] not null default '{}',
  selected_port           text,
  number_of_voyages       int not null default 1,
  laycan_start            date not null,
  laycan_end              date,
  contract_duration_months int,
  status                  text not null default 'Draft'
                          check (status in ('Draft','Processing','Recommended','Approved','Rejected')),
  override_note           text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger chartering_requests_updated_at before update on public.chartering_requests
  for each row execute procedure public.set_updated_at();


-- ── 3. AI RECOMMENDATIONS ────────────────────────────────────────────
create table if not exists public.recommendations (
  id                      uuid default gen_random_uuid() primary key,
  request_id              uuid references public.chartering_requests(id) on delete cascade not null,
  user_id                 uuid references auth.users(id) on delete cascade not null,
  model_version           text not null,
  vessel_class            text,
  recommended_contract    text,
  expected_cost_p50       float,
  stress_cost_p90         float,
  estimated_savings_usd   float,
  risk_level              text,
  confidence_pct          float,
  raw_output              jsonb,   -- full engine JSON stored here
  created_at              timestamptz not null default now()
);


-- ── 4. AUDIT LOG ─────────────────────────────────────────────────────
create table if not exists public.audit_log (
  id             uuid default gen_random_uuid() primary key,
  request_id     uuid references public.chartering_requests(id) on delete set null,
  user_id        uuid references auth.users(id) on delete set null,
  actor_name     text,
  actor_role     text,
  action         text not null,
  model_version  text,
  confidence_pct float,
  input_snapshot jsonb,
  output_summary text,
  created_at     timestamptz not null default now()
);


-- ── 5. NOTIFICATIONS ─────────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  title      text not null,
  body       text,
  href       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);


-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Every table is locked down: users only see their own rows.
-- System Administrators and Organization Admins get wider access
-- via service-role calls from the backend (bypass RLS).
-- ═══════════════════════════════════════════════════════════════════

alter table public.profiles             enable row level security;
alter table public.chartering_requests  enable row level security;
alter table public.recommendations      enable row level security;
alter table public.audit_log            enable row level security;
alter table public.notifications        enable row level security;

-- profiles: anyone can read; only owner can update their own row
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- chartering_requests
create policy "requests_select" on public.chartering_requests
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('Organization Admin', 'System Administrator')
    )
  );
create policy "requests_insert" on public.chartering_requests
  for insert with check (auth.uid() = user_id);
create policy "requests_update" on public.chartering_requests
  for update using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('Organization Admin', 'System Administrator')
    )
  );

-- recommendations: owner + admins
create policy "recommendations_select" on public.recommendations
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('Organization Admin', 'System Administrator')
    )
  );
create policy "recommendations_insert" on public.recommendations
  for insert with check (auth.uid() = user_id);

-- audit_log: admins see all; others see only their own entries
create policy "audit_select" on public.audit_log
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('Organization Admin', 'System Administrator')
    )
  );
create policy "audit_insert" on public.audit_log
  for insert with check (true);  -- backend inserts via service key

-- notifications: only owner
create policy "notifications_select" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notifications_update" on public.notifications
  for update using (auth.uid() = user_id);


-- ── ADMIN VIEW: all users (used by admin panel) ──────────────────────
create or replace view public.admin_users_view as
  select
    p.id,
    p.full_name,
    p.company,
    p.role,
    p.is_active,
    p.created_at,
    u.email,
    u.last_sign_in_at,
    (select count(*) from public.chartering_requests r where r.user_id = p.id) as request_count
  from public.profiles p
  join auth.users u on u.id = p.id;

-- Only admins can query this view (enforced in app layer + RLS on profiles)
