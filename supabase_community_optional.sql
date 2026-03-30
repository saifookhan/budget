-- Optional schema for a richer Community (tips + feed + opt-in profiles).
-- Run in Supabase SQL Editor when you’re ready; not required for the current static UI.

-- Public tips curated by you (or later by moderation)
create table if not exists public.community_tips (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  title text not null,
  body text not null,
  locale text not null default 'en',
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.community_tips enable row level security;

create policy "community_tips_read_all"
  on public.community_tips for select
  using (true);

-- Short stories / posts (author = auth user when you wire the app)
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  tag text,
  body text not null,
  published boolean not null default false,
  created_at timestamptz default now()
);

alter table public.community_posts enable row level security;

create policy "community_posts_read_published"
  on public.community_posts for select
  using (published = true);

create policy "community_posts_insert_own"
  on public.community_posts for insert
  with check (auth.uid() = author_id);

create policy "community_posts_update_own"
  on public.community_posts for update
  using (auth.uid() = author_id);

-- Opt-in directory for discover / future matching
create table if not exists public.community_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  bio text,
  topics text[] default '{}',
  opt_in_discover boolean not null default false,
  updated_at timestamptz default now()
);

alter table public.community_profiles enable row level security;

create policy "community_profiles_read_opted_in"
  on public.community_profiles for select
  using (opt_in_discover = true);

create policy "community_profiles_upsert_own"
  on public.community_profiles for insert
  with check (auth.uid() = user_id);

create policy "community_profiles_update_own"
  on public.community_profiles for update
  using (auth.uid() = user_id);

-- Messaging (minimal stub — expand with threads, blocks, reports before production)
-- create table if not exists public.community_messages (...);
