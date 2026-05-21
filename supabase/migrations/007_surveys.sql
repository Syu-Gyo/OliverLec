-- ─────────────────────────────────────────
-- アンケート（サーベイ）テーブル群
-- ─────────────────────────────────────────

-- 1. surveys（講習会ごとに 1 件）
create table if not exists public.surveys (
  id           uuid        primary key default gen_random_uuid(),
  session_id   uuid        not null references public.sessions(id) on delete cascade,
  title        text        not null default 'アンケート',
  description  text,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid        not null references auth.users(id) on delete cascade
);

alter table public.surveys enable row level security;

drop policy if exists "surveys: public read"   on public.surveys;
drop policy if exists "surveys: admin insert"  on public.surveys;
drop policy if exists "surveys: admin update"  on public.surveys;
drop policy if exists "surveys: admin delete"  on public.surveys;

create policy "surveys: public read"   on public.surveys for select using (true);
create policy "surveys: admin insert"  on public.surveys for insert with check (get_my_role() = 'admin');
create policy "surveys: admin update"  on public.surveys for update using (get_my_role() = 'admin');
create policy "surveys: admin delete"  on public.surveys for delete using (get_my_role() = 'admin');

-- 2. survey_questions（質問）
create table if not exists public.survey_questions (
  id             uuid    primary key default gen_random_uuid(),
  survey_id      uuid    not null references public.surveys(id) on delete cascade,
  question_text  text    not null,
  question_type  text    not null check (question_type in ('rating','text','choice')),
  options        jsonb   not null default '[]',  -- choice 用: ["選択肢A","選択肢B",...]
  display_order  int     not null default 0,
  required       boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table public.survey_questions enable row level security;

drop policy if exists "survey_questions: public read"   on public.survey_questions;
drop policy if exists "survey_questions: admin insert"  on public.survey_questions;
drop policy if exists "survey_questions: admin update"  on public.survey_questions;
drop policy if exists "survey_questions: admin delete"  on public.survey_questions;

create policy "survey_questions: public read"   on public.survey_questions for select using (true);
create policy "survey_questions: admin insert"  on public.survey_questions for insert with check (get_my_role() = 'admin');
create policy "survey_questions: admin update"  on public.survey_questions for update using (get_my_role() = 'admin');
create policy "survey_questions: admin delete"  on public.survey_questions for delete using (get_my_role() = 'admin');

-- 3. survey_responses（回答 — ユーザーごと・サーベイごとに 1 件）
create table if not exists public.survey_responses (
  id           uuid        primary key default gen_random_uuid(),
  survey_id    uuid        not null references public.surveys(id) on delete cascade,
  session_id   uuid        not null references public.sessions(id) on delete cascade,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  answers      jsonb       not null default '{}',  -- { "question_id": value }
  submitted_at timestamptz not null default now(),
  unique(survey_id, user_id)
);

alter table public.survey_responses enable row level security;

drop policy if exists "survey_responses: insert own"   on public.survey_responses;
drop policy if exists "survey_responses: select"       on public.survey_responses;

create policy "survey_responses: insert own"
  on public.survey_responses for insert
  with check (auth.uid() = user_id);

create policy "survey_responses: select"
  on public.survey_responses for select
  using (auth.uid() = user_id or get_my_role() = 'admin');
