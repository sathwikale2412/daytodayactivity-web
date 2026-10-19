-- Day to Day Activity — Supabase schema
-- Run this once in the Supabase SQL editor of your project.
-- It creates the tables, per-user Row Level Security, and a trigger that
-- provisions a profile row whenever a new account signs up.

create extension if not exists "pgcrypto";

-- Profiles (one row per auth user)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  daily_goal_count int not null default 5,
  sound_enabled boolean not null default true,
  notifications_enabled boolean not null default true,
  theme text not null default 'dark',
  created_at timestamptz not null default now()
);

-- Tasks (mirrors the Android Room TaskItem)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  description text not null default '',
  date text not null,
  start_time bigint not null,
  end_time bigint not null,
  is_completed boolean not null default false,
  category text not null default 'General',
  created_at timestamptz not null default now()
);

-- Routine items (mirrors the Android Room RoutineItem)
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  start_time_hour int not null,
  start_time_minute int not null default 0,
  end_time_hour int not null,
  end_time_minute int not null default 0,
  category text not null default 'General'
);

create index if not exists tasks_user_date_idx on public.tasks (user_id, date);
create index if not exists routines_user_idx on public.routines (user_id);

-- Row Level Security: every user can only ever touch their own rows.
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.routines enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own routines" on public.routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-provision a profile row on signup, using the name from auth metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
