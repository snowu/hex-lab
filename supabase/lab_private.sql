-- Private study material for the Senior Interview Lab: readable only by ONE account, writable by nobody through the API.
-- The material itself is NOT in this repo (the repo is public). It lives in private/seed.sql on the owner's machine
-- (gitignored) and is pasted into the SQL editor, which runs as the database owner and therefore bypasses RLS.
--
-- Run this file once in the Supabase SQL editor, then run private/seed.sql. Both are idempotent.

create table if not exists public.lab_private (
  id         text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.lab_private enable row level security;
alter table public.lab_private force row level security;

-- No API role gets anything by default; then give back exactly SELECT to signed-in users, and let the policy narrow it.
revoke all on public.lab_private from anon, authenticated;
grant select on public.lab_private to authenticated;

drop policy if exists "owner reads private material" on public.lab_private;
create policy "owner reads private material" on public.lab_private
  for select to authenticated
  using ( (auth.jwt() ->> 'email') = 'zancato.t@gmail.com' );
-- There is deliberately no insert/update/delete policy: with RLS on, the API can never write to this table.
