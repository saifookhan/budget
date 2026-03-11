-- Run this in Supabase Dashboard → SQL Editor to create the budget_data table.
-- Then your budget will sync to your account and persist when you leave or switch devices.

create table if not exists public.budget_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.budget_data enable row level security;

create policy "Users can read own budget_data"
  on public.budget_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own budget_data"
  on public.budget_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own budget_data"
  on public.budget_data for update
  using (auth.uid() = user_id);

create policy "Users can delete own budget_data"
  on public.budget_data for delete
  using (auth.uid() = user_id);
