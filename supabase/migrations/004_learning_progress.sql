-- ============================================================
-- ユーザーの学習進捗テーブル
-- ============================================================
create table if not exists public.user_session_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  session_id  uuid not null references public.sessions(id) on delete cascade,
  status      text not null default 'in_progress'
              check (status in ('in_progress', 'completed')),
  started_at  timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, session_id)
);

alter table public.user_session_progress enable row level security;

create policy "progress: own read" on public.user_session_progress
  for select using (auth.uid() = user_id);

create policy "progress: own insert" on public.user_session_progress
  for insert with check (auth.uid() = user_id);

create policy "progress: own update" on public.user_session_progress
  for update using (auth.uid() = user_id);
