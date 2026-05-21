-- 用語集テーブル
create table if not exists public.glossary (
  id             uuid        primary key default gen_random_uuid(),
  session_id     uuid        not null references public.sessions(id) on delete cascade,
  term           text        not null,
  definition     text        not null,
  display_order  int         not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid        not null references auth.users(id) on delete cascade
);

alter table public.glossary enable row level security;

drop policy if exists "glossary: public read"   on public.glossary;
drop policy if exists "glossary: admin insert"  on public.glossary;
drop policy if exists "glossary: admin update"  on public.glossary;
drop policy if exists "glossary: admin delete"  on public.glossary;

create policy "glossary: public read"
  on public.glossary for select using (true);

create policy "glossary: admin insert"
  on public.glossary for insert
  with check (get_my_role() = 'admin');

create policy "glossary: admin update"
  on public.glossary for update
  using (get_my_role() = 'admin');

create policy "glossary: admin delete"
  on public.glossary for delete
  using (get_my_role() = 'admin');
