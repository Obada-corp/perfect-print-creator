-- ============================================================
-- Cloud sync setup for the Control Platform
-- Run this ONCE in your Supabase SQL Editor
--   (https://supabase.com/dashboard/project/_/sql)
-- ============================================================
-- It creates a single shared row that holds the whole app state
-- as JSON. The anon role gets full read/write so any browser can
-- load and update it. Realtime is enabled so all tabs stay in sync.
-- ============================================================

create table if not exists public.app_state (
  id          text primary key,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Data API access (required since Supabase no longer grants by default)
grant select, insert, update, delete on public.app_state to anon;
grant select, insert, update, delete on public.app_state to authenticated;
grant all on public.app_state to service_role;

alter table public.app_state enable row level security;

drop policy if exists "app_state public read"   on public.app_state;
drop policy if exists "app_state public write"  on public.app_state;
drop policy if exists "app_state public update" on public.app_state;
drop policy if exists "app_state public delete" on public.app_state;

create policy "app_state public read"   on public.app_state for select using (true);
create policy "app_state public write"  on public.app_state for insert with check (true);
create policy "app_state public update" on public.app_state for update using (true) with check (true);
create policy "app_state public delete" on public.app_state for delete using (true);

-- Seed the shared row
insert into public.app_state (id, data) values ('shared', '{}'::jsonb)
on conflict (id) do nothing;

-- Enable Realtime for this table
alter publication supabase_realtime add table public.app_state;
