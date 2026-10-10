-- Senior Interview Lab: cloud progress sync.
--
-- Paste into the Supabase SQL editor of the project configured in assets/cloud-config.js.
-- Idempotent: safe to re-run, and re-running never touches stored progress. It adds one table and
-- two functions and only depends on auth.users, so it can live next to other apps' tables.
--
-- Design (same shape as a proven compare-and-swap cloud-save design):
--   * one row per user holding one atomic snapshot of the browser's progress (jsonb)
--   * a server-controlled, monotonic `generation` decides ordering. Device clocks never do
--   * row-level security is the security boundary: the browser holds only the publishable key
--     and the signed-in user's JWT, so every policy is scoped to auth.uid()
--   * constraints are deliberately minimal (a size cap). Strict format checks on client-written
--     columns have broken real installs before; RLS and the cap are the actual protection.

create table if not exists public.lab_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  format_version integer not null default 1,
  generation bigint not null default 1,
  device_id text not null,
  content_hash text not null,
  updated_at timestamptz not null default now()
);

-- A real snapshot is tens of kilobytes (code drafts make it larger). The cap is far above any honest
-- snapshot and exists so a tampered client cannot quietly eat the project's storage quota.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'lab_progress_state_size' and conrelid = 'public.lab_progress'::regclass
  ) then
    alter table public.lab_progress
      add constraint lab_progress_state_size check (pg_column_size(state) <= 4 * 1024 * 1024);
  end if;
end $$;

alter table public.lab_progress enable row level security;

-- Stated explicitly so the schema does not depend on the project's default privileges.
-- Supabase grants anon access to new public tables by default; RLS would hide every row anyway,
-- but anon has no business touching this table at all.
revoke all on public.lab_progress from anon;
grant select, insert, update, delete on public.lab_progress to authenticated;

drop policy if exists "users read their own progress" on public.lab_progress;
create policy "users read their own progress"
on public.lab_progress for select
using (auth.uid() = user_id);

drop policy if exists "users create their own progress" on public.lab_progress;
create policy "users create their own progress"
on public.lab_progress for insert
with check (auth.uid() = user_id);

drop policy if exists "users update their own progress" on public.lab_progress;
create policy "users update their own progress"
on public.lab_progress for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Lets a user delete their own cloud copy ("reset everything" and data-removal requests).
drop policy if exists "users delete their own progress" on public.lab_progress;
create policy "users delete their own progress"
on public.lab_progress for delete
using (auth.uid() = user_id);

/*
 * Compare-and-swap upload. Returns exactly one row:
 *   ok           the write landed; result_generation is the new generation
 *   unchanged    the row already holds this exact snapshot; nothing was written
 *   conflict     another device has written since (or the caller expected a row that is not there)
 *   stale_client this build is older than the format stored in the row; it must update
 *
 * Output columns are prefixed so the body can reference table columns without plpgsql resolving
 * them to the OUT parameters. The user comes from auth.uid(); the client never sends a user id.
 */
create or replace function public.lab_save_progress(
  p_expected_generation bigint,
  p_state jsonb,
  p_format_version integer,
  p_device_id text,
  p_content_hash text
)
returns table (result_status text, result_generation bigint, result_updated_at timestamptz)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_current public.lab_progress%rowtype;
  v_gen bigint;
  v_at timestamptz;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into v_current from public.lab_progress where user_id = v_uid;

  -- No row yet: a new one, but only if the caller did not believe there was one.
  if v_current.user_id is null then
    if p_expected_generation is not null then
      return query select 'conflict'::text, null::bigint, null::timestamptz;
      return;
    end if;
    insert into public.lab_progress (user_id, state, format_version, generation, device_id, content_hash)
    values (v_uid, p_state, p_format_version, 1, p_device_id, p_content_hash)
    returning lab_progress.generation, lab_progress.updated_at into v_gen, v_at;
    return query select 'ok'::text, v_gen, v_at;
    return;
  end if;

  -- An older build must not write over a snapshot in a format it cannot fully read.
  if p_format_version < v_current.format_version then
    return query select 'stale_client'::text, v_current.generation, v_current.updated_at;
    return;
  end if;

  -- Identical content costs no generation (UI-only changes reach the same save path).
  if v_current.content_hash = p_content_hash then
    return query select 'unchanged'::text, v_current.generation, v_current.updated_at;
    return;
  end if;

  if p_expected_generation is null or p_expected_generation <> v_current.generation then
    return query select 'conflict'::text, v_current.generation, v_current.updated_at;
    return;
  end if;

  update public.lab_progress
  set state = p_state,
      format_version = p_format_version,
      generation = v_current.generation + 1,
      device_id = p_device_id,
      content_hash = p_content_hash,
      updated_at = now()
  where user_id = v_uid and generation = p_expected_generation
  returning lab_progress.generation, lab_progress.updated_at into v_gen, v_at;

  -- Lost a race between the read above and the update.
  if v_gen is null then
    select generation, updated_at into v_gen, v_at from public.lab_progress where user_id = v_uid;
    return query select 'conflict'::text, v_gen, v_at;
    return;
  end if;

  return query select 'ok'::text, v_gen, v_at;
end;
$$;

revoke all on function public.lab_save_progress(bigint, jsonb, integer, text, text) from public, anon;
grant execute on function public.lab_save_progress(bigint, jsonb, integer, text, text) to authenticated;
