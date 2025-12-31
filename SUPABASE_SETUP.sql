-- RUN THIS IN THE SUPABASE SQL EDITOR

-- 1. Create Tables (if they don't exist)
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null,
  note text,
  created_at timestamptz default now()
);

create table if not exists notes (
  id bigint primary key generated always as identity,
  text text not null,
  color text,
  rotation text,
  created_at timestamptz default now()
);

create table if not exists shopping_list (
  id text primary key,
  text text not null,
  checked boolean default false,
  category text default 'other',
  created_at timestamptz default now()
);

-- 2. Open Permissions (Enable RLS but allow everything for the Home Hub)
alter table projects enable row level security;
alter table notes enable row level security;
alter table shopping_list enable row level security;

-- Drop existing policies to avoid conflicts if you run this twice
drop policy if exists "Allow Public Access" on projects;
drop policy if exists "Allow Public Access" on notes;
drop policy if exists "Allow Public Access" on shopping_list;

-- Create policies that allow Anyone (Anon) to Read/Write
create policy "Allow Public Access" on projects for all using (true) with check (true);
create policy "Allow Public Access" on notes for all using (true) with check (true);
create policy "Allow Public Access" on shopping_list for all using (true) with check (true);
