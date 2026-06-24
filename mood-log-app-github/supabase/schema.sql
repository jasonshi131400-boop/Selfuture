-- Mood Log schema
-- Run this once in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query)

create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mood text not null check (mood in ('great', 'good', 'okay', 'low', 'rough')),
  note text not null default '',
  saved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists mood_entries_user_id_saved_at_idx
  on public.mood_entries (user_id, saved_at desc);

-- Row Level Security: this is what actually keeps each person's entries
-- private. Even if the frontend code had a bug, the database itself
-- refuses to return or modify rows that don't belong to the requester.
alter table public.mood_entries enable row level security;

create policy "Users can view their own entries"
  on public.mood_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own entries"
  on public.mood_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own entries"
  on public.mood_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own entries"
  on public.mood_entries for delete
  using (auth.uid() = user_id);
