-- Create courses table
create table if not exists public.courses (
  id text primary key,
  title text not null,
  summary text not null,
  "priceYD" text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS and allow anon to read/insert
alter table public.courses enable row level security;

do $$ begin
  create policy "Allow anon select courses"
    on public.courses for select
    to anon
    using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Allow anon insert courses"
    on public.courses for insert
    to anon
    with check (true);
exception when duplicate_object then null; end $$;

